-- Seed reversible de gastos y traspasos contables para junio 2026
-- Proyecto: vvcpgnkatdwwzwnfihrf
-- MCP obligatorio: supabase-org2
-- Rango cargado: 2026-06-01 .. 2026-07-01 (inclusive)

begin;

do $$
declare
  run_id constant text := 'seed_contabilidad_manual_20260610_jun01_jul01';

  v_gasto_types public.tipo_gasto_contable[] := array[
    'publicidad_marketing'::public.tipo_gasto_contable,
    'personal'::public.tipo_gasto_contable,
    'material'::public.tipo_gasto_contable,
    'gasolina'::public.tipo_gasto_contable,
    'gestor'::public.tipo_gasto_contable,
    'impuestos'::public.tipo_gasto_contable,
    'alquiler_robe'::public.tipo_gasto_contable,
    'otros'::public.tipo_gasto_contable
  ];
  v_base_template numeric[] := array[42.50, 68.30, 95.00, 120.75, 155.40, 210.00, 33.20, 87.60];
  v_iva_cycle numeric[] := array[21, 21, 10, 0];
  v_deducible_cycle boolean[] := array[true, true, false, false];
  v_method_codes text[] := array['efectivo', 'tpv', 'transferencia', 'bizum_alfonso'];
  v_method_legacy public.metodo_contable[] := array[
    'efectivo'::public.metodo_contable,
    'tarjeta'::public.metodo_contable,
    'transferencia'::public.metodo_contable,
    'bizum_alfonso'::public.metodo_contable
  ];
  v_account_codes text[] := array['efectivo', 'bbva', 'santander', 'santander'];
  v_account_legacy public.caja_contable[] := array[
    'efectivo'::public.caja_contable,
    'bbva'::public.caja_contable,
    'santander'::public.caja_contable,
    'santander'::public.caja_contable
  ];
  v_extra_traspaso_days date[] := array[date '2026-06-08', date '2026-06-15', date '2026-06-29'];
  v_traspaso_amounts numeric[] := array[
    150.00, 220.00, 340.00, 180.00, 95.00, 260.00,
    310.00, 140.00, 400.00, 175.00, 230.00, 125.00
  ];

  v_employee_ids uuid[] := '{}'::uuid[];
  v_method_ids uuid[] := '{}'::uuid[];
  v_account_ids uuid[] := '{}'::uuid[];

  v_cuenta_efectivo uuid;
  v_cuenta_personal uuid;
  v_cuenta_santander uuid;
  v_cuenta_bbva uuid;

  v_gasto_event record;
  v_traspaso_event record;
  v_idx int;
  v_gasto_counter int := 0;
  v_traspaso_counter int := 0;

  v_movimiento_id uuid;
  v_salida_id uuid;
  v_entrada_id uuid;

  v_tipo_gasto public.tipo_gasto_contable;
  v_base_imponible numeric(12,2);
  v_iva_pct numeric(5,2);
  v_iva_importe numeric(12,2);
  v_importe_total numeric(12,2);
  v_deducible boolean;
  v_deducible_legacy public.deducible_contable;
  v_fecha_factura date;
  v_empleado_id uuid;
  v_metodo_pago_id uuid;
  v_cuenta_id uuid;
  v_metodo_legacy public.metodo_contable;
  v_caja_legacy public.caja_contable;
  v_concepto text;
  v_comentario text;
  v_proveedor text;
  v_descripcion text;
  v_num_factura text;
  v_tipo_label text;

  v_desde_cuenta_id uuid;
  v_hacia_cuenta_id uuid;
  v_desde_caja public.caja_contable;
  v_hacia_caja public.caja_contable;
  v_traspaso_label text;
  v_traspaso_importe numeric(12,2);
  v_concepto_salida text;
  v_concepto_entrada text;
  v_comentario_traspaso text;

  v_actual_movimientos int;
  v_actual_gastos int;
  v_actual_traspasos int;
  v_actual_gasto_detalle int;
  v_actual_invalidos int;
  v_actual_traspasos_invalidos int;
  v_actual_tipos_gasto int;
  v_actual_metodos_gasto int;
  v_actual_cuentas int;
  v_actual_iva_gasto int;
  v_actual_deducibles int;
  v_actual_gastos_con_empleado int;
  v_actual_campos_excel_vacios int;
