create table if not exists public.campamento_participante_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  dni text null,
  nombre_normalizado text generated always as (
    lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g'))
  ) stored,
  dni_normalizado text generated always as (
    nullif(upper(regexp_replace(coalesce(dni, ''), '\s+', '', 'g')), '')
  ) stored,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint campamento_participante_catalogo_nombre_check check (length(btrim(nombre)) > 0)
);

alter table public.campamento_participante_catalogo enable row level security;

create unique index if not exists ux_camp_part_catalogo_dni_norm
  on public.campamento_participante_catalogo (dni_normalizado)
  where dni_normalizado is not null;

create index if not exists ix_camp_part_catalogo_nombre_norm
  on public.campamento_participante_catalogo (nombre_normalizado);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_catalogo'
      and policyname = 'campamento_participante_catalogo_select_backoffice'
  ) then
    create policy campamento_participante_catalogo_select_backoffice
      on public.campamento_participante_catalogo
      for select
      using (fn_backoffice_can_read());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_catalogo'
      and policyname = 'campamento_participante_catalogo_insert_backoffice'
  ) then
    create policy campamento_participante_catalogo_insert_backoffice
      on public.campamento_participante_catalogo
      for insert
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_catalogo'
      and policyname = 'campamento_participante_catalogo_update_backoffice'
  ) then
    create policy campamento_participante_catalogo_update_backoffice
      on public.campamento_participante_catalogo
      for update
      using (fn_backoffice_can_write())
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_catalogo'
      and policyname = 'campamento_participante_catalogo_delete_admin'
  ) then
    create policy campamento_participante_catalogo_delete_admin
      on public.campamento_participante_catalogo
      for delete
      using (fn_backoffice_is_admin());
  end if;
end
$$;

alter table public.campamento_participante
  add column if not exists participante_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campamento_participante_participante_id_fkey'
  ) then
    alter table public.campamento_participante
      add constraint campamento_participante_participante_id_fkey
      foreign key (participante_id)
      references public.campamento_participante_catalogo(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists ux_camp_participante_reserva_participante
  on public.campamento_participante (reserva_id, participante_id)
  where participante_id is not null;

insert into public.campamento_participante_catalogo (nombre, dni)
select src.nombre, src.dni
from (
  select
    btrim(nombre) as nombre,
    nullif(upper(regexp_replace(coalesce(dni, ''), '\s+', '', 'g')), '') as dni
  from public.campamento_participante
  where btrim(coalesce(nombre, '')) <> ''
  group by 1, 2
) as src
where not exists (
  select 1
  from public.campamento_participante_catalogo c
  where (
    src.dni is not null
    and c.dni_normalizado = src.dni
  )
  or (
    src.dni is null
    and c.dni_normalizado is null
    and c.nombre_normalizado = lower(regexp_replace(src.nombre, '\s+', ' ', 'g'))
  )
);

update public.campamento_participante cp
set participante_id = c.id,
    nombre = c.nombre,
    dni = c.dni,
    updated_at = timezone('utc'::text, now())
from public.campamento_participante_catalogo c
where cp.participante_id is null
  and (
    (
      nullif(upper(regexp_replace(coalesce(cp.dni, ''), '\s+', '', 'g')), '') is not null
      and c.dni_normalizado = nullif(upper(regexp_replace(coalesce(cp.dni, ''), '\s+', '', 'g')), '')
    )
    or (
      nullif(upper(regexp_replace(coalesce(cp.dni, ''), '\s+', '', 'g')), '') is null
      and c.dni_normalizado is null
      and c.nombre_normalizado = lower(regexp_replace(btrim(cp.nombre), '\s+', ' ', 'g'))
    )
  );
