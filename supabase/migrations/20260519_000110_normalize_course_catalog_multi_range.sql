do $$
declare
  v_empresa_id uuid;
begin
  select id
  into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No se encontro la empresa Flecha Extreme';
  end if;

  update public.servicio
  set
    nombre = case codigo
      when 'CURSO_CATAMARAN' then 'Catamarán'
      when 'CURSO_PADDLESUP' then 'Paddle SUP'
      else nombre
    end,
    categoria = 'curso',
    modo_precio = 'por_persona',
    modo_agenda = 'sesion_manual',
    reservable = true,
    activo = true,
    updated_at = timezone('utc', now())
  where empresa_id = v_empresa_id
    and codigo in ('KITESURF', 'WINGFOIL', 'CURSO_CATAMARAN', 'CURSO_PADDLESUP', 'WAKEBOARD');

  update public.servicio_horario_regla r
  set
    activo = false,
    updated_at = timezone('utc', now())
  from public.servicio s
  where s.id = r.servicio_id
    and s.empresa_id = v_empresa_id
    and s.codigo in ('KITESURF', 'WINGFOIL');

  update public.servicio_tarifa t
  set
    activo = false,
    updated_at = timezone('utc', now())
  from public.servicio s
  where s.id = t.servicio_id
    and s.empresa_id = v_empresa_id
    and s.codigo in ('KITESURF', 'WINGFOIL', 'CURSO_CATAMARAN', 'CURSO_PADDLESUP', 'WAKEBOARD');

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
  select
    s.id,
    x.codigo,
    x.nombre_tarifa,
    x.duracion_min,
    x.precio,
    'EUR',
    0::numeric,
    true,
    current_date,
    true,
    jsonb_build_object(
      'curso_modalidad', x.modalidad,
      'permite_multi_tramo', x.permite_multi_tramo,
      'nombre_comercial', x.nombre_comercial
    )
  from (
    values
      ('KITESURF', 'BAUTISMO_180M', 'Bautismo', 180, 75::numeric, 'bautismo', false, 'Kitesurf Bautismo'),
      ('KITESURF', 'INICIACION_480M', 'Iniciación', 480, 220::numeric, 'iniciacion', true, 'Kitesurf Iniciación'),
      ('KITESURF', 'PERF_150M', 'Perfeccionamiento', 150, 70::numeric, 'perfeccionamiento', false, 'Kitesurf Perfeccionamiento'),
      ('WINGFOIL', 'INICIACION_480M', 'Iniciación', 480, 300::numeric, 'iniciacion', true, 'Wingfoil Iniciación'),
      ('CURSO_PADDLESUP', 'STD_120M', 'Paddle SUP', 120, 35::numeric, 'curso', false, 'Paddle SUP'),
      ('CURSO_CATAMARAN', 'BAUTISMO_360M', 'Bautismo', 360, 105::numeric, 'bautismo', true, 'Catamarán Bautismo'),
      ('CURSO_CATAMARAN', 'INICIACION_600M', 'Iniciación', 600, 150::numeric, 'iniciacion', true, 'Catamarán Iniciación'),
      ('WAKEBOARD', 'STD_30M', 'Wakeboard', 30, 50::numeric, 'curso', false, 'Wakeboard')
  ) as x(servicio_codigo, codigo, nombre_tarifa, duracion_min, precio, modalidad, permite_multi_tramo, nombre_comercial)
  join public.servicio s
    on s.codigo = x.servicio_codigo
   and s.empresa_id = v_empresa_id
  on conflict (servicio_id, codigo, vigencia_desde) do update set
    nombre_tarifa = excluded.nombre_tarifa,
    duracion_min = excluded.duracion_min,
    precio = excluded.precio,
    deposito_requerido = excluded.deposito_requerido,
    incluye_deposito_en_precio = excluded.incluye_deposito_en_precio,
    activo = excluded.activo,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  update public.servicio s
  set
    duracion_minima_min = bounds.min_duration,
    duracion_maxima_min = bounds.max_duration,
    updated_at = timezone('utc', now())
  from (
    select
      servicio_id,
      min(duracion_min) as min_duration,
      max(duracion_min) as max_duration
    from public.servicio_tarifa
    where activo = true
      and duracion_min is not null
    group by servicio_id
  ) as bounds
  where s.id = bounds.servicio_id
    and s.empresa_id = v_empresa_id
    and s.codigo in ('KITESURF', 'WINGFOIL', 'CURSO_CATAMARAN', 'CURSO_PADDLESUP', 'WAKEBOARD');
end;
$$;
