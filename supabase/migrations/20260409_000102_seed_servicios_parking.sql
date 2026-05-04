-- Seed inicial del nuevo modelo de servicios, inventario y parking

do $$
declare
  v_empresa_id uuid;
begin
  select id into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No existe empresa Flecha Extreme';
  end if;

  -- Servicios
  insert into public.servicio (
    empresa_id, codigo, nombre, categoria, modo_precio, modo_agenda,
    requiere_sesion, reservable, activo, capacidad_max,
    duracion_minima_min, deposito_permitido, deposito_obligatorio, deposito_default,
    notas, metadata
  ) values
    (v_empresa_id, 'WAKEBOARD', 'Wakeboard', 'curso', 'por_persona', 'libre', false, true, true, null, 30, true, false, 0, null, '{}'::jsonb),
    (v_empresa_id, 'BANANA', 'Banana', 'actividad', 'por_persona', 'libre', false, true, true, null, 20, true, false, 0, null, '{}'::jsonb),
    (v_empresa_id, 'EXTREME_CAMP', 'Extreme Camp', 'campamento', 'por_persona', 'horario_recurrente', true, true, true, null, null, true, true, 20, 'Campamento con depósito obligatorio', '{}'::jsonb),
    (v_empresa_id, 'SUMMER_CAMP', 'Summer Camp', 'campamento', 'por_persona', 'horario_recurrente', true, true, true, null, null, true, true, 20, 'Campamento con depósito obligatorio', '{}'::jsonb),
    (v_empresa_id, 'RUTA_KAYAK', 'Rutas Kayak', 'ruta', 'fijo', 'sesion_manual', true, true, true, null, null, true, false, 0, 'Precio configurable manualmente por sesión', '{}'::jsonb),
    (v_empresa_id, 'CURSO_CATAMARAN', 'Curso Catamarán', 'curso', 'por_persona', 'sesion_manual', true, false, true, 4, null, true, false, 0, 'Reservable cuando se defina stock del pool catamaran', '{}'::jsonb),
    (v_empresa_id, 'ALQ_PADDLESUP', 'Alquiler PaddleSup', 'alquiler', 'fijo', 'libre', false, false, true, null, 60, true, false, 0, 'Reservable cuando se defina stock del pool paddlesup', '{}'::jsonb),
    (v_empresa_id, 'ALQ_BIGSUP', 'Alquiler BigSup', 'alquiler', 'fijo', 'libre', false, false, true, null, 60, true, false, 0, 'Reservable cuando se defina stock del pool bigsup', '{}'::jsonb),
    (v_empresa_id, 'CURSO_PADDLESUP', 'Curso PaddleSup', 'curso', 'por_persona', 'sesion_manual', true, false, true, null, null, true, false, 0, 'Reservable cuando se defina stock del pool paddlesup', '{}'::jsonb),
    (v_empresa_id, 'ALQ_KAYAK', 'Alquiler Kayak', 'alquiler', 'fijo', 'libre', false, true, true, null, 60, true, false, 0, null, '{}'::jsonb),
    (v_empresa_id, 'ALQ_CATAMARAN', 'Alquiler Catamarán', 'alquiler', 'fijo', 'libre', false, false, true, null, 60, true, false, 0, 'Reservable cuando se defina stock del pool catamaran', '{}'::jsonb),
    (v_empresa_id, 'ALQ_ZODIAK', 'Alquiler Zodiak', 'alquiler', 'fijo', 'libre', false, false, true, null, 60, true, false, 0, 'Reservable cuando se defina stock del pool zodiak', '{}'::jsonb),
    (v_empresa_id, 'WINGFOIL', 'Wingfoil', 'curso', 'por_persona', 'horario_recurrente', false, true, true, null, 150, true, false, 0, null, '{}'::jsonb),
    (v_empresa_id, 'KITESURF', 'Kitesurf', 'curso', 'por_persona', 'horario_recurrente', false, true, true, null, 150, true, false, 0, null, '{}'::jsonb)
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

  -- Tarifas
  insert into public.servicio_tarifa (
    servicio_id, codigo, nombre_tarifa, duracion_min, precio, moneda,
    deposito_requerido, incluye_deposito_en_precio, vigencia_desde, activo, metadata
  )
  select s.id, x.codigo, x.nombre_tarifa, x.duracion_min, x.precio, 'EUR',
         x.deposito_requerido, x.incluye_deposito_en_precio, current_date, true, '{}'::jsonb
  from (
    values
      ('WAKEBOARD', 'STD_30M', 'Estándar 30 min', 30, 50::numeric, 0::numeric, true),
      ('BANANA', 'STD_20M', 'Estándar 20 min', 20, 15::numeric, 0::numeric, true),
      ('EXTREME_CAMP', 'STD_CAMP', 'Estándar campamento', null::integer, 120::numeric, 20::numeric, true),
      ('SUMMER_CAMP', 'STD_CAMP', 'Estándar campamento', null::integer, 60::numeric, 20::numeric, true),
      ('CURSO_CATAMARAN', 'CURSO_6H', 'Curso 6h', 360, 105::numeric, 0::numeric, true),
      ('CURSO_CATAMARAN', 'CURSO_10H', 'Curso 10h', 600, 150::numeric, 0::numeric, true),
      ('WINGFOIL', 'STD_150M', 'Estándar 2h30', 150, 70::numeric, 0::numeric, true),
      ('WINGFOIL', 'STD_180M', 'Estándar 3h', 180, 80::numeric, 0::numeric, true),
      ('KITESURF', 'STD_150M', 'Estándar 2h30', 150, 70::numeric, 0::numeric, true),
      ('KITESURF', 'STD_180M', 'Estándar 3h', 180, 80::numeric, 0::numeric, true)
  ) as x(servicio_codigo, codigo, nombre_tarifa, duracion_min, precio, deposito_requerido, incluye_deposito_en_precio)
  join public.servicio s on s.codigo = x.servicio_codigo and s.empresa_id = v_empresa_id
  on conflict (servicio_id, codigo, vigencia_desde) do update set
    nombre_tarifa = excluded.nombre_tarifa,
    duracion_min = excluded.duracion_min,
    precio = excluded.precio,
    deposito_requerido = excluded.deposito_requerido,
    incluye_deposito_en_precio = excluded.incluye_deposito_en_precio,
    activo = excluded.activo,
    updated_at = timezone('utc', now());

  -- Tarifa especial Banana campamento (12€)
  insert into public.servicio_tarifa_especial (
    servicio_id, tarifa_id, codigo, etiqueta, precio_override, condicion, prioridad,
    vigencia_desde, activo
  )
  select s.id, t.id, 'CAMP_12', 'Campamento', 12, '{"tipo":"campamento"}'::jsonb, 10, current_date, true
  from public.servicio s
  join public.servicio_tarifa t on t.servicio_id = s.id and t.codigo = 'STD_20M'
  where s.codigo = 'BANANA' and s.empresa_id = v_empresa_id
  on conflict (servicio_id, codigo) do update set
    etiqueta = excluded.etiqueta,
    precio_override = excluded.precio_override,
    condicion = excluded.condicion,
    prioridad = excluded.prioridad,
    activo = excluded.activo,
    updated_at = timezone('utc', now());

  -- Horarios recurrentes (Lunes=1 ... Domingo=7)
  insert into public.servicio_horario_regla (
    servicio_id, dia_semana, hora_inicio, hora_fin, activo, created_at, updated_at
  )
  select s.id, x.dia_semana, x.hora_inicio, x.hora_fin, true, timezone('utc', now()), timezone('utc', now())
  from (
    values
      ('EXTREME_CAMP', 1, '17:00'::time, '19:00'::time),
      ('EXTREME_CAMP', 2, '17:00'::time, '19:00'::time),
      ('EXTREME_CAMP', 3, '17:00'::time, '19:00'::time),
      ('EXTREME_CAMP', 4, '17:00'::time, '19:00'::time),
      ('EXTREME_CAMP', 5, '17:00'::time, '19:00'::time),
      ('SUMMER_CAMP', 1, '11:00'::time, '13:30'::time),
      ('SUMMER_CAMP', 1, '11:30'::time, '14:00'::time),
      ('SUMMER_CAMP', 2, '11:00'::time, '13:30'::time),
      ('SUMMER_CAMP', 2, '11:30'::time, '14:00'::time),
      ('SUMMER_CAMP', 3, '11:00'::time, '13:30'::time),
      ('SUMMER_CAMP', 3, '11:30'::time, '14:00'::time),
      ('SUMMER_CAMP', 4, '11:00'::time, '13:30'::time),
      ('SUMMER_CAMP', 4, '11:30'::time, '14:00'::time),
      ('SUMMER_CAMP', 5, '11:00'::time, '13:30'::time),
      ('SUMMER_CAMP', 5, '11:30'::time, '14:00'::time),
      ('WINGFOIL', 1, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 2, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 3, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 4, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 5, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 6, '16:00'::time, '19:00'::time),
      ('WINGFOIL', 7, '16:00'::time, '19:00'::time),
      ('KITESURF', 1, '16:00'::time, '19:00'::time),
      ('KITESURF', 2, '16:00'::time, '19:00'::time),
      ('KITESURF', 3, '16:00'::time, '19:00'::time),
      ('KITESURF', 4, '16:00'::time, '19:00'::time),
      ('KITESURF', 5, '16:00'::time, '19:00'::time),
      ('KITESURF', 6, '16:00'::time, '19:00'::time),
      ('KITESURF', 7, '16:00'::time, '19:00'::time)
  ) as x(servicio_codigo, dia_semana, hora_inicio, hora_fin)
  join public.servicio s on s.codigo = x.servicio_codigo and s.empresa_id = v_empresa_id
  on conflict do nothing;

  -- Pools de inventario
  insert into public.inventario_pool (
    empresa_id, codigo, nombre, unidad, cantidad_total, activo, metadata
  ) values
    (v_empresa_id, 'kayak', 'Kayak', 'unidad', 15, true, '{}'::jsonb),
    (v_empresa_id, 'paddlesup', 'PaddleSup', 'unidad', null, true, '{}'::jsonb),
    (v_empresa_id, 'bigsup', 'BigSup', 'unidad', null, true, '{}'::jsonb),
    (v_empresa_id, 'catamaran', 'Catamarán', 'unidad', null, true, '{}'::jsonb),
    (v_empresa_id, 'zodiak', 'Zodiak', 'unidad', null, true, '{}'::jsonb)
  on conflict (empresa_id, codigo) do update set
    nombre = excluded.nombre,
    unidad = excluded.unidad,
    cantidad_total = excluded.cantidad_total,
    activo = excluded.activo,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  -- Consumo de pools por servicio
  insert into public.servicio_consumo_pool (
    servicio_id, pool_id, consumo_por_unidad, obligatorio, activo
  )
  select s.id, p.id, 1, true, true
  from (
    values
      ('ALQ_KAYAK', 'kayak'),
      ('RUTA_KAYAK', 'kayak'),
      ('ALQ_PADDLESUP', 'paddlesup'),
      ('CURSO_PADDLESUP', 'paddlesup'),
      ('ALQ_BIGSUP', 'bigsup'),
      ('ALQ_CATAMARAN', 'catamaran'),
      ('CURSO_CATAMARAN', 'catamaran'),
      ('ALQ_ZODIAK', 'zodiak')
  ) x(servicio_codigo, pool_codigo)
  join public.servicio s on s.codigo = x.servicio_codigo and s.empresa_id = v_empresa_id
  join public.inventario_pool p on p.codigo = x.pool_codigo and p.empresa_id = v_empresa_id
  on conflict (servicio_id, pool_id) do update set
    consumo_por_unidad = excluded.consumo_por_unidad,
    obligatorio = excluded.obligatorio,
    activo = excluded.activo,
    updated_at = timezone('utc', now());

  -- Forzar reservable=false cuando depende de pool sin cantidad definida
  update public.servicio s
  set reservable = false,
      updated_at = timezone('utc', now())
  where s.empresa_id = v_empresa_id
    and exists (
      select 1
      from public.servicio_consumo_pool scp
      join public.inventario_pool ip on ip.id = scp.pool_id
      where scp.servicio_id = s.id
        and scp.activo = true
        and scp.obligatorio = true
        and (ip.cantidad_total is null or ip.cantidad_total <= 0)
    );

  -- Parking plazas: conservar inventario previo de backup
  if to_regclass('backup.plaza_parking_20260409') is not null then
    insert into public.parking_plaza (
      empresa_id, codigo, tipo, activo, notas, metadata
    )
    select
      v_empresa_id,
      trim(b.codigo),
      (b.tipo::text)::public.parking_tipo,
      coalesce(b.disponible, true),
      null,
      '{}'::jsonb
    from backup.plaza_parking_20260409 b
    where b.codigo is not null and b.codigo <> ''
    on conflict (empresa_id, codigo) do update set
      tipo = excluded.tipo,
      activo = excluded.activo,
      updated_at = timezone('utc', now());
  end if;

  -- Fallback si no hay snapshot
  if not exists (select 1 from public.parking_plaza where empresa_id = v_empresa_id) then
    insert into public.parking_plaza (empresa_id, codigo, tipo, activo)
    select v_empresa_id, 't-' || gs::text, 'tabla'::public.parking_tipo, true from generate_series(1, 30) gs
    union all
    select v_empresa_id, 'k-' || gs::text, 'kayak'::public.parking_tipo, true from generate_series(1, 12) gs
    union all
    select v_empresa_id, 'e-' || gs::text, 'embarcacion'::public.parking_tipo, true from generate_series(1, 18) gs;
  end if;

  -- Tarifas parking
  insert into public.parking_tarifa (
    empresa_id, tipo, periodo, precio, moneda, vigencia_desde, activo
  ) values
    (v_empresa_id, 'tabla', 'quincena', 25, 'EUR', current_date, true),
    (v_empresa_id, 'tabla', 'mes', 30, 'EUR', current_date, true),
    (v_empresa_id, 'kayak', 'quincena', 35, 'EUR', current_date, true),
    (v_empresa_id, 'kayak', 'mes', 50, 'EUR', current_date, true),
    (v_empresa_id, 'embarcacion', 'quincena', 100, 'EUR', current_date, true),
    (v_empresa_id, 'embarcacion', 'mes', 150, 'EUR', current_date, true)
  on conflict (empresa_id, tipo, periodo, vigencia_desde) do update set
    precio = excluded.precio,
    activo = excluded.activo,
    updated_at = timezone('utc', now());

end;
$$;
