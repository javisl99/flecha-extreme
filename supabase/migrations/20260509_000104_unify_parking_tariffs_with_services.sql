do $$
declare
  v_empresa_id uuid;
  v_servicio_tabla uuid;
  v_servicio_kayak uuid;
  v_servicio_embarcacion uuid;
begin
  select id
  into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No existe empresa Flecha Extreme';
  end if;

  insert into public.servicio (
    empresa_id,
    codigo,
    nombre,
    categoria,
    modo_precio,
    modo_agenda,
    requiere_sesion,
    reservable,
    activo,
    capacidad_max,
    duracion_minima_min,
    deposito_permitido,
    deposito_obligatorio,
    deposito_default,
    notas,
    metadata
  ) values
    (
      v_empresa_id,
      'PARKING_TABLA',
      'Parking Tabla',
      'otro',
      'fijo',
      'libre',
      false,
      false,
      true,
      null,
      null,
      false,
      false,
      0,
      'Tarifas de parking para tablas',
      '{"parking_config": true, "parking_tipo": "tabla"}'::jsonb
    ),
    (
      v_empresa_id,
      'PARKING_KAYAK',
      'Parking Kayak',
      'otro',
      'fijo',
      'libre',
      false,
      false,
      true,
      null,
      null,
      false,
      false,
      0,
      'Tarifas de parking para kayaks',
      '{"parking_config": true, "parking_tipo": "kayak"}'::jsonb
    ),
    (
      v_empresa_id,
      'PARKING_EMBARCACION',
      'Parking Embarcacion',
      'otro',
      'fijo',
      'libre',
      false,
      false,
      true,
      null,
      null,
      false,
      false,
      0,
      'Tarifas de parking para embarcaciones',
      '{"parking_config": true, "parking_tipo": "embarcacion"}'::jsonb
    )
  on conflict (empresa_id, codigo) do update set
    nombre = excluded.nombre,
    categoria = excluded.categoria,
    modo_precio = excluded.modo_precio,
    modo_agenda = excluded.modo_agenda,
    requiere_sesion = excluded.requiere_sesion,
    reservable = excluded.reservable,
    activo = excluded.activo,
    capacidad_max = excluded.capacidad_max,
    duracion_minima_min = excluded.duracion_minima_min,
    deposito_permitido = excluded.deposito_permitido,
    deposito_obligatorio = excluded.deposito_obligatorio,
    deposito_default = excluded.deposito_default,
    notas = excluded.notas,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  select id into v_servicio_tabla
  from public.servicio
  where empresa_id = v_empresa_id and codigo = 'PARKING_TABLA';

  select id into v_servicio_kayak
  from public.servicio
  where empresa_id = v_empresa_id and codigo = 'PARKING_KAYAK';

  select id into v_servicio_embarcacion
  from public.servicio
  where empresa_id = v_empresa_id and codigo = 'PARKING_EMBARCACION';

  insert into public.servicio_tarifa (
    servicio_id,
    codigo,
    nombre_tarifa,
    duracion_min,
    precio,
    moneda,
    deposito_requerido,
    incluye_deposito_en_precio,
    vigencia_desde,
    activo,
    metadata
  ) values
    (
      v_servicio_tabla,
      'PARK_QNA',
      'Parking quincena',
      null,
      25,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "quincena", "parking_tipo": "tabla"}'::jsonb
    ),
    (
      v_servicio_tabla,
      'PARK_MES',
      'Parking mensual',
      null,
      30,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "mes", "parking_tipo": "tabla"}'::jsonb
    ),
    (
      v_servicio_kayak,
      'PARK_QNA',
      'Parking quincena',
      null,
      35,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "quincena", "parking_tipo": "kayak"}'::jsonb
    ),
    (
      v_servicio_kayak,
      'PARK_MES',
      'Parking mensual',
      null,
      50,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "mes", "parking_tipo": "kayak"}'::jsonb
    ),
    (
      v_servicio_embarcacion,
      'PARK_QNA',
      'Parking quincena',
      null,
      100,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "quincena", "parking_tipo": "embarcacion"}'::jsonb
    ),
    (
      v_servicio_embarcacion,
      'PARK_MES',
      'Parking mensual',
      null,
      150,
      'EUR',
      0,
      true,
      current_date,
      true,
      '{"parking_periodo": "mes", "parking_tipo": "embarcacion"}'::jsonb
    )
  on conflict (servicio_id, codigo, vigencia_desde) do update set
    nombre_tarifa = excluded.nombre_tarifa,
    duracion_min = excluded.duracion_min,
    precio = excluded.precio,
    moneda = excluded.moneda,
    deposito_requerido = excluded.deposito_requerido,
    incluye_deposito_en_precio = excluded.incluye_deposito_en_precio,
    activo = excluded.activo,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  update public.parking_reserva pr
  set tarifa_id = st.id
  from public.parking_tarifa pt
  join public.servicio s
    on s.empresa_id = pt.empresa_id
   and s.codigo = case pt.tipo
     when 'tabla' then 'PARKING_TABLA'
     when 'kayak' then 'PARKING_KAYAK'
     when 'embarcacion' then 'PARKING_EMBARCACION'
   end
  join lateral (
    select st2.id
    from public.servicio_tarifa st2
    where st2.servicio_id = s.id
      and st2.activo = true
      and coalesce(st2.metadata ->> 'parking_periodo', '') = pt.periodo::text
    order by st2.vigencia_desde desc, st2.created_at desc
    limit 1
  ) st on true
  where pr.tarifa_id = pt.id;
end;
$$;

alter table public.parking_reserva
drop constraint if exists parking_reserva_tarifa_id_fkey;

alter table public.parking_reserva
add constraint parking_reserva_tarifa_id_fkey
foreign key (tarifa_id) references public.servicio_tarifa(id) on delete restrict;

create or replace function public.fn_set_importe_parking_reserva()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_precio numeric(10,2);
begin
  select precio
  into v_precio
  from public.servicio_tarifa
  where id = new.tarifa_id;

  if v_precio is null then
    raise exception 'Tarifa de parking no encontrada';
  end if;

  new.importe_total := v_precio;
  return new;
end;
$$;

create or replace function public.rpc_crear_reserva_parking(
  p_empresa_id uuid,
  p_plaza_id uuid,
  p_cliente_id uuid,
  p_tarifa_id uuid,
  p_fecha_inicio date,
  p_estado public.parking_reserva_estado,
  p_notas text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_periodo public.parking_periodo;
  v_fecha_fin date;
  v_id uuid;
begin
  select (st.metadata ->> 'parking_periodo')::public.parking_periodo
  into v_periodo
  from public.servicio_tarifa st
  where st.id = p_tarifa_id;

  if v_periodo is null then
    raise exception 'Tarifa de parking no encontrada';
  end if;

  if v_periodo = 'quincena' then
    v_fecha_fin := p_fecha_inicio + 15;
  else
    v_fecha_fin := (p_fecha_inicio + interval '1 month')::date;
  end if;

  insert into public.parking_reserva (
    empresa_id,
    plaza_id,
    cliente_id,
    tarifa_id,
    fecha_inicio,
    fecha_fin,
    estado,
    notas,
    created_by,
    updated_by
  )
  values (
    p_empresa_id,
    p_plaza_id,
    p_cliente_id,
    p_tarifa_id,
    p_fecha_inicio,
    v_fecha_fin,
    p_estado,
    p_notas,
    public.fn_backoffice_user_id(),
    public.fn_backoffice_user_id()
  )
  returning id into v_id;

  return v_id;
end;
$$;
