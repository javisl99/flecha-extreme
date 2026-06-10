create table if not exists public.descuento_catalogo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  nombre text not null,
  tipo_valor text not null,
  valor numeric(10,2) not null,
  scope text not null,
  acumulable boolean not null default true,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint descuento_catalogo_codigo_key unique (codigo),
  constraint descuento_catalogo_codigo_check check (length(btrim(codigo)) > 0),
  constraint descuento_catalogo_nombre_check check (length(btrim(nombre)) > 0),
  constraint descuento_catalogo_tipo_valor_check check (tipo_valor in ('importe_fijo', 'porcentaje')),
  constraint descuento_catalogo_scope_check check (scope in ('campamento_inscripcion')),
  constraint descuento_catalogo_valor_check check (valor >= 0)
);

alter table public.descuento_catalogo enable row level security;

create index if not exists ix_descuento_catalogo_scope_activo_orden
  on public.descuento_catalogo (scope, activo, orden, nombre);

drop trigger if exists set_descuento_catalogo_updated_at on public.descuento_catalogo;
create trigger set_descuento_catalogo_updated_at
before update on public.descuento_catalogo
for each row execute function public.fn_set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'descuento_catalogo'
      and policyname = 'descuento_catalogo_select_backoffice'
  ) then
    create policy descuento_catalogo_select_backoffice
      on public.descuento_catalogo
      for select
      using (fn_backoffice_can_read());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'descuento_catalogo'
      and policyname = 'descuento_catalogo_insert_backoffice'
  ) then
    create policy descuento_catalogo_insert_backoffice
      on public.descuento_catalogo
      for insert
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'descuento_catalogo'
      and policyname = 'descuento_catalogo_update_backoffice'
  ) then
    create policy descuento_catalogo_update_backoffice
      on public.descuento_catalogo
      for update
      using (fn_backoffice_can_write())
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'descuento_catalogo'
      and policyname = 'descuento_catalogo_delete_admin'
  ) then
    create policy descuento_catalogo_delete_admin
      on public.descuento_catalogo
      for delete
      using (fn_backoffice_is_admin());
  end if;
end
$$;

create table if not exists public.campamento_participante_descuento (
  id uuid primary key default gen_random_uuid(),
  campamento_participante_id uuid not null references public.campamento_participante(id) on delete cascade,
  descuento_id uuid not null references public.descuento_catalogo(id) on delete restrict,
  importe_aplicado numeric(10,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint campamento_participante_descuento_importe_check check (importe_aplicado >= 0),
  constraint campamento_participante_descuento_unique unique (campamento_participante_id, descuento_id)
);

alter table public.campamento_participante_descuento enable row level security;

create index if not exists ix_campamento_participante_descuento_participante
  on public.campamento_participante_descuento (campamento_participante_id);

create index if not exists ix_campamento_participante_descuento_descuento
  on public.campamento_participante_descuento (descuento_id);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_descuento'
      and policyname = 'campamento_participante_descuento_select_backoffice'
  ) then
    create policy campamento_participante_descuento_select_backoffice
      on public.campamento_participante_descuento
      for select
      using (fn_backoffice_can_read());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_descuento'
      and policyname = 'campamento_participante_descuento_insert_backoffice'
  ) then
    create policy campamento_participante_descuento_insert_backoffice
      on public.campamento_participante_descuento
      for insert
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_descuento'
      and policyname = 'campamento_participante_descuento_update_backoffice'
  ) then
    create policy campamento_participante_descuento_update_backoffice
      on public.campamento_participante_descuento
      for update
      using (fn_backoffice_can_write())
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campamento_participante_descuento'
      and policyname = 'campamento_participante_descuento_delete_admin'
  ) then
    create policy campamento_participante_descuento_delete_admin
      on public.campamento_participante_descuento
      for delete
      using (fn_backoffice_is_admin());
  end if;
end
$$;

create table if not exists public.pago_descuento_snapshot (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pago(id) on delete cascade,
  reserva_id uuid not null references public.reserva_servicio(id) on delete cascade,
  campamento_participante_id uuid null references public.campamento_participante(id) on delete set null,
  descuento_id uuid null references public.descuento_catalogo(id) on delete set null,
  participante_nombre text not null,
  descuento_nombre text not null,
  tipo_valor text not null,
  valor_configurado numeric(10,2) not null,
  importe_aplicado numeric(10,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint pago_descuento_snapshot_tipo_valor_check check (tipo_valor in ('importe_fijo', 'porcentaje')),
  constraint pago_descuento_snapshot_valor_check check (valor_configurado >= 0),
  constraint pago_descuento_snapshot_importe_check check (importe_aplicado >= 0)
);

alter table public.pago_descuento_snapshot enable row level security;

create index if not exists ix_pago_descuento_snapshot_pago
  on public.pago_descuento_snapshot (pago_id, created_at);

create index if not exists ix_pago_descuento_snapshot_reserva
  on public.pago_descuento_snapshot (reserva_id, created_at);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pago_descuento_snapshot'
      and policyname = 'pago_descuento_snapshot_select_backoffice'
  ) then
    create policy pago_descuento_snapshot_select_backoffice
      on public.pago_descuento_snapshot
      for select
      using (fn_backoffice_can_read());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pago_descuento_snapshot'
      and policyname = 'pago_descuento_snapshot_insert_backoffice'
  ) then
    create policy pago_descuento_snapshot_insert_backoffice
      on public.pago_descuento_snapshot
      for insert
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pago_descuento_snapshot'
      and policyname = 'pago_descuento_snapshot_update_backoffice'
  ) then
    create policy pago_descuento_snapshot_update_backoffice
      on public.pago_descuento_snapshot
      for update
      using (fn_backoffice_can_write())
      with check (fn_backoffice_can_write());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'pago_descuento_snapshot'
      and policyname = 'pago_descuento_snapshot_delete_admin'
  ) then
    create policy pago_descuento_snapshot_delete_admin
      on public.pago_descuento_snapshot
      for delete
      using (fn_backoffice_is_admin());
  end if;
end
$$;

insert into public.descuento_catalogo (
  codigo,
  nombre,
  tipo_valor,
  valor,
  scope,
  acumulable,
  activo,
  orden
)
values
  ('HERMANOS', 'Hermanos', 'importe_fijo', 10.00, 'campamento_inscripcion', true, true, 10),
  ('REPETIDOS', 'Repetidos', 'importe_fijo', 10.00, 'campamento_inscripcion', true, true, 20)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  tipo_valor = excluded.tipo_valor,
  valor = excluded.valor,
  scope = excluded.scope,
  acumulable = excluded.acumulable,
  activo = excluded.activo,
  orden = excluded.orden,
  updated_at = timezone('utc', now());
