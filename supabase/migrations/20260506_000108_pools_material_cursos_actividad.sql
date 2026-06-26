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

  insert into public.inventario_pool (
    empresa_id, codigo, nombre, unidad, cantidad_total, activo, metadata
  ) values
    (v_empresa_id, 'kitesurf', 'Kitesurf', 'unidad', 5, true, '{}'::jsonb),
    (v_empresa_id, 'wakeboard', 'Wakeboard', 'unidad', 5, true, '{}'::jsonb),
    (v_empresa_id, 'wingfoil', 'Wingfoil', 'unidad', 5, true, '{}'::jsonb),
    (v_empresa_id, 'banana', 'Banana', 'unidad', 1, true, '{}'::jsonb)
  on conflict (empresa_id, codigo) do update set
    nombre = excluded.nombre,
    unidad = excluded.unidad,
    cantidad_total = excluded.cantidad_total,
    activo = excluded.activo,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  insert into public.servicio_consumo_pool (
    servicio_id, pool_id, consumo_por_unidad, obligatorio, activo
  )
  select s.id, p.id, 1, true, true
  from (
    values
      ('KITESURF', 'kitesurf'),
      ('WAKEBOARD', 'wakeboard'),
      ('WINGFOIL', 'wingfoil'),
      ('BANANA', 'banana')
  ) x(servicio_codigo, pool_codigo)
  join public.servicio s
    on s.codigo = x.servicio_codigo
   and s.empresa_id = v_empresa_id
  join public.inventario_pool p
    on p.codigo = x.pool_codigo
   and p.empresa_id = v_empresa_id
  on conflict (servicio_id, pool_id) do update set
    consumo_por_unidad = excluded.consumo_por_unidad,
    obligatorio = excluded.obligatorio,
    activo = excluded.activo,
    updated_at = timezone('utc', now());
end;
$$;
