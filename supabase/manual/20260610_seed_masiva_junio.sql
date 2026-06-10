-- Seed masivo reversible para Flecha Extreme
-- Proyecto: vvcpgnkatdwwzwnfihrf
-- MCP obligatorio: supabase-org2
-- Rango cargado: 2026-06-01 .. 2026-07-01 (inclusive)

begin;

do $$
declare
  run_id constant text := 'seed_masiva_20260610_jun01_jul01';

  v_empresa_id uuid;
  v_programa_id uuid;
  v_desc_hermanos uuid;
  v_desc_repetidos uuid;

  v_payment_methods text[] := array['efectivo', 'tpv', 'transferencia', 'bizum_alfonso'];
  v_client_ids uuid[] := '{}'::uuid[];
  v_participant_ids uuid[] := '{}'::uuid[];
  v_camp_counts int[] := array[3, 2, 2, 3, 2, 3, 2, 3, 2, 2, 2];

  v_res_counter int := 0;
  v_discounted_count int := 0;

  v_sequence int;
  v_client_id uuid;
  v_reserva_id uuid;
  v_pago_id uuid;
  v_servicio_id uuid;
  v_tarifa_id uuid;
  v_tarifa_precio numeric(12,2);
  v_tarifa_duracion int;
  v_estado_reserva text;
  v_estado_pago text;
  v_metodo_pago text;
  v_observacion text;
  v_concepto_pago text;

  v_total_bruto numeric(12,2);
  v_total_descuento numeric(12,2);
  v_total_neto numeric(12,2);
  v_cantidad int;
  v_numero_personas int;
  v_metadata jsonb;

  v_day date;
  v_day_index int;
  v_schedule jsonb;
  v_entry jsonb;
  v_start_tz timestamptz;
  v_end_tz timestamptz;

  v_participant_uuid uuid;
  v_participant_nombre text;
  v_participant_dni text;
  v_camp_participante_id uuid;

  v_expected_reservas int := 135;
  v_expected_pagos int := 135;
  v_actual_reservas int;
  v_actual_pagos int;
  v_actual_movimientos_completados int;
  v_actual_pagos_completados int;
  v_actual_pagos_pendientes_con_movimiento int;
