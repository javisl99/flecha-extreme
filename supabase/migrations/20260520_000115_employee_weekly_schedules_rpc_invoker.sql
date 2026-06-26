create or replace function public.empleado_horario_copy_week(
  p_source_week_start date,
  p_target_week_start date
)
returns uuid
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_source_week public.empleado_horario_semana%rowtype;
  v_target_week_id uuid;
  v_source_employee public.empleado_horario_semana_empleado%rowtype;
  v_target_employee_id uuid;
  v_day public.empleado_horario_dia%rowtype;
  v_user_id uuid;
begin
  if extract(isodow from p_source_week_start) <> 1 then
    raise exception 'La semana origen debe empezar en lunes';
  end if;

  if extract(isodow from p_target_week_start) <> 1 then
    raise exception 'La semana destino debe empezar en lunes';
  end if;

  if not public.fn_backoffice_is_admin() then
    raise exception 'No tiene permisos para copiar semanas de horarios';
  end if;

  select *
  into v_source_week
  from public.empleado_horario_semana
  where semana_inicio = p_source_week_start;

  if not found then
    raise exception 'La semana origen no existe';
  end if;

  if exists (
    select 1
    from public.empleado_horario_semana
    where semana_inicio = p_target_week_start
  ) then
    raise exception 'La semana destino ya existe';
  end if;

  v_user_id := public.fn_backoffice_user_id();

  insert into public.empleado_horario_semana (
    semana_inicio,
    created_by,
    updated_by
  )
  values (
    p_target_week_start,
    v_user_id,
    v_user_id
  )
  returning id into v_target_week_id;

  for v_source_employee in
    select *
    from public.empleado_horario_semana_empleado
    where semana_id = v_source_week.id
    order by orden, created_at, id
  loop
    insert into public.empleado_horario_semana_empleado (
      semana_id,
      empleado_id,
      orden,
      aperturas,
      cierres,
      horas_fin_semana,
      nota
    )
    values (
      v_target_week_id,
      v_source_employee.empleado_id,
      v_source_employee.orden,
      v_source_employee.aperturas,
      v_source_employee.cierres,
      v_source_employee.horas_fin_semana,
      v_source_employee.nota
    )
    returning id into v_target_employee_id;

    for v_day in
      select *
      from public.empleado_horario_dia
      where semana_empleado_id = v_source_employee.id
      order by dia_semana
    loop
      insert into public.empleado_horario_dia (
        semana_empleado_id,
        dia_semana,
        manana_inicio,
        manana_fin,
        tarde_inicio,
        tarde_fin
      )
      values (
        v_target_employee_id,
        v_day.dia_semana,
        v_day.manana_inicio,
        v_day.manana_fin,
        v_day.tarde_inicio,
        v_day.tarde_fin
      );
    end loop;
  end loop;

  return v_target_week_id;
end;
$$;
