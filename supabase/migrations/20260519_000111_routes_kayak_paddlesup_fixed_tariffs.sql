do $$
declare
  v_empresa_id uuid;
  v_ruta_kayak_id uuid;
  v_ruta_paddlesup_id uuid;
  v_pool_kayak_id uuid;
  v_pool_paddlesup_id uuid;
begin
  select id
  into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No existe empresa Flecha Extreme';
  end if;

  update public.servicio
  set
    nombre = 'Ruta Kayak',
    categoria = 'ruta',
    modo_precio = 'fijo',
    modo_agenda = 'sesion_manual',
    reservable = true,
    activo = true,
    updated_at = timezone('utc', now())
  where empresa_id = v_empresa_id
    and codigo = 'RUTA_KAYAK';

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
    duracion_minima_min,
    duracion_maxima_min,
    deposito_permitido,
    deposito_obligatorio,
    deposito_default,
    metadata
  )
  values (
    v_empresa_id,
    'RUTA_PADDLESUP',
    'Ruta PaddleSUP',
    'ruta',
    'fijo',
    'sesion_manual',
    true,
    true,
    true,
    90,
    90,
    true,
    false,
    0,
    '{}'::jsonb
  )
  on conflict (empresa_id, codigo) do update set
    nombre = excluded.nombre,
    categoria = excluded.categoria,
    modo_precio = excluded.modo_precio,
    modo_agenda = excluded.modo_agenda,
    requiere_sesion = excluded.requiere_sesion,
    reservable = excluded.reservable,
    activo = excluded.activo,
    duracion_minima_min = excluded.duracion_minima_min,
    duracion_maxima_min = excluded.duracion_maxima_min,
    deposito_permitido = excluded.deposito_permitido,
    deposito_obligatorio = excluded.deposito_obligatorio,
    deposito_default = excluded.deposito_default,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  select id into v_ruta_kayak_id
  from public.servicio
  where empresa_id = v_empresa_id
    and codigo = 'RUTA_KAYAK'
  limit 1;

  if v_ruta_kayak_id is null then
    raise exception 'No existe el servicio RUTA_KAYAK para Flecha Extreme';
  end if;

  select id into v_ruta_paddlesup_id
  from public.servicio
  where empresa_id = v_empresa_id
    and codigo = 'RUTA_PADDLESUP'
  limit 1;

  select id into v_pool_kayak_id
  from public.inventario_pool
  where empresa_id = v_empresa_id
    and codigo = 'kayak'
  limit 1;

  if v_pool_kayak_id is null then
    raise exception 'No existe el pool kayak para Flecha Extreme';
  end if;

  select id into v_pool_paddlesup_id
  from public.inventario_pool
  where empresa_id = v_empresa_id
    and codigo = 'paddlesup'
  limit 1;

  if v_pool_paddlesup_id is null then
    raise exception 'No existe el pool paddlesup para Flecha Extreme';
  end if;

  update public.servicio_tarifa
  set activo = false,
      updated_at = timezone('utc', now())
  where servicio_id in (v_ruta_kayak_id, v_ruta_paddlesup_id)
    and activo = true
    and codigo <> 'STD_90M';

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
  )
  values
    (v_ruta_kayak_id, 'STD_90M', 'Estándar 1h30', 90, 25::numeric, 'EUR', 0::numeric, true, current_date, true, '{}'::jsonb),
    (v_ruta_paddlesup_id, 'STD_90M', 'Estándar 1h30', 90, 25::numeric, 'EUR', 0::numeric, true, current_date, true, '{}'::jsonb)
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

  update public.servicio_tarifa
  set activo = false,
      updated_at = timezone('utc', now())
  where servicio_id in (v_ruta_kayak_id, v_ruta_paddlesup_id)
    and codigo = 'STD_90M'
    and vigencia_desde < current_date
    and activo = true;

  insert into public.servicio_consumo_pool (
    servicio_id,
    pool_id,
    consumo_por_unidad,
    obligatorio,
    activo
  )
  values
    (v_ruta_kayak_id, v_pool_kayak_id, 1, true, true),
    (v_ruta_paddlesup_id, v_pool_paddlesup_id, 1, true, true)
  on conflict (servicio_id, pool_id) do update set
    consumo_por_unidad = excluded.consumo_por_unidad,
    obligatorio = excluded.obligatorio,
    activo = excluded.activo,
    updated_at = timezone('utc', now());

  update public.servicio
  set
    duracion_minima_min = 90,
    duracion_maxima_min = 90,
    updated_at = timezone('utc', now())
  where id in (v_ruta_kayak_id, v_ruta_paddlesup_id);
end;
$$;