begin
  if exists (
    select 1
    from public.movimiento_contable
    where concepto like run_id || '%'
  ) then
    raise exception 'Ya existe una carga previa con run_id %', run_id;
  end if;

  select coalesce(array_agg(id order by nombre, apellidos), '{}'::uuid[])
  into v_employee_ids
  from public.empleado;

  for v_idx in 1..array_length(v_method_codes, 1) loop
    select id
    into v_metodo_pago_id
    from public.contabilidad_metodo_pago
    where codigo = v_method_codes[v_idx]
      and activo = true
    limit 1;

    if v_metodo_pago_id is null then
      raise exception 'No se encontro el metodo de pago activo %', v_method_codes[v_idx];
    end if;

    v_method_ids := array_append(v_method_ids, v_metodo_pago_id);

    select id
    into v_cuenta_id
    from public.contabilidad_cuenta
    where codigo = v_account_codes[v_idx]
      and activo = true
    limit 1;

    if v_cuenta_id is null then
      raise exception 'No se encontro la cuenta activa %', v_account_codes[v_idx];
    end if;

    v_account_ids := array_append(v_account_ids, v_cuenta_id);
  end loop;

  select id into v_cuenta_efectivo
  from public.contabilidad_cuenta
  where codigo = 'efectivo'
    and activo = true
  limit 1;

  select id into v_cuenta_personal
  from public.contabilidad_cuenta
  where codigo = 'personal'
    and activo = true
  limit 1;

  select id into v_cuenta_santander
  from public.contabilidad_cuenta
  where codigo = 'santander'
    and activo = true
  limit 1;

  select id into v_cuenta_bbva
  from public.contabilidad_cuenta
  where codigo = 'bbva'
    and activo = true
  limit 1;

  if v_cuenta_efectivo is null
    or v_cuenta_personal is null
    or v_cuenta_santander is null
    or v_cuenta_bbva is null then
    raise exception 'Faltan cuentas base para los traspasos';
  end if;

  for v_gasto_event in
    select fecha, es_extra
    from (
      select gs::date as fecha, false as es_extra
      from generate_series(date '2026-06-01', date '2026-07-01', interval '1 day') gs
      where extract(isodow from gs) <> 7

      union all

      select gs::date as fecha, true as es_extra
      from generate_series(date '2026-06-01', date '2026-07-01', interval '1 day') gs
      where extract(isodow from gs) = 2
    ) schedule
    order by fecha, es_extra
  loop
    v_gasto_counter := v_gasto_counter + 1;
    v_idx := ((v_gasto_counter - 1) % 4) + 1;

    v_tipo_gasto := v_gasto_types[((v_gasto_counter - 1) % array_length(v_gasto_types, 1)) + 1];
    v_metodo_pago_id := v_method_ids[v_idx];
    v_cuenta_id := v_account_ids[v_idx];
    v_metodo_legacy := v_method_legacy[v_idx];
    v_caja_legacy := v_account_legacy[v_idx];
    v_iva_pct := v_iva_cycle[v_idx];
    v_deducible := v_deducible_cycle[v_idx];
    v_deducible_legacy := case when v_deducible then 'si'::public.deducible_contable else 'no'::public.deducible_contable end;
    v_base_imponible := round(
      (
        v_base_template[((v_gasto_counter - 1) % array_length(v_base_template, 1)) + 1]
        + (((v_gasto_counter - 1) / array_length(v_base_template, 1))::numeric * 6.25)
      )::numeric,
      2
    );
    v_importe_total := round((v_base_imponible * (1 + (v_iva_pct / 100)))::numeric, 2);
    v_iva_importe := round((v_importe_total - v_base_imponible)::numeric, 2);
    v_fecha_factura := v_gasto_event.fecha - ((v_gasto_counter - 1) % 4);
    v_empleado_id := null;
    if mod(v_gasto_counter, 3) = 0 and array_length(v_employee_ids, 1) > 0 then
      v_empleado_id := v_employee_ids[(((v_gasto_counter / 3) - 1) % array_length(v_employee_ids, 1)) + 1];
    end if;

    v_tipo_label := case v_tipo_gasto
      when 'publicidad_marketing' then 'campana_verano'
      when 'personal' then 'refuerzo_monitores'
      when 'material' then 'reposicion_material'
      when 'gasolina' then 'combustible_embarcaciones'
      when 'gestor' then 'honorarios_gestoria'
      when 'impuestos' then 'tasa_municipal'
      when 'alquiler_robe' then 'alquiler_operativo_robe'
      else 'gasto_operativo_vario'
    end;

    v_concepto := format(
      '%s | gasto | %s | %s',
      run_id,
      v_tipo_label,
      lpad(v_gasto_counter::text, 3, '0')
    );

    v_comentario := format(
      '%s | gasto_manual | %s | %s',
      run_id,
      case when v_gasto_event.es_extra then 'martes_extra' else 'diario' end,
      lpad(v_gasto_counter::text, 3, '0')
    );

    v_num_factura := format('SEED-CONT-%s', lpad(v_gasto_counter::text, 3, '0'));

    v_proveedor := case v_tipo_gasto
      when 'publicidad_marketing' then format('%s | Meta Ads %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'personal' then format('%s | Colaboradores operativos %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'material' then format('%s | Decathlon Pro %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'gasolina' then format('%s | Estacion Marina %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'gestor' then format('%s | Gestoria Costa %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'impuestos' then format('%s | Agencia Tributaria %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      when 'alquiler_robe' then format('%s | Robe Rentals %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
      else format('%s | Servicios Varios %s', run_id, lpad(v_gasto_counter::text, 3, '0'))
    end;

    v_descripcion := case v_tipo_gasto
      when 'publicidad_marketing' then 'Publicidad digital para captacion de reservas'
      when 'personal' then 'Refuerzo operativo de monitores y apoyo'
      when 'material' then 'Reposicion de material nautico y consumibles'
      when 'gasolina' then 'Combustible para vehiculos y embarcaciones'
      when 'gestor' then 'Servicio recurrente de gestoria y soporte'
      when 'impuestos' then 'Tasa municipal operativa del periodo'
      when 'alquiler_robe' then 'Alquiler operativo asociado a Robe'
      else 'Gasto operativo variado de prueba'
    end;

    insert into public.movimiento_contable (
      fecha_operacion,
      tipo,
      estado,
      caja,
      metodo,
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
      id_empleado,
      id_movimiento_relacionado,
      created_by,
      cuenta_id,
      metodo_pago_id
    )
    values (
      v_gasto_event.fecha,
      'gasto'::public.movimiento_contable_tipo,
      'confirmado'::public.movimiento_contable_estado,
      v_caja_legacy,
      v_metodo_legacy,
      v_concepto,
      v_comentario,
      v_importe_total,
      v_base_imponible,
      v_iva_pct,
      v_iva_importe,
      false,
      'manual',
      null,
      null,
      v_empleado_id,
      null,
      null,
      v_cuenta_id,
      v_metodo_pago_id
    )
    returning id into v_movimiento_id;

    insert into public.movimiento_contable_gasto (
      id_movimiento_contable,
      tipo_gasto,
      deducible_legacy,
      descripcion,
      proveedor,
      num_factura,
      fecha_factura,
      comentario,
      deducible
    )
    values (
      v_movimiento_id,
      v_tipo_gasto,
      v_deducible_legacy,
      v_descripcion,
      v_proveedor,
      v_num_factura,
      v_fecha_factura,
      format('%s | detalle_gasto | %s', run_id, lpad(v_gasto_counter::text, 3, '0')),
      v_deducible
    );
  end loop;

  for v_traspaso_event in
    select gs::date as fecha
    from generate_series(date '2026-06-01', date '2026-07-01', interval '1 day') gs
    where extract(isodow from gs) in (3, 5)
       or gs::date = any(v_extra_traspaso_days)
    order by fecha
  loop
    v_traspaso_counter := v_traspaso_counter + 1;
    v_idx := ((v_traspaso_counter - 1) % 6) + 1;
    v_traspaso_importe := v_traspaso_amounts[v_traspaso_counter];

    case v_idx
      when 1 then
        v_desde_cuenta_id := v_cuenta_bbva;
        v_hacia_cuenta_id := v_cuenta_efectivo;
        v_desde_caja := 'bbva'::public.caja_contable;
        v_hacia_caja := 'efectivo'::public.caja_contable;
        v_traspaso_label := 'reposicion_caja_desde_bbva';
      when 2 then
        v_desde_cuenta_id := v_cuenta_santander;
        v_hacia_cuenta_id := v_cuenta_efectivo;
        v_desde_caja := 'santander'::public.caja_contable;
        v_hacia_caja := 'efectivo'::public.caja_contable;
        v_traspaso_label := 'reposicion_caja_desde_santander';
      when 3 then
        v_desde_cuenta_id := v_cuenta_efectivo;
        v_hacia_cuenta_id := v_cuenta_bbva;
        v_desde_caja := 'efectivo'::public.caja_contable;
        v_hacia_caja := 'bbva'::public.caja_contable;
        v_traspaso_label := 'ingreso_a_bbva';
      when 4 then
        v_desde_cuenta_id := v_cuenta_efectivo;
        v_hacia_cuenta_id := v_cuenta_santander;
        v_desde_caja := 'efectivo'::public.caja_contable;
        v_hacia_caja := 'santander'::public.caja_contable;
        v_traspaso_label := 'ingreso_a_santander';
      when 5 then
        v_desde_cuenta_id := v_cuenta_personal;
        v_hacia_cuenta_id := v_cuenta_efectivo;
        v_desde_caja := 'personal'::public.caja_contable;
        v_hacia_caja := 'efectivo'::public.caja_contable;
        v_traspaso_label := 'regularizacion_personal_a_efectivo';
      else
        v_desde_cuenta_id := v_cuenta_efectivo;
        v_hacia_cuenta_id := v_cuenta_personal;
        v_desde_caja := 'efectivo'::public.caja_contable;
        v_hacia_caja := 'personal'::public.caja_contable;
        v_traspaso_label := 'regularizacion_efectivo_a_personal';
    end case;

    v_salida_id := gen_random_uuid();
    v_entrada_id := gen_random_uuid();
    v_concepto_salida := format(
      '%s | traspaso_salida | %s | %s',
      run_id,
      v_traspaso_label,
      lpad(v_traspaso_counter::text, 3, '0')
    );
    v_concepto_entrada := format(
      '%s | traspaso_entrada | %s | %s',
      run_id,
      v_traspaso_label,
      lpad(v_traspaso_counter::text, 3, '0')
    );
    v_comentario_traspaso := format(
      '%s | traspaso_manual | pareja_%s | %s -> %s',
      run_id,
      lpad(v_traspaso_counter::text, 3, '0'),
      v_desde_caja::text,
      v_hacia_caja::text
    );

    insert into public.movimiento_contable (
      id,
      fecha_operacion,
      tipo,
      estado,
      caja,
      metodo,
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
      id_empleado,
      id_movimiento_relacionado,
      created_by,
      cuenta_id,
      metodo_pago_id
    )
    values
    (
      v_salida_id,
      v_traspaso_event.fecha,
      'traspaso_salida'::public.movimiento_contable_tipo,
      'confirmado'::public.movimiento_contable_estado,
      v_desde_caja,
      null,
      v_concepto_salida,
      v_comentario_traspaso,
      v_traspaso_importe,
      0,
      0,
      0,
      false,
      'traspaso',
      null,
      null,
      null,
      v_entrada_id,
      null,
      v_desde_cuenta_id,
      null
    ),
    (
      v_entrada_id,
      v_traspaso_event.fecha,
      'traspaso_entrada'::public.movimiento_contable_tipo,
      'confirmado'::public.movimiento_contable_estado,
      v_hacia_caja,
      null,
      v_concepto_entrada,
      v_comentario_traspaso,
      v_traspaso_importe,
      0,
      0,
      0,
      false,
      'traspaso',
      null,
      null,
      null,
      v_salida_id,
      null,
      v_hacia_cuenta_id,
      null
    );
  end loop;

  select count(*)
  into v_actual_movimientos
  from public.movimiento_contable
  where concepto like run_id || '%';

  select count(*)
  into v_actual_gastos
  from public.movimiento_contable
  where concepto like run_id || '%'
    and tipo = 'gasto';

  select count(*)
  into v_actual_traspasos
  from public.movimiento_contable
  where concepto like run_id || '%'
    and tipo in ('traspaso_entrada', 'traspaso_salida');

  select count(*)
  into v_actual_gasto_detalle
  from public.movimiento_contable_gasto g
  join public.movimiento_contable m on m.id = g.id_movimiento_contable
  where m.concepto like run_id || '%';

  select count(*)
  into v_actual_invalidos
  from public.movimiento_contable
  where concepto like run_id || '%'
    and (
      estado <> 'confirmado'
      or es_devolucion is true
      or id_pago is not null
    );

  select count(*)
  into v_actual_traspasos_invalidos
  from public.movimiento_contable a
  left join public.movimiento_contable b on b.id = a.id_movimiento_relacionado
  where a.concepto like run_id || '%'
    and a.tipo in ('traspaso_entrada', 'traspaso_salida')
    and (
      a.id_movimiento_relacionado is null
      or b.id is null
      or b.id_movimiento_relacionado <> a.id
      or b.importe_total <> a.importe_total
      or b.estado <> 'confirmado'
    );

  select count(distinct g.tipo_gasto)
  into v_actual_tipos_gasto
  from public.movimiento_contable_gasto g
  join public.movimiento_contable m on m.id = g.id_movimiento_contable
  where m.concepto like run_id || '%';

  select count(distinct m.metodo_pago_id)
  into v_actual_metodos_gasto
  from public.movimiento_contable m
  where m.concepto like run_id || '%'
    and m.tipo = 'gasto';

  select count(distinct cuenta_id)
  into v_actual_cuentas
  from public.movimiento_contable
  where concepto like run_id || '%';

  select count(distinct iva_pct)
  into v_actual_iva_gasto
  from public.movimiento_contable
  where concepto like run_id || '%'
    and tipo = 'gasto';

  select count(distinct g.deducible)
  into v_actual_deducibles
  from public.movimiento_contable_gasto g
  join public.movimiento_contable m on m.id = g.id_movimiento_contable
  where m.concepto like run_id || '%';

  select count(*)
  into v_actual_gastos_con_empleado
  from public.movimiento_contable
  where concepto like run_id || '%'
    and tipo = 'gasto'
    and id_empleado is not null;

  select count(*)
  into v_actual_campos_excel_vacios
  from public.movimiento_contable_gasto g
  join public.movimiento_contable m on m.id = g.id_movimiento_contable
  where m.concepto like run_id || '%'
    and (
      coalesce(g.proveedor, '') = ''
      or coalesce(g.num_factura, '') = ''
      or g.fecha_factura is null
      or g.tipo_gasto is null
    );

  if v_gasto_counter <> 32 then
    raise exception 'Se esperaban 32 gastos y se generaron %', v_gasto_counter;
  end if;

  if v_traspaso_counter <> 12 then
    raise exception 'Se esperaban 12 traspasos y se generaron %', v_traspaso_counter;
  end if;

  if v_actual_movimientos <> 56 then
    raise exception 'Se esperaban 56 movimientos y se generaron %', v_actual_movimientos;
  end if;

  if v_actual_gastos <> 32 then
    raise exception 'Se esperaban 32 gastos y se generaron %', v_actual_gastos;
  end if;

  if v_actual_traspasos <> 24 then
    raise exception 'Se esperaban 24 filas de traspaso y se generaron %', v_actual_traspasos;
  end if;

  if v_actual_gasto_detalle <> 32 then
    raise exception 'Se esperaban 32 detalles de gasto y se generaron %', v_actual_gasto_detalle;
  end if;

  if v_actual_invalidos <> 0 then
    raise exception 'Hay movimientos del seed con estado invalido, devolucion o pago asociado: %', v_actual_invalidos;
  end if;

  if v_actual_traspasos_invalidos <> 0 then
    raise exception 'Hay traspasos sin contrapartida reciproca valida: %', v_actual_traspasos_invalidos;
  end if;

  if v_actual_tipos_gasto <> 8 then
    raise exception 'Se esperaban 8 tipos de gasto distintos y se detectaron %', v_actual_tipos_gasto;
  end if;

  if v_actual_metodos_gasto <> 4 then
    raise exception 'Se esperaban 4 metodos de gasto distintos y se detectaron %', v_actual_metodos_gasto;
  end if;

  if v_actual_cuentas <> 4 then
    raise exception 'Se esperaban 4 cuentas distintas y se detectaron %', v_actual_cuentas;
  end if;

  if v_actual_iva_gasto <> 3 then
    raise exception 'Se esperaban 3 valores de IVA en gastos y se detectaron %', v_actual_iva_gasto;
  end if;

  if v_actual_deducibles <> 2 then
    raise exception 'Se esperaban 2 valores de deducible y se detectaron %', v_actual_deducibles;
  end if;

  if v_actual_gastos_con_empleado <> 10 then
    raise exception 'Se esperaban 10 gastos con empleado y se detectaron %', v_actual_gastos_con_empleado;
  end if;

  if v_actual_campos_excel_vacios <> 0 then
    raise exception 'Hay filas de gasto con campos del Excel sin poblar: %', v_actual_campos_excel_vacios;
  end if;
end;
$$;

commit;
