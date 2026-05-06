create table if not exists public.pago_reembolso (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pago(id) on delete cascade,
  reserva_id uuid not null references public.reserva_servicio(id) on delete cascade,
  importe numeric(10,2) not null,
  metodo public.tipo_metodo_pago not null,
  metodo_pago_id uuid references public.contabilidad_metodo_pago(id) on delete restrict,
  fecha_operacion date not null default current_date,
  comentario text,
  movimiento_contable_id uuid references public.movimiento_contable(id) on delete set null,
  created_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint pago_reembolso_importe_chk check (importe > 0)
);

create index if not exists pago_reembolso_pago_idx
  on public.pago_reembolso (pago_id, created_at desc);

create index if not exists pago_reembolso_reserva_idx
  on public.pago_reembolso (reserva_id, created_at desc);

create index if not exists pago_reembolso_movimiento_idx
  on public.pago_reembolso (movimiento_contable_id);

alter table public.pago_reembolso enable row level security;

drop policy if exists pago_reembolso_select_backoffice on public.pago_reembolso;
create policy pago_reembolso_select_backoffice on public.pago_reembolso
for select using (public.fn_backoffice_can_read());

drop policy if exists pago_reembolso_insert_backoffice on public.pago_reembolso;
create policy pago_reembolso_insert_backoffice on public.pago_reembolso
for insert with check (public.fn_backoffice_can_write());

drop policy if exists pago_reembolso_update_backoffice on public.pago_reembolso;
create policy pago_reembolso_update_backoffice on public.pago_reembolso
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());

drop policy if exists pago_reembolso_delete_admin on public.pago_reembolso;
create policy pago_reembolso_delete_admin on public.pago_reembolso
for delete using (public.fn_backoffice_is_admin());

