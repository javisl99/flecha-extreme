do $$
declare
  v_empresa_id uuid;
  v_servicio_id uuid;
  v_parking_tipo public.parking_tipo;
  rec record;
begin
  select id
  into v_empresa_id
  from public.empresa
  where nombre = 'Flecha Extreme'
  limit 1;

  if v_empresa_id is null then
    raise exception 'No existe empresa Flecha Extreme';
  end if;

  for rec in
    select *
    from (
      values
        ('PARKING_TABLA', 'PARK_DAY', 'Parking diario', 10::numeric, 'dia'::public.parking_periodo),
        ('PARKING_TABLA', 'PARK_WEEK', 'Parking semanal', 20::numeric, 'semana'::public.parking_periodo),
        ('PARKING_TABLA', 'PARK_QNA', 'Parking quincena', 25::numeric, 'quincena'::public.parking_periodo),
        ('PARKING_TABLA', 'PARK_MES', 'Parking mensual', 30::numeric, 'mes'::public.parking_periodo),
        ('PARKING_KAYAK', 'PARK_DAY', 'Parking diario', 10::numeric, 'dia'::public.parking_periodo),
        ('PARKING_KAYAK', 'PARK_WEEK', 'Parking semanal', 30::numeric, 'semana'::public.parking_periodo),
        ('PARKING_KAYAK', 'PARK_QNA', 'Parking quincena', 35::numeric, 'quincena'::public.parking_periodo),
        ('PARKING_KAYAK', 'PARK_MES', 'Parking mensual', 50::numeric, 'mes'::public.parking_periodo),
        ('PARKING_EMBARCACION', 'PARK_DAY', 'Parking diario', 30::numeric, 'dia'::public.parking_periodo),
        ('PARKING_EMBARCACION', 'PARK_WEEK', 'Parking semanal', 80::numeric, 'semana'::public.parking_periodo),
        ('PARKING_EMBARCACION', 'PARK_QNA', 'Parking quincena', 100::numeric, 'quincena'::public.parking_periodo),
        ('PARKING_EMBARCACION', 'PARK_MES', 'Parking mensual', 150::numeric, 'mes'::public.parking_periodo)
    ) as x(servicio_codigo, codigo, nombre_tarifa, precio, periodo)
  loop
    select id
    into v_servicio_id
    from public.servicio
    where empresa_id = v_empresa_id
      and codigo = rec.servicio_codigo
    limit 1;

    if v_servicio_id is null then
      raise exception 'No se encontró el servicio % para Flecha Extreme', rec.servicio_codigo;
    end if;

    v_parking_tipo := case rec.servicio_codigo
      when 'PARKING_TABLA' then 'tabla'::public.parking_tipo
      when 'PARKING_KAYAK' then 'kayak'::public.parking_tipo
      else 'embarcacion'::public.parking_tipo
    end;

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
    ) values (
      v_servicio_id,
      rec.codigo,
      rec.nombre_tarifa,
      null,
      rec.precio,
      'EUR',
      0,
      true,
      current_date,
      true,
      jsonb_build_object('parking_periodo', rec.periodo::text, 'parking_tipo', v_parking_tipo::text)
    )
    on conflict (servicio_id, codigo, vigencia_desde)
    do update set
      nombre_tarifa = excluded.nombre_tarifa,
      precio = excluded.precio,
      activo = excluded.activo,
      metadata = excluded.metadata,
      updated_at = timezone('utc', now());

    insert into public.parking_tarifa (
      empresa_id,
      tipo,
      periodo,
      precio,
      moneda,
      vigencia_desde,
      activo
    ) values (
      v_empresa_id,
      v_parking_tipo,
      rec.periodo,
      rec.precio,
      'EUR',
      current_date,
      true
    )
    on conflict (empresa_id, tipo, periodo, vigencia_desde)
    do update set
      precio = excluded.precio,
      activo = excluded.activo,
      updated_at = timezone('utc', now());
  end loop;
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

  if v_periodo = 'dia' then
    v_fecha_fin := p_fecha_inicio + 1;
  elsif v_periodo = 'semana' then
    v_fecha_fin := p_fecha_inicio + 7;
  elsif v_periodo = 'quincena' then
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