begin
  if exists (
    select 1
    from public.reserva_servicio
    where observaciones like run_id || '%'
  ) or exists (
    select 1
    from public.campamento_programa
    where notas like run_id || '%'
  ) or exists (
    select 1
    from public.pago
    where concepto like run_id || '%'
  ) then
    raise exception 'Ya existe una carga previa con run_id %', run_id;
  end if;

  select id
  into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No se encontro la empresa Flecha Extreme';
  end if;

  select id into v_desc_hermanos
  from public.descuento_catalogo
  where codigo = 'HERMANOS'
  limit 1;

  select id into v_desc_repetidos
  from public.descuento_catalogo
  where codigo = 'REPETIDOS'
  limit 1;

  if v_desc_hermanos is null or v_desc_repetidos is null then
    raise exception 'No se encontraron los descuentos HERMANOS y REPETIDOS';
  end if;

  for v_day_index in 1..36 loop
    insert into public.cliente (
      nombre,
      apellidos,
      email,
      movil,
      dni
    )
    values (
      format('Seed %s', lpad(v_day_index::text, 2, '0')),
      format('Masiva %s', lpad(v_day_index::text, 2, '0')),
      format('seed.massive+%s@flecha-extreme.test', lpad(v_day_index::text, 2, '0')),
      (600000000 + v_day_index)::numeric,
      format('SEEDCLI%s', lpad(v_day_index::text, 3, '0'))
    )
    returning id into v_client_id;

    v_client_ids := array_append(v_client_ids, v_client_id);
  end loop;

  for v_day_index in 1..26 loop
    insert into public.campamento_participante_catalogo (
      nombre,
      dni
    )
    values (
      format('Camp Seed %s', lpad(v_day_index::text, 2, '0')),
      format('SEED-CAMP-%s', lpad(v_day_index::text, 3, '0'))
    )
    returning id into v_participant_uuid;

    v_participant_ids := array_append(v_participant_ids, v_participant_uuid);
  end loop;

  insert into public.campamento_programa (
    servicio_id,
    fecha_inicio,
    fecha_fin,
    dias_semana,
    hora_inicio,
    hora_fin,
    turno_codigo,
    turno_label,
    estado,
    notas
  )
  select
    s.id,
    date '2026-06-01',
    date '2026-07-01',
    array[1,2,3,4,5],
    time '11:30',
    time '14:00',
    '1130_1400',
    '11:30 - 14:00',
    'activo',
    run_id || ' | Programa mensual Extreme Camp'
  from public.servicio s
  where s.codigo = 'EXTREME_CAMP'
  limit 1
  returning id into v_programa_id;

  if v_programa_id is null then
    raise exception 'No se pudo crear el programa mensual de EXTREME_CAMP';
  end if;

  for v_day_index in 1..array_length(v_camp_counts, 1) loop
    v_sequence := v_res_counter + 1;
    v_client_id := v_client_ids[((v_sequence - 1) % array_length(v_client_ids, 1)) + 1];
    v_estado_pago := case when mod(v_sequence, 5) = 0 then 'pendiente' else 'completado' end;
    v_estado_reserva := case when v_estado_pago = 'pendiente' then 'pendiente' else 'confirmada' end;
    v_metodo_pago := v_payment_methods[((v_sequence - 1) % array_length(v_payment_methods, 1)) + 1];

    select t.id, t.precio
    into v_tarifa_id, v_tarifa_precio
    from public.servicio_tarifa t
    join public.servicio s on s.id = t.servicio_id
    where s.codigo = 'EXTREME_CAMP'
      and t.codigo = 'CAMP_MONTH'
      and t.activo = true
    limit 1;

    if v_tarifa_id is null then
      raise exception 'No se encontro la tarifa CAMP_MONTH de EXTREME_CAMP';
    end if;

    v_cantidad := v_camp_counts[v_day_index];
    v_numero_personas := v_cantidad;
    v_total_bruto := round((v_tarifa_precio * v_cantidad)::numeric, 2);
    v_total_descuento := 0;
    v_total_neto := v_total_bruto;
    v_observacion := format('%s | campamento mensual | reserva %s', run_id, lpad(v_sequence::text, 3, '0'));
    v_concepto_pago := format('%s | pago campamento mensual | reserva %s', run_id, lpad(v_sequence::text, 3, '0'));

    insert into public.reserva_servicio (
      empresa_id,
      cliente_id,
      campamento_programa_id,
      canal,
      estado,
      observaciones,
      total_bruto,
      total_descuento,
      total_neto,
      deposito_total_requerido,
      deposito_total_cobrado,
      servicio_id,
      tarifa_id,
      cantidad_reservada,
      numero_personas_reserva,
      estado_asignacion_tramos
    )
    select
      v_empresa_id,
      v_client_id,
      v_programa_id,
      'backoffice'::public.reserva_canal,
      v_estado_reserva::public.reserva_estado,
      v_observacion,
      v_total_bruto,
      0,
      v_total_bruto,
      0,
      0,
      s.id,
      v_tarifa_id,
      v_cantidad,
      v_numero_personas,
      'no_aplica'::public.reserva_asignacion_tramos_estado
    from public.servicio s
    where s.codigo = 'EXTREME_CAMP'
    limit 1
    returning id, servicio_id into v_reserva_id, v_servicio_id;

    insert into public.reserva_servicio_item (
      reserva_id,
      servicio_id,
      tarifa_id,
      inicio,
      fin,
      cantidad,
      precio_unitario,
      descuento_unitario,
      subtotal,
      deposito_requerido,
      deposito_cobrado,
      estado,
      notas,
      metadata
    )
    values (
      v_reserva_id,
      v_servicio_id,
      v_tarifa_id,
      '2026-06-01 11:30:00+02'::timestamptz,
      '2026-07-01 14:00:00+02'::timestamptz,
      v_cantidad,
      v_tarifa_precio,
      0,
      v_total_bruto,
      0,
      0,
      v_estado_reserva::public.reserva_item_estado,
      v_observacion,
      jsonb_build_object('numero_personas', v_numero_personas)
    );

    for v_cantidad in 1..v_camp_counts[v_day_index] loop
      v_participant_uuid := v_participant_ids[1 + (
        (
          select coalesce(sum(v_camp_counts[i]), 0)
          from generate_subscripts(v_camp_counts, 1) g(i)
          where i < v_day_index
        ) + v_cantidad - 1
      )];

      select nombre, dni
      into v_participant_nombre, v_participant_dni
      from public.campamento_participante_catalogo
      where id = v_participant_uuid;

      insert into public.campamento_participante (
        reserva_id,
        participante_id,
        nombre,
        dni
      )
      values (
        v_reserva_id,
        v_participant_uuid,
        v_participant_nombre,
        v_participant_dni
      )
      returning id into v_camp_participante_id;

      if v_discounted_count < 4 then
        insert into public.campamento_participante_descuento (
          campamento_participante_id,
          descuento_id,
          importe_aplicado
        )
        values (
          v_camp_participante_id,
          v_desc_hermanos,
          10
        );

        v_total_descuento := v_total_descuento + 10;
        v_discounted_count := v_discounted_count + 1;
      elsif v_discounted_count < 6 then
        insert into public.campamento_participante_descuento (
          campamento_participante_id,
          descuento_id,
          importe_aplicado
        )
        values (
          v_camp_participante_id,
          v_desc_repetidos,
          10
        );

        v_total_descuento := v_total_descuento + 10;
        v_discounted_count := v_discounted_count + 1;
      end if;
    end loop;

    v_total_neto := v_total_bruto - v_total_descuento;

    update public.reserva_servicio
    set total_descuento = v_total_descuento,
        total_neto = v_total_neto,
        updated_at = timezone('utc', now())
    where id = v_reserva_id;

    insert into public.pago (
      id_cliente,
      origen_tipo,
      origen_id,
      concepto,
      importe,
      metodo,
      estado
    )
    values (
      v_client_id,
      'reserva'::public.tipo_origen,
      v_reserva_id,
      v_concepto_pago,
      v_total_neto,
      v_metodo_pago::public.tipo_metodo_pago,
      v_estado_pago::public.tipo_estado_pago
    )
    returning id into v_pago_id;

    insert into public.pago_aplicacion (
      pago_id,
      entidad_tipo,
      entidad_id,
      importe_aplicado,
      created_by
    )
    values (
      v_pago_id,
      'reserva_servicio'::public.pago_entidad_tipo,
      v_reserva_id,
      v_total_neto,
      null
    );

    if v_total_descuento > 0 then
      insert into public.pago_descuento_snapshot (
        pago_id,
        reserva_id,
        campamento_participante_id,
        descuento_id,
        participante_nombre,
        descuento_nombre,
        tipo_valor,
        valor_configurado,
        importe_aplicado
      )
      select
        v_pago_id,
        v_reserva_id,
        cp.id,
        dc.id,
        cp.nombre,
        dc.nombre,
        dc.tipo_valor,
        dc.valor,
        cpd.importe_aplicado
      from public.campamento_participante cp
      join public.campamento_participante_descuento cpd
        on cpd.campamento_participante_id = cp.id
      join public.descuento_catalogo dc
        on dc.id = cpd.descuento_id
      where cp.reserva_id = v_reserva_id;
    end if;

    v_res_counter := v_sequence;
  end loop;

  for v_day in
    select generate_series(date '2026-06-01', date '2026-07-01', interval '1 day')::date
  loop
    case extract(isodow from v_day)::int
      when 1 then
        v_schedule := '[
          {"servicio":"ALQ_KAYAK","tarifa":"STD_120M","start":"09:00","qty":3,"persons":1},
          {"servicio":"ALQ_PADDLESUP","tarifa":"STD_60M","start":"09:30","qty":4,"persons":1},
          {"servicio":"BANANA","tarifa":"STD_20M","start":"16:00","qty":1,"persons":6},
          {"servicio":"KITESURF","tarifa":"PERF_150M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      when 2 then
        v_schedule := '[
          {"servicio":"ALQ_KAYAK","tarifa":"STD_60M","start":"09:00","qty":2,"persons":1},
          {"servicio":"RUTA_PADDLESUP","tarifa":"STD_90M","start":"09:15","qty":1,"persons":1},
          {"servicio":"ALQ_BIGSUP","tarifa":"STD_60M","start":"16:00","qty":1,"persons":1},
          {"servicio":"CURSO_CATAMARAN","tarifa":"BAUTISMO_360M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      when 3 then
        v_schedule := '[
          {"servicio":"RUTA_KAYAK","tarifa":"STD_90M","start":"09:00","qty":1,"persons":1},
          {"servicio":"ALQ_PADDLESUP","tarifa":"STD_120M","start":"09:30","qty":3,"persons":1},
          {"servicio":"WAKEBOARD","tarifa":"STD_30M","start":"16:00","qty":1,"persons":1},
          {"servicio":"CURSO_PADDLESUP","tarifa":"STD_120M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      when 4 then
        v_schedule := '[
          {"servicio":"ALQ_KAYAK","tarifa":"STD_120M","start":"09:00","qty":3,"persons":1},
          {"servicio":"RUTA_PADDLESUP","tarifa":"STD_90M","start":"09:30","qty":1,"persons":1},
          {"servicio":"ALQ_ZODIAK","tarifa":"STD_120M","start":"16:00","qty":1,"persons":1},
          {"servicio":"WINGFOIL","tarifa":"INICIACION_480M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      when 5 then
        v_schedule := '[
          {"servicio":"ALQ_KAYAK","tarifa":"STD_60M","start":"09:00","qty":4,"persons":1},
          {"servicio":"ALQ_PADDLESUP","tarifa":"STD_120M","start":"09:15","qty":4,"persons":1},
          {"servicio":"BANANA","tarifa":"STD_20M","start":"16:00","qty":1,"persons":8},
          {"servicio":"ALQ_EQUIPO_KITESURF","tarifa":"STD_150M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      when 6 then
        v_schedule := '[
          {"servicio":"ALQ_KAYAK","tarifa":"STD_120M","start":"09:00","qty":2,"persons":1},
          {"servicio":"ALQ_PADDLESUP","tarifa":"STD_60M","start":"09:30","qty":5,"persons":1},
          {"servicio":"ALQ_CATAMARAN","tarifa":"STD_120M","start":"16:00","qty":1,"persons":1},
          {"servicio":"CURSO_PADDLESUP","tarifa":"STD_120M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
      else
        v_schedule := '[
          {"servicio":"RUTA_KAYAK","tarifa":"STD_90M","start":"09:00","qty":1,"persons":1},
          {"servicio":"ALQ_PADDLESUP","tarifa":"STD_120M","start":"09:30","qty":3,"persons":1},
          {"servicio":"WAKEBOARD","tarifa":"STD_30M","start":"16:00","qty":1,"persons":1},
          {"servicio":"ALQ_EQUIPO_WINGFOIL","tarifa":"STD_150M","start":"15:30","qty":1,"persons":1}
        ]'::jsonb;
    end case;

    for v_entry in
      select value
      from jsonb_array_elements(v_schedule)
    loop
      v_sequence := v_res_counter + 1;
      v_client_id := v_client_ids[((v_sequence - 1) % array_length(v_client_ids, 1)) + 1];
      v_estado_pago := case when mod(v_sequence, 5) = 0 then 'pendiente' else 'completado' end;
      v_estado_reserva := case when v_estado_pago = 'pendiente' then 'pendiente' else 'confirmada' end;
      v_metodo_pago := v_payment_methods[((v_sequence - 1) % array_length(v_payment_methods, 1)) + 1];

      select s.id, t.id, t.precio, t.duracion_min
      into v_servicio_id, v_tarifa_id, v_tarifa_precio, v_tarifa_duracion
      from public.servicio s
      join public.servicio_tarifa t on t.servicio_id = s.id
      where s.codigo = v_entry->>'servicio'
        and t.codigo = v_entry->>'tarifa'
        and t.activo = true
      order by t.vigencia_desde desc
      limit 1;

      if v_servicio_id is null or v_tarifa_id is null then
        raise exception 'No se encontro la combinacion servicio/tarifa % / %', v_entry->>'servicio', v_entry->>'tarifa';
      end if;

      if v_tarifa_duracion is null or v_tarifa_duracion <= 0 then
        raise exception 'La tarifa % del servicio % no tiene duracion valida', v_entry->>'tarifa', v_entry->>'servicio';
      end if;

      v_cantidad := (v_entry->>'qty')::int;
      v_numero_personas := (v_entry->>'persons')::int;

      v_start_tz := ((to_char(v_day, 'YYYY-MM-DD') || ' ' || (v_entry->>'start') || ':00+02')::timestamptz);
      v_end_tz := v_start_tz + make_interval(mins => v_tarifa_duracion);

      if v_entry->>'servicio' = 'BANANA' then
        v_total_bruto := round((v_tarifa_precio * v_numero_personas)::numeric, 2);
        v_metadata := jsonb_build_object('numero_personas', v_numero_personas);
      else
        v_total_bruto := round((v_tarifa_precio * v_cantidad)::numeric, 2);
        v_metadata := jsonb_build_object('numero_personas', v_numero_personas);
      end if;

      v_observacion := format(
        '%s | %s | %s | reserva %s',
        run_id,
        v_entry->>'servicio',
        to_char(v_day, 'YYYY-MM-DD'),
        lpad(v_sequence::text, 3, '0')
      );
      v_concepto_pago := format(
        '%s | pago %s | %s | reserva %s',
        run_id,
        v_entry->>'servicio',
        to_char(v_day, 'YYYY-MM-DD'),
        lpad(v_sequence::text, 3, '0')
      );

      insert into public.reserva_servicio (
        empresa_id,
        cliente_id,
        servicio_id,
        tarifa_id,
        cantidad_reservada,
        numero_personas_reserva,
        duracion_total_min,
        estado_asignacion_tramos,
        canal,
        estado,
        observaciones,
        total_bruto,
        total_descuento,
        total_neto,
        deposito_total_requerido,
        deposito_total_cobrado
      )
      values (
        v_empresa_id,
        v_client_id,
        v_servicio_id,
        v_tarifa_id,
        v_cantidad,
        case
          when v_entry->>'servicio' like 'ALQ_%' then null
          else v_numero_personas
        end,
        null,
        'no_aplica'::public.reserva_asignacion_tramos_estado,
        'backoffice'::public.reserva_canal,
        v_estado_reserva::public.reserva_estado,
        v_observacion,
        v_total_bruto,
        0,
        v_total_bruto,
        0,
        0
      )
      returning id into v_reserva_id;

      insert into public.reserva_servicio_item (
        reserva_id,
        servicio_id,
        tarifa_id,
        inicio,
        fin,
        cantidad,
        precio_unitario,
        descuento_unitario,
        subtotal,
        deposito_requerido,
        deposito_cobrado,
        estado,
        notas,
        metadata
      )
      values (
        v_reserva_id,
        v_servicio_id,
        v_tarifa_id,
        v_start_tz,
        v_end_tz,
        v_cantidad,
        case
          when v_entry->>'servicio' = 'BANANA' then v_total_bruto
          else v_tarifa_precio
        end,
        0,
        v_total_bruto,
        0,
        0,
        v_estado_reserva::public.reserva_item_estado,
        v_observacion,
        v_metadata
      );

      insert into public.pago (
        id_cliente,
        origen_tipo,
        origen_id,
        concepto,
        importe,
        metodo,
        estado
      )
      values (
        v_client_id,
        'reserva'::public.tipo_origen,
        v_reserva_id,
        v_concepto_pago,
        v_total_bruto,
        v_metodo_pago::public.tipo_metodo_pago,
        v_estado_pago::public.tipo_estado_pago
      )
      returning id into v_pago_id;

      insert into public.pago_aplicacion (
        pago_id,
        entidad_tipo,
        entidad_id,
        importe_aplicado,
        created_by
      )
      values (
        v_pago_id,
        'reserva_servicio'::public.pago_entidad_tipo,
        v_reserva_id,
        v_total_bruto,
        null
      );

      v_res_counter := v_sequence;
    end loop;
  end loop;

  select count(*)
  into v_actual_reservas
  from public.reserva_servicio
  where observaciones like run_id || '%';

  select count(*)
  into v_actual_pagos
  from public.pago
  where concepto like run_id || '%';

  select count(*)
  into v_actual_pagos_completados
  from public.pago
  where concepto like run_id || '%'
    and estado = 'completado';

  select count(*)
  into v_actual_movimientos_completados
  from public.movimiento_contable mc
  join public.pago p on p.id = mc.id_pago
  where p.concepto like run_id || '%'
    and p.estado = 'completado';

  select count(*)
  into v_actual_pagos_pendientes_con_movimiento
  from public.movimiento_contable mc
  join public.pago p on p.id = mc.id_pago
  where p.concepto like run_id || '%'
    and p.estado = 'pendiente';

  if array_length(v_client_ids, 1) <> 36 then
    raise exception 'Se esperaban 36 clientes y se generaron %', array_length(v_client_ids, 1);
  end if;

  if array_length(v_participant_ids, 1) <> 26 then
    raise exception 'Se esperaban 26 participantes de catalogo y se generaron %', array_length(v_participant_ids, 1);
  end if;

  if v_actual_reservas <> v_expected_reservas then
    raise exception 'Se esperaban % reservas y se generaron %', v_expected_reservas, v_actual_reservas;
  end if;

  if v_actual_pagos <> v_expected_pagos then
    raise exception 'Se esperaban % pagos y se generaron %', v_expected_pagos, v_actual_pagos;
  end if;

  if v_actual_movimientos_completados <> v_actual_pagos_completados then
    raise exception 'Pagos completados (%) y movimientos sincronizados (%) no coinciden', v_actual_pagos_completados, v_actual_movimientos_completados;
  end if;

  if v_actual_pagos_pendientes_con_movimiento <> 0 then
    raise exception 'Hay pagos pendientes con movimiento contable asociado: %', v_actual_pagos_pendientes_con_movimiento;
  end if;
end;
$$;

commit;