create or replace function public.rpc_cancelar_reserva_con_reembolsos(
  p_reserva_id uuid,
  p_reembolsos jsonb default '[]'::jsonb,
  p_cancelar_pendientes boolean default true,
  p_comentario text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_reserva public.reserva_servicio%rowtype;
  v_pago public.pago%rowtype;
  v_movimiento_original public.movimiento_contable%rowtype;
  v_refund_item record;
  v_metodo_pago_id uuid;
  v_cuenta_id uuid;
  v_caja public.caja_contable;
  v_metodo_contable public.metodo_contable;
  v_iva_pct numeric(5,2);
  v_base_original numeric(12,2);
  v_iva_original numeric(12,2);
  v_ratio numeric(18,10);
  v_total_reembolsado_existente numeric(10,2);
  v_total_reembolsado_actual numeric(10,2) := 0;
  v_pendientes_cancelados integer := 0;
  v_reembolsos_creados integer := 0;
  v_movimiento_reembolso_id uuid;
  v_usuario_id uuid;
begin
  if not public.fn_backoffice_can_write() then
    raise exception 'No autorizado para cancelar reservas con reembolso';
  end if;

  if p_reserva_id is null then
    raise exception 'La reserva es obligatoria';
  end if;

  if p_reembolsos is null then
    p_reembolsos := '[]'::jsonb;
  end if;

  if jsonb_typeof(p_reembolsos) <> 'array' then
    raise exception 'El payload de reembolsos debe ser un array JSON';
  end if;

  select *
  into v_reserva
  from public.reserva_servicio
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'Reserva no encontrada';
  end if;

  v_usuario_id := public.fn_backoffice_user_id();

  for v_refund_item in
    select
      (item->>'pago_id')::uuid as pago_id,
      round((item->>'importe')::numeric, 2) as importe,
      nullif(trim(item->>'comentario'), '') as comentario
    from jsonb_array_elements(p_reembolsos) as item
  loop
    if v_refund_item.pago_id is null then
      raise exception 'Cada reembolso debe incluir pago_id';
    end if;

    if v_refund_item.importe is null or v_refund_item.importe <= 0 then
      raise exception 'El importe del reembolso debe ser mayor que 0';
    end if;

    select *
    into v_pago
    from public.pago
    where id = v_refund_item.pago_id
      and origen_tipo = 'reserva'
      and origen_id = p_reserva_id
    for update;

    if not found then
      raise exception 'El pago % no pertenece a la reserva seleccionada', v_refund_item.pago_id;
    end if;

    if v_pago.estado <> 'completado' then
      raise exception 'Solo se pueden reembolsar pagos completados';
    end if;

    select coalesce(sum(pr.importe), 0)
    into v_total_reembolsado_existente
    from public.pago_reembolso pr
    where pr.pago_id = v_pago.id;

    if v_total_reembolsado_existente + v_refund_item.importe > v_pago.importe then
      raise exception
        'El reembolso supera el saldo disponible del pago. Disponible: %, solicitado: %',
        greatest(v_pago.importe - v_total_reembolsado_existente, 0),
        v_refund_item.importe;
    end if;

    select *
    into v_movimiento_original
    from public.movimiento_contable
    where id_pago = v_pago.id
    limit 1;

    if v_movimiento_original.id is not null then
      v_metodo_pago_id := coalesce(v_movimiento_original.metodo_pago_id, v_pago.metodo_pago_id, public.contabilidad_resolve_metodo_pago_id(v_pago.metodo::text));
      v_cuenta_id := coalesce(v_movimiento_original.cuenta_id, public.contabilidad_resolve_cuenta_id_desde_codigo(v_movimiento_original.caja::text));
      v_caja := v_movimiento_original.caja;
      v_metodo_contable := coalesce(v_movimiento_original.metodo, public.contabilidad_legacy_metodo_desde_metodo_pago(v_metodo_pago_id));
      v_iva_pct := coalesce(v_movimiento_original.iva_pct, 0);
      v_base_original := abs(coalesce(v_movimiento_original.base_imponible, 0));
      v_iva_original := abs(coalesce(v_movimiento_original.iva_importe, 0));
    else
      v_metodo_pago_id := coalesce(v_pago.metodo_pago_id, public.contabilidad_resolve_metodo_pago_id(v_pago.metodo::text));
      if v_metodo_pago_id is null then
        raise exception 'No se pudo resolver el metodo de pago del reembolso';
      end if;

      select cuenta_liquidacion_id
      into v_cuenta_id
      from public.contabilidad_metodo_pago
      where id = v_metodo_pago_id;

      if v_cuenta_id is null then
        v_cuenta_id := public.contabilidad_resolve_cuenta_id_desde_codigo('santander');
      end if;

      v_caja := public.contabilidad_legacy_caja_desde_cuenta(v_cuenta_id);
      v_metodo_contable := public.contabilidad_legacy_metodo_desde_metodo_pago(v_metodo_pago_id);
      v_iva_pct := public.contabilidad_iva_pct_desde_metodo_pago(v_metodo_pago_id, v_pago.metodo::text);

      if v_iva_pct > 0 then
        v_base_original := round((v_pago.importe / (1 + (v_iva_pct / 100)))::numeric, 2);
        v_iva_original := round((v_pago.importe - v_base_original)::numeric, 2);
      else
        v_base_original := v_pago.importe;
        v_iva_original := 0;
      end if;
    end if;

    v_ratio := case
      when v_pago.importe > 0 then v_refund_item.importe / v_pago.importe
      else 0
    end;

    insert into public.movimiento_contable (
      fecha_operacion,
      tipo,
      estado,
      caja,
      cuenta_id,
      metodo,
      metodo_pago_id,
      concepto,
      comentario,
      importe_total,
      base_imponible,
      iva_pct,
      iva_importe,
      es_devolucion,
      origen_tipo,
      origen_id,
      id_pago,
      id_movimiento_relacionado,
      created_by
    )
    values (
      current_date,
      'ingreso',
      'confirmado',
      v_caja,
      v_cuenta_id,
      v_metodo_contable,
      v_metodo_pago_id,
      'Reembolso reserva - ' || coalesce(nullif(trim(v_pago.concepto), ''), v_reserva.numero::text),
      coalesce(v_refund_item.comentario, p_comentario, 'Reembolso registrado desde reserva cancelada'),
      round(v_refund_item.importe * -1, 2),
      round(v_base_original * v_ratio * -1, 2),
      coalesce(v_iva_pct, 0),
      round(v_iva_original * v_ratio * -1, 2),
      true,
      'reembolso_reserva',
      p_reserva_id,
      null,
      v_movimiento_original.id,
      v_usuario_id
    )
    returning id into v_movimiento_reembolso_id;

    insert into public.pago_reembolso (
      pago_id,
      reserva_id,
      importe,
      metodo,
      metodo_pago_id,
      fecha_operacion,
      comentario,
      movimiento_contable_id,
      created_by
    )
    values (
      v_pago.id,
      p_reserva_id,
      v_refund_item.importe,
      v_pago.metodo,
      v_metodo_pago_id,
      current_date,
      coalesce(v_refund_item.comentario, p_comentario),
      v_movimiento_reembolso_id,
      v_usuario_id
    );

    v_total_reembolsado_actual := v_total_reembolsado_actual + v_refund_item.importe;
    v_reembolsos_creados := v_reembolsos_creados + 1;
  end loop;

  if p_cancelar_pendientes then
    update public.pago
    set estado = 'cancelado'
    where origen_tipo = 'reserva'
      and origen_id = p_reserva_id
      and estado = 'pendiente';

    get diagnostics v_pendientes_cancelados = row_count;
  end if;

  if v_reserva.estado <> 'cancelada' then
    update public.reserva_servicio
    set estado = 'cancelada'
    where id = p_reserva_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'reserva_id', p_reserva_id,
    'reserva_estado', 'cancelada',
    'total_reembolsado', coalesce(v_total_reembolsado_actual, 0),
    'reembolsos_creados', v_reembolsos_creados,
    'pagos_pendientes_cancelados', v_pendientes_cancelados
  );
end;
$$;
