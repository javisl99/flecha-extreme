do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'reserva_asignacion_tramos_estado'
  ) then
    create type public.reserva_asignacion_tramos_estado as enum ('no_aplica', 'pendiente', 'parcial', 'completa');
  end if;
end;
$$;

alter table public.reserva_servicio
  add column if not exists servicio_id uuid references public.servicio(id) on delete set null,
  add column if not exists tarifa_id uuid references public.servicio_tarifa(id) on delete set null,
  add column if not exists cantidad_reservada integer not null default 1,
  add column if not exists numero_personas_reserva integer,
  add column if not exists duracion_total_min integer,
  add column if not exists estado_asignacion_tramos public.reserva_asignacion_tramos_estado not null default 'no_aplica';

update public.reserva_servicio r
set
  servicio_id = coalesce(
    r.servicio_id,
    (
      select i.servicio_id
      from public.reserva_servicio_item i
      where i.reserva_id = r.id
      order by i.inicio asc
      limit 1
    )
  ),
  tarifa_id = coalesce(
    r.tarifa_id,
    (
      select i.tarifa_id
      from public.reserva_servicio_item i
      where i.reserva_id = r.id
      order by i.inicio asc
      limit 1
    )
  ),
  cantidad_reservada = greatest(
    coalesce(
      nullif(r.cantidad_reservada, 0),
      (
        select i.cantidad
        from public.reserva_servicio_item i
        where i.reserva_id = r.id
        order by i.inicio asc
        limit 1
      ),
      1
    ),
    1
  ),
  numero_personas_reserva = coalesce(
    r.numero_personas_reserva,
    (
      select nullif(i.metadata ->> 'numero_personas', '')::integer
      from public.reserva_servicio_item i
      where i.reserva_id = r.id
        and i.metadata ? 'numero_personas'
      order by i.inicio asc
      limit 1
    )
  )
where exists (
  select 1
  from public.reserva_servicio_item i
  where i.reserva_id = r.id
);

create or replace function public.fn_recalcular_totales_reserva_servicio()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_reserva_id uuid;
  v_estado_asignacion public.reserva_asignacion_tramos_estado;
  v_duracion_total integer;
  v_duracion_asignada numeric;
begin
  v_reserva_id := coalesce(new.reserva_id, old.reserva_id);

  select r.estado_asignacion_tramos, r.duracion_total_min
  into v_estado_asignacion, v_duracion_total
  from public.reserva_servicio r
  where r.id = v_reserva_id;

  if found and v_estado_asignacion <> 'no_aplica' then
    select coalesce(sum(extract(epoch from (i.fin - i.inicio)) / 60.0), 0)
    into v_duracion_asignada
    from public.reserva_servicio_item i
    where i.reserva_id = v_reserva_id
      and i.estado <> 'cancelada';

    update public.reserva_servicio
    set estado_asignacion_tramos = (
          case
            when coalesce(v_duracion_total, 0) <= 0 then 'pendiente'
            when coalesce(v_duracion_asignada, 0) <= 0 then 'pendiente'
            when v_duracion_asignada < v_duracion_total then 'parcial'
            else 'completa'
          end
        )::public.reserva_asignacion_tramos_estado,
        updated_at = timezone('utc', now())
    where id = v_reserva_id;

    return coalesce(new, old);
  end if;

  update public.reserva_servicio r
  set total_bruto = coalesce(s.total_bruto, 0),
      total_descuento = coalesce(s.total_descuento, 0),
      total_neto = coalesce(s.total_neto, 0),
      deposito_total_requerido = coalesce(s.deposito_req, 0),
      deposito_total_cobrado = coalesce(s.deposito_cob, 0),
      updated_at = timezone('utc', now())
  from (
    select reserva_id,
           sum((precio_unitario * cantidad)) filter (where estado <> 'cancelada') as total_bruto,
           sum((descuento_unitario * cantidad)) filter (where estado <> 'cancelada') as total_descuento,
           sum(subtotal) filter (where estado <> 'cancelada') as total_neto,
           sum(deposito_requerido) filter (where estado <> 'cancelada') as deposito_req,
           sum(deposito_cobrado) filter (where estado <> 'cancelada') as deposito_cob
    from public.reserva_servicio_item
    where reserva_id = v_reserva_id
    group by reserva_id
  ) s
  where r.id = v_reserva_id;

  if not found then
    update public.reserva_servicio
    set total_bruto = 0,
        total_descuento = 0,
        total_neto = 0,
        deposito_total_requerido = 0,
        deposito_total_cobrado = 0,
        updated_at = timezone('utc', now())
    where id = v_reserva_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.fn_validar_asignacion_tramos_reserva_servicio_item()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_servicio_id uuid;
  v_tarifa_id uuid;
  v_duracion_total integer;
  v_estado_asignacion public.reserva_asignacion_tramos_estado;
  v_duracion_actual numeric;
  v_duracion_nueva numeric;
begin
  select r.servicio_id, r.tarifa_id, r.duracion_total_min, r.estado_asignacion_tramos
  into v_servicio_id, v_tarifa_id, v_duracion_total, v_estado_asignacion
  from public.reserva_servicio r
  where r.id = new.reserva_id;

  if not found or v_estado_asignacion = 'no_aplica' then
    return new;
  end if;

  if v_servicio_id is null then
    raise exception 'La reserva % no tiene servicio de cabecera configurado.', new.reserva_id;
  end if;

  if new.servicio_id <> v_servicio_id then
    raise exception 'El tramo no pertenece al servicio configurado en la reserva.';
  end if;

  if v_tarifa_id is not null and new.tarifa_id is distinct from v_tarifa_id then
    raise exception 'El tramo no pertenece a la tarifa configurada en la reserva.';
  end if;

  if coalesce(v_duracion_total, 0) <= 0 then
    raise exception 'La reserva no tiene duración total configurada para asignar tramos.';
  end if;

  if new.estado = 'cancelada' then
    return new;
  end if;

  v_duracion_nueva := extract(epoch from (new.fin - new.inicio)) / 60.0;

  select coalesce(sum(extract(epoch from (i.fin - i.inicio)) / 60.0), 0)
  into v_duracion_actual
  from public.reserva_servicio_item i
  where i.reserva_id = new.reserva_id
    and i.estado <> 'cancelada'
    and (tg_op = 'INSERT' or i.id <> new.id);

  if v_duracion_actual + v_duracion_nueva > v_duracion_total then
    raise exception 'Los tramos asignados superan la duración pendiente del curso.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_asignacion_tramos_reserva_servicio_item on public.reserva_servicio_item;

create trigger trg_validar_asignacion_tramos_reserva_servicio_item
before insert or update on public.reserva_servicio_item
for each row execute function public.fn_validar_asignacion_tramos_reserva_servicio_item();
