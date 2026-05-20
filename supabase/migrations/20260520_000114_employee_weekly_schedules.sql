create table if not exists public.empleado_horario_semana (
  id uuid primary key default gen_random_uuid(),
  semana_inicio date not null unique,
  created_by uuid references public.usuario(id) on delete set null,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint empleado_horario_semana_lunes_chk check (extract(isodow from semana_inicio) = 1)
);

create table if not exists public.empleado_horario_semana_empleado (
  id uuid primary key default gen_random_uuid(),
  semana_id uuid not null references public.empleado_horario_semana(id) on delete cascade,
  empleado_id uuid not null references public.empleado(id) on delete restrict,
  orden integer not null default 0,
  aperturas integer not null default 0,
  cierres integer not null default 0,
  horas_fin_semana numeric(5,2) not null default 0,
  nota text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint empleado_horario_semana_empleado_unique unique (semana_id, empleado_id),
  constraint empleado_horario_semana_empleado_orden_chk check (orden >= 0),
  constraint empleado_horario_semana_empleado_aperturas_chk check (aperturas >= 0),
  constraint empleado_horario_semana_empleado_cierres_chk check (cierres >= 0),
  constraint empleado_horario_semana_empleado_fin_semana_chk check (horas_fin_semana >= 0)
);

create table if not exists public.empleado_horario_dia (
  id uuid primary key default gen_random_uuid(),
  semana_empleado_id uuid not null references public.empleado_horario_semana_empleado(id) on delete cascade,
  dia_semana smallint not null,
  manana_inicio time,
  manana_fin time,
  tarde_inicio time,
  tarde_fin time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint empleado_horario_dia_unique unique (semana_empleado_id, dia_semana),
  constraint empleado_horario_dia_dia_chk check (dia_semana between 1 and 7),
  constraint empleado_horario_dia_manana_pair_chk check (
    (manana_inicio is null and manana_fin is null)
    or (manana_inicio is not null and manana_fin is not null)
  ),
  constraint empleado_horario_dia_tarde_pair_chk check (
    (tarde_inicio is null and tarde_fin is null)
    or (tarde_inicio is not null and tarde_fin is not null)
  ),
  constraint empleado_horario_dia_manana_order_chk check (
    manana_inicio is null or manana_fin > manana_inicio
  ),
  constraint empleado_horario_dia_tarde_order_chk check (
    tarde_inicio is null or tarde_fin > tarde_inicio
  )
);

create index if not exists empleado_horario_semana_empleado_semana_idx
  on public.empleado_horario_semana_empleado (semana_id, orden);

create index if not exists empleado_horario_semana_empleado_empleado_idx
  on public.empleado_horario_semana_empleado (empleado_id);

create index if not exists empleado_horario_dia_semana_empleado_idx
  on public.empleado_horario_dia (semana_empleado_id, dia_semana);

drop trigger if exists set_empleado_horario_semana_updated_at on public.empleado_horario_semana;
create trigger set_empleado_horario_semana_updated_at
before update on public.empleado_horario_semana
for each row execute function public.fn_set_updated_at();

drop trigger if exists set_empleado_horario_semana_empleado_updated_at on public.empleado_horario_semana_empleado;
create trigger set_empleado_horario_semana_empleado_updated_at
before update on public.empleado_horario_semana_empleado
for each row execute function public.fn_set_updated_at();

drop trigger if exists set_empleado_horario_dia_updated_at on public.empleado_horario_dia;
create trigger set_empleado_horario_dia_updated_at
before update on public.empleado_horario_dia
for each row execute function public.fn_set_updated_at();

alter table public.empleado_horario_semana enable row level security;
alter table public.empleado_horario_semana_empleado enable row level security;
alter table public.empleado_horario_dia enable row level security;

drop policy if exists empleado_horario_semana_select_admin on public.empleado_horario_semana;
create policy empleado_horario_semana_select_admin on public.empleado_horario_semana
for select using (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_insert_admin on public.empleado_horario_semana;
create policy empleado_horario_semana_insert_admin on public.empleado_horario_semana
for insert with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_update_admin on public.empleado_horario_semana;
create policy empleado_horario_semana_update_admin on public.empleado_horario_semana
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_delete_admin on public.empleado_horario_semana;
create policy empleado_horario_semana_delete_admin on public.empleado_horario_semana
for delete using (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_empleado_select_admin on public.empleado_horario_semana_empleado;
create policy empleado_horario_semana_empleado_select_admin on public.empleado_horario_semana_empleado
for select using (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_empleado_insert_admin on public.empleado_horario_semana_empleado;
create policy empleado_horario_semana_empleado_insert_admin on public.empleado_horario_semana_empleado
for insert with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_empleado_update_admin on public.empleado_horario_semana_empleado;
create policy empleado_horario_semana_empleado_update_admin on public.empleado_horario_semana_empleado
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_semana_empleado_delete_admin on public.empleado_horario_semana_empleado;
create policy empleado_horario_semana_empleado_delete_admin on public.empleado_horario_semana_empleado
for delete using (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_dia_select_admin on public.empleado_horario_dia;
create policy empleado_horario_dia_select_admin on public.empleado_horario_dia
for select using (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_dia_insert_admin on public.empleado_horario_dia;
create policy empleado_horario_dia_insert_admin on public.empleado_horario_dia
for insert with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_dia_update_admin on public.empleado_horario_dia;
create policy empleado_horario_dia_update_admin on public.empleado_horario_dia
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

drop policy if exists empleado_horario_dia_delete_admin on public.empleado_horario_dia;
create policy empleado_horario_dia_delete_admin on public.empleado_horario_dia
for delete using (public.fn_backoffice_is_admin());

create or replace function public.empleado_horario_copy_week(
  p_source_week_start date,
  p_target_week_start date
)
returns uuid
language plpgsql
security definer
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
