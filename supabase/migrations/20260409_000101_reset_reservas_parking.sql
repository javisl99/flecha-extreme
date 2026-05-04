create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create schema if not exists backup;

-- Snapshot legacy domain tables (if they exist)
do $$
begin
  if to_regclass('public.actividad') is not null then
    execute 'create table if not exists backup.actividad_20260409 as table public.actividad';
  end if;
  if to_regclass('public.tarifa_actividad') is not null then
    execute 'create table if not exists backup.tarifa_actividad_20260409 as table public.tarifa_actividad';
  end if;
  if to_regclass('public.disponibilidad_actividad') is not null then
    execute 'create table if not exists backup.disponibilidad_actividad_20260409 as table public.disponibilidad_actividad';
  end if;
  if to_regclass('public.reserva') is not null then
    execute 'create table if not exists backup.reserva_20260409 as table public.reserva';
  end if;
  if to_regclass('public.plaza_parking') is not null then
    execute 'create table if not exists backup.plaza_parking_20260409 as table public.plaza_parking';
  end if;
  if to_regclass('public.tarifa_parking') is not null then
    execute 'create table if not exists backup.tarifa_parking_20260409 as table public.tarifa_parking';
  end if;
  if to_regclass('public.reserva_parking') is not null then
    execute 'create table if not exists backup.reserva_parking_20260409 as table public.reserva_parking';
  end if;
end;
$$;

-- Drop legacy activity/booking/parking domain
drop table if exists public.reserva_parking cascade;
drop table if exists public.tarifa_parking cascade;
drop table if exists public.plaza_parking cascade;
drop table if exists public.disponibilidad_actividad cascade;
drop table if exists public.tarifa_actividad cascade;
drop table if exists public.reserva cascade;
drop table if exists public.actividad cascade;

-- Enums
do $$
begin
  create type public.servicio_categoria as enum ('actividad', 'alquiler', 'ruta', 'curso', 'campamento', 'otro');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.servicio_modo_precio as enum ('por_persona', 'fijo');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.servicio_modo_agenda as enum ('libre', 'horario_recurrente', 'sesion_manual');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.reserva_canal as enum ('backoffice');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.reserva_estado as enum ('pendiente', 'confirmada', 'cancelada', 'completada');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.reserva_item_estado as enum ('pendiente', 'confirmada', 'cancelada', 'completada');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.parking_tipo as enum ('tabla', 'kayak', 'embarcacion');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.parking_periodo as enum ('quincena', 'mes');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.parking_reserva_estado as enum ('pendiente', 'activa', 'cancelada', 'finalizada');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.pago_entidad_tipo as enum ('reserva_servicio', 'parking_reserva', 'pedido');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.fn_backoffice_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select u.id
  from public.usuario u
  where u.email = auth.email()
    and u.activo = true
  limit 1;
$$;

create or replace function public.fn_backoffice_can_read()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select public.fn_backoffice_user_id() is not null;
$$;

create or replace function public.fn_backoffice_can_write()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.usuario u
    where u.id = public.fn_backoffice_user_id()
      and u.rol in ('admin', 'fl-admin', 'fl-empleado')
  );
$$;

create or replace function public.fn_backoffice_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select exists (
    select 1
    from public.usuario u
    where u.id = public.fn_backoffice_user_id()
      and u.rol in ('admin', 'fl-admin')
  );
$$;

create table public.servicio (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  codigo text not null,
  nombre text not null,
  categoria public.servicio_categoria not null,
  modo_precio public.servicio_modo_precio not null default 'fijo',
  modo_agenda public.servicio_modo_agenda not null default 'libre',
  requiere_sesion boolean not null default false,
  reservable boolean not null default true,
  activo boolean not null default true,
  capacidad_max integer,
  duracion_minima_min integer,
  duracion_maxima_min integer,
  intervalo_reserva_min integer,
  deposito_permitido boolean not null default false,
  deposito_obligatorio boolean not null default false,
  deposito_default numeric(10,2) not null default 0,
  notas text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.usuario(id) on delete set null,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_empresa_codigo_key unique (empresa_id, codigo),
  constraint servicio_capacidad_chk check (capacidad_max is null or capacidad_max > 0),
  constraint servicio_duracion_min_chk check (duracion_minima_min is null or duracion_minima_min > 0),
  constraint servicio_duracion_max_chk check (duracion_maxima_min is null or duracion_maxima_min > 0),
  constraint servicio_duracion_rango_chk check (
    duracion_minima_min is null or duracion_maxima_min is null or duracion_maxima_min >= duracion_minima_min
  ),
  constraint servicio_intervalo_chk check (intervalo_reserva_min is null or intervalo_reserva_min > 0),
  constraint servicio_deposito_default_chk check (deposito_default >= 0),
  constraint servicio_deposito_logic_chk check (deposito_obligatorio = false or deposito_permitido = true)
);

create table public.servicio_tarifa (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicio(id) on delete cascade,
  codigo text not null,
  nombre_tarifa text not null,
  duracion_min integer,
  precio numeric(10,2) not null,
  moneda char(3) not null default 'EUR',
  deposito_requerido numeric(10,2) not null default 0,
  incluye_deposito_en_precio boolean not null default true,
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  activo boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_tarifa_unique_key unique (servicio_id, codigo, vigencia_desde),
  constraint servicio_tarifa_duracion_chk check (duracion_min is null or duracion_min > 0),
  constraint servicio_tarifa_precio_chk check (precio >= 0 and deposito_requerido >= 0),
  constraint servicio_tarifa_vigencia_chk check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde)
);

create table public.servicio_tarifa_especial (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicio(id) on delete cascade,
  tarifa_id uuid not null references public.servicio_tarifa(id) on delete cascade,
  codigo text not null,
  etiqueta text not null,
  precio_override numeric(10,2),
  descuento_pct numeric(5,2),
  condicion jsonb not null default '{}'::jsonb,
  prioridad integer not null default 100,
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_tarifa_especial_unique_key unique (servicio_id, codigo),
  constraint servicio_tarifa_especial_precio_chk check (precio_override is null or precio_override >= 0),
  constraint servicio_tarifa_especial_descuento_chk check (descuento_pct is null or (descuento_pct >= 0 and descuento_pct <= 100)),
  constraint servicio_tarifa_especial_exactly_one_chk check ((precio_override is not null) <> (descuento_pct is not null)),
  constraint servicio_tarifa_especial_vigencia_chk check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde)
);

create table public.servicio_horario_regla (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicio(id) on delete cascade,
  dia_semana smallint not null,
  hora_inicio time not null,
  hora_fin time not null,
  activo_desde date,
  activo_hasta date,
  capacidad_override integer,
  intervalo_min integer,
  activo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_horario_dia_chk check (dia_semana between 1 and 7),
  constraint servicio_horario_hora_chk check (hora_fin > hora_inicio),
  constraint servicio_horario_capacidad_chk check (capacidad_override is null or capacidad_override > 0),
  constraint servicio_horario_intervalo_chk check (intervalo_min is null or intervalo_min > 0),
  constraint servicio_horario_vigencia_chk check (activo_hasta is null or activo_desde is null or activo_hasta >= activo_desde)
);

create table public.servicio_sesion (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicio(id) on delete cascade,
  codigo text,
  titulo text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  capacidad_min integer,
  capacidad_max integer,
  precio_override numeric(10,2),
  deposito_override numeric(10,2),
  estado text not null default 'programada',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.usuario(id) on delete set null,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_sesion_codigo_unique unique (servicio_id, codigo),
  constraint servicio_sesion_rango_chk check (fin > inicio),
  constraint servicio_sesion_capacidad_min_chk check (capacidad_min is null or capacidad_min > 0),
  constraint servicio_sesion_capacidad_max_chk check (capacidad_max is null or capacidad_max > 0),
  constraint servicio_sesion_capacidad_rango_chk check (capacidad_min is null or capacidad_max is null or capacidad_max >= capacidad_min),
  constraint servicio_sesion_precio_chk check (precio_override is null or precio_override >= 0),
  constraint servicio_sesion_deposito_chk check (deposito_override is null or deposito_override >= 0),
  constraint servicio_sesion_estado_chk check (estado in ('programada', 'abierta', 'cerrada', 'cancelada'))
);

create table public.inventario_pool (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  codigo text not null,
  nombre text not null,
  unidad text not null default 'unidad',
  cantidad_total integer,
  activo boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint inventario_pool_empresa_codigo_key unique (empresa_id, codigo),
  constraint inventario_pool_cantidad_chk check (cantidad_total is null or cantidad_total > 0)
);

create table public.servicio_consumo_pool (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicio(id) on delete cascade,
  pool_id uuid not null references public.inventario_pool(id) on delete cascade,
  consumo_por_unidad numeric(10,3) not null default 1,
  obligatorio boolean not null default true,
  activo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint servicio_consumo_pool_unique_key unique (servicio_id, pool_id),
  constraint servicio_consumo_pool_consumo_chk check (consumo_por_unidad > 0)
);

create table public.reserva_servicio (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  cliente_id uuid references public.cliente(id) on delete set null,
  canal public.reserva_canal not null default 'backoffice',
  estado public.reserva_estado not null default 'pendiente',
  observaciones text,
  total_bruto numeric(10,2) not null default 0,
  total_descuento numeric(10,2) not null default 0,
  total_neto numeric(10,2) not null default 0,
  deposito_total_requerido numeric(10,2) not null default 0,
  deposito_total_cobrado numeric(10,2) not null default 0,
  ticket_url text,
  ticket_url_reserva text,
  created_by uuid references public.usuario(id) on delete set null,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reserva_servicio_numero_key unique (numero),
  constraint reserva_servicio_totales_chk check (
    total_bruto >= 0 and total_descuento >= 0 and total_neto >= 0 and deposito_total_requerido >= 0 and deposito_total_cobrado >= 0
  )
);

create table public.reserva_servicio_item (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reserva_servicio(id) on delete cascade,
  servicio_id uuid not null references public.servicio(id) on delete restrict,
  sesion_id uuid references public.servicio_sesion(id) on delete set null,
  tarifa_id uuid references public.servicio_tarifa(id) on delete set null,
  tarifa_especial_id uuid references public.servicio_tarifa_especial(id) on delete set null,
  inicio timestamptz not null,
  fin timestamptz not null,
  rango tstzrange generated always as (tstzrange(inicio, fin, '[)')) stored,
  cantidad integer not null default 1,
  precio_unitario numeric(10,2) not null default 0,
  descuento_unitario numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  deposito_requerido numeric(10,2) not null default 0,
  deposito_cobrado numeric(10,2) not null default 0,
  estado public.reserva_item_estado not null default 'pendiente',
  notas text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reserva_servicio_item_rango_chk check (fin > inicio),
  constraint reserva_servicio_item_cantidad_chk check (cantidad > 0),
  constraint reserva_servicio_item_importes_chk check (
    precio_unitario >= 0 and descuento_unitario >= 0 and subtotal >= 0 and deposito_requerido >= 0 and deposito_cobrado >= 0
  )
);

create table public.parking_plaza (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  codigo text not null,
  tipo public.parking_tipo not null,
  activo boolean not null default true,
  notas text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parking_plaza_empresa_codigo_key unique (empresa_id, codigo)
);

create table public.parking_tarifa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  tipo public.parking_tipo not null,
  periodo public.parking_periodo not null,
  precio numeric(10,2) not null,
  moneda char(3) not null default 'EUR',
  vigencia_desde date not null default current_date,
  vigencia_hasta date,
  activo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parking_tarifa_unique_key unique (empresa_id, tipo, periodo, vigencia_desde),
  constraint parking_tarifa_precio_chk check (precio >= 0),
  constraint parking_tarifa_vigencia_chk check (vigencia_hasta is null or vigencia_hasta >= vigencia_desde)
);

create table public.parking_reserva (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity,
  empresa_id uuid not null references public.empresa(id) on delete restrict,
  plaza_id uuid not null references public.parking_plaza(id) on delete restrict,
  cliente_id uuid references public.cliente(id) on delete set null,
  tarifa_id uuid not null references public.parking_tarifa(id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date not null,
  rango daterange generated always as (daterange(fecha_inicio, fecha_fin, '[)')) stored,
  estado public.parking_reserva_estado not null default 'pendiente',
  importe_total numeric(10,2) not null default 0,
  deposito_requerido numeric(10,2) not null default 0,
  deposito_cobrado numeric(10,2) not null default 0,
  notas text,
  created_by uuid references public.usuario(id) on delete set null,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parking_reserva_numero_key unique (numero),
  constraint parking_reserva_fechas_chk check (fecha_fin > fecha_inicio),
  constraint parking_reserva_importes_chk check (importe_total >= 0 and deposito_requerido >= 0 and deposito_cobrado >= 0)
);

create table public.pago_aplicacion (
  id uuid primary key default gen_random_uuid(),
  pago_id uuid not null references public.pago(id) on delete cascade,
  entidad_tipo public.pago_entidad_tipo not null,
  entidad_id uuid not null,
  importe_aplicado numeric(10,2) not null,
  created_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint pago_aplicacion_unique_key unique (pago_id, entidad_tipo, entidad_id),
  constraint pago_aplicacion_importe_chk check (importe_aplicado > 0)
);

-- Parking anti-overlap
alter table public.parking_reserva
  add constraint parking_reserva_plaza_solape_excl
  exclude using gist (
    plaza_id with =,
    rango with &&
  )
  where (estado in ('pendiente', 'activa'));

-- Indexes
create index servicio_empresa_activo_idx on public.servicio (empresa_id, activo);
create index servicio_categoria_activo_idx on public.servicio (categoria, activo);
create index servicio_tarifa_servicio_activo_idx on public.servicio_tarifa (servicio_id, activo, vigencia_desde desc);
create index servicio_horario_regla_lookup_idx on public.servicio_horario_regla (servicio_id, dia_semana, activo);
create index servicio_sesion_servicio_inicio_idx on public.servicio_sesion (servicio_id, inicio);
create index servicio_sesion_estado_inicio_idx on public.servicio_sesion (estado, inicio);
create index inventario_pool_empresa_codigo_idx on public.inventario_pool (empresa_id, codigo);
create index servicio_consumo_pool_pool_idx on public.servicio_consumo_pool (pool_id, activo);
create index reserva_servicio_empresa_created_idx on public.reserva_servicio (empresa_id, created_at desc);
create index reserva_servicio_estado_created_idx on public.reserva_servicio (estado, created_at desc);
create index reserva_servicio_item_reserva_idx on public.reserva_servicio_item (reserva_id);
create index reserva_servicio_item_servicio_inicio_idx on public.reserva_servicio_item (servicio_id, inicio);
create index reserva_servicio_item_rango_gist_idx on public.reserva_servicio_item using gist (rango);
create index parking_plaza_empresa_tipo_activo_idx on public.parking_plaza (empresa_id, tipo, activo);
create index parking_tarifa_lookup_idx on public.parking_tarifa (empresa_id, tipo, periodo, vigencia_desde desc);
create index parking_reserva_plaza_estado_idx on public.parking_reserva (plaza_id, estado);
create index parking_reserva_cliente_estado_idx on public.parking_reserva (cliente_id, estado);
create index parking_reserva_rango_gist_idx on public.parking_reserva using gist (rango);
create index pago_aplicacion_entidad_idx on public.pago_aplicacion (entidad_tipo, entidad_id);

-- updated_at triggers
create trigger set_servicio_updated_at
before update on public.servicio
for each row execute function public.fn_set_updated_at();

create trigger set_servicio_tarifa_updated_at
before update on public.servicio_tarifa
for each row execute function public.fn_set_updated_at();

create trigger set_servicio_tarifa_especial_updated_at
before update on public.servicio_tarifa_especial
for each row execute function public.fn_set_updated_at();

create trigger set_servicio_horario_regla_updated_at
before update on public.servicio_horario_regla
for each row execute function public.fn_set_updated_at();

create trigger set_servicio_sesion_updated_at
before update on public.servicio_sesion
for each row execute function public.fn_set_updated_at();

create trigger set_inventario_pool_updated_at
before update on public.inventario_pool
for each row execute function public.fn_set_updated_at();

create trigger set_servicio_consumo_pool_updated_at
before update on public.servicio_consumo_pool
for each row execute function public.fn_set_updated_at();

create trigger set_reserva_servicio_updated_at
before update on public.reserva_servicio
for each row execute function public.fn_set_updated_at();

create trigger set_reserva_servicio_item_updated_at
before update on public.reserva_servicio_item
for each row execute function public.fn_set_updated_at();

create trigger set_parking_plaza_updated_at
before update on public.parking_plaza
for each row execute function public.fn_set_updated_at();

create trigger set_parking_tarifa_updated_at
before update on public.parking_tarifa
for each row execute function public.fn_set_updated_at();

create trigger set_parking_reserva_updated_at
before update on public.parking_reserva
for each row execute function public.fn_set_updated_at();

-- Validation / recalculation functions
create or replace function public.fn_recalcular_totales_reserva_servicio()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_reserva_id uuid;
begin
  v_reserva_id := coalesce(new.reserva_id, old.reserva_id);

  update public.reserva_servicio r
  set total_bruto = coalesce(s.total_bruto, 0),
      total_descuento = coalesce(s.total_descuento, 0),
      total_neto = coalesce(s.total_neto, 0),
      deposito_total_requerido = coalesce(s.deposito_req, 0),
      deposito_total_cobrado = coalesce(s.deposito_cob, 0),
      updated_at = timezone('utc', now())
  from (
    select reserva_id,
           sum((precio_unitario * cantidad)) filter (where estado <> 'cancelada') as total_bruto,
           sum((descuento_unitario * cantidad)) filter (where estado <> 'cancelada') as total_descuento,
           sum(subtotal) filter (where estado <> 'cancelada') as total_neto,
           sum(deposito_requerido) filter (where estado <> 'cancelada') as deposito_req,
           sum(deposito_cobrado) filter (where estado <> 'cancelada') as deposito_cob
    from public.reserva_servicio_item
    where reserva_id = v_reserva_id
    group by reserva_id
  ) s
  where r.id = v_reserva_id;

  if not found then
    update public.reserva_servicio
    set total_bruto = 0,
        total_descuento = 0,
        total_neto = 0,
        deposito_total_requerido = 0,
        deposito_total_cobrado = 0,
        updated_at = timezone('utc', now())
    where id = v_reserva_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.fn_validar_capacidad_item_servicio()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_capacidad integer;
  v_ocupadas integer;
  v_rango tstzrange;
begin
  if new.estado not in ('pendiente', 'confirmada') then
    return new;
  end if;

  if new.fin <= new.inicio then
    raise exception 'El rango de la reserva es inválido';
  end if;

  v_rango := tstzrange(new.inicio, new.fin, '[)');

  select coalesce(ss.capacidad_max, s.capacidad_max)
  into v_capacidad
  from public.servicio s
  left join public.servicio_sesion ss on ss.id = new.sesion_id
  where s.id = new.servicio_id;

  if v_capacidad is null then
    return new;
  end if;

  select coalesce(sum(i.cantidad), 0)
  into v_ocupadas
  from public.reserva_servicio_item i
  where i.estado in ('pendiente', 'confirmada')
    and i.rango && v_rango
    and (tg_op = 'INSERT' or i.id <> new.id)
    and (
      (new.sesion_id is not null and i.sesion_id = new.sesion_id) or
      (new.sesion_id is null and i.servicio_id = new.servicio_id and i.sesion_id is null)
    );

  if v_ocupadas + new.cantidad > v_capacidad then
    raise exception 'Capacidad excedida para el servicio/sesión. Disponible: %, solicitado: %',
      greatest(v_capacidad - v_ocupadas, 0), new.cantidad;
  end if;

  return new;
end;
$$;

create or replace function public.fn_validar_stock_compartido_item_servicio()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_pool record;
  v_usado numeric;
  v_requerido numeric;
  v_rango tstzrange;
begin
  if new.estado not in ('pendiente', 'confirmada') then
    return new;
  end if;

  v_rango := tstzrange(new.inicio, new.fin, '[)');

  for v_pool in
    select scp.pool_id,
           scp.consumo_por_unidad,
           ip.cantidad_total,
           ip.codigo
    from public.servicio_consumo_pool scp
    join public.inventario_pool ip on ip.id = scp.pool_id
    where scp.servicio_id = new.servicio_id
      and scp.activo = true
      and scp.obligatorio = true
      and ip.activo = true
  loop
    if v_pool.cantidad_total is null or v_pool.cantidad_total <= 0 then
      raise exception 'Pool de inventario % sin cantidad definida. No se puede reservar.', v_pool.codigo;
    end if;

    v_requerido := new.cantidad * v_pool.consumo_por_unidad;

    select coalesce(sum(ri.cantidad * scp2.consumo_por_unidad), 0)
    into v_usado
    from public.reserva_servicio_item ri
    join public.servicio_consumo_pool scp2
      on scp2.servicio_id = ri.servicio_id
     and scp2.pool_id = v_pool.pool_id
     and scp2.activo = true
    where ri.estado in ('pendiente', 'confirmada')
      and ri.rango && v_rango
      and (tg_op = 'INSERT' or ri.id <> new.id);

    if v_usado + v_requerido > v_pool.cantidad_total then
      raise exception 'Sin stock en pool %. Disponible: %, requerido: %',
        v_pool.codigo,
        greatest(v_pool.cantidad_total - v_usado, 0),
        v_requerido;
    end if;
  end loop;

  return new;
end;
$$;

create or replace function public.fn_set_importe_parking_reserva()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_precio numeric(10,2);
begin
  select precio
  into v_precio
  from public.parking_tarifa
  where id = new.tarifa_id;

  if v_precio is null then
    raise exception 'Tarifa de parking no encontrada';
  end if;

  new.importe_total := v_precio;
  return new;
end;
$$;

create or replace function public.fn_validar_pago_aplicacion()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_importe_pago numeric(10,2);
  v_total_aplicado numeric(10,2);
  v_exists boolean;
begin
  select p.importe into v_importe_pago
  from public.pago p
  where p.id = new.pago_id;

  if v_importe_pago is null then
    raise exception 'Pago no encontrado: %', new.pago_id;
  end if;

  case new.entidad_tipo
    when 'reserva_servicio' then
      select exists(select 1 from public.reserva_servicio where id = new.entidad_id) into v_exists;
    when 'parking_reserva' then
      select exists(select 1 from public.parking_reserva where id = new.entidad_id) into v_exists;
    when 'pedido' then
      select exists(select 1 from public.pedido where id = new.entidad_id) into v_exists;
    else
      v_exists := false;
  end case;

  if not v_exists then
    raise exception 'Entidad % (%) no existe', new.entidad_tipo, new.entidad_id;
  end if;

  select coalesce(sum(pa.importe_aplicado), 0)
  into v_total_aplicado
  from public.pago_aplicacion pa
  where pa.pago_id = new.pago_id
    and (tg_op = 'INSERT' or pa.id <> new.id);

  if v_total_aplicado + new.importe_aplicado > v_importe_pago then
    raise exception 'Importe aplicado excede el importe total del pago';
  end if;

  return new;
end;
$$;

create trigger trg_recalcular_totales_reserva_servicio
after insert or update or delete on public.reserva_servicio_item
for each row execute function public.fn_recalcular_totales_reserva_servicio();

create trigger trg_validar_capacidad_item_servicio
before insert or update on public.reserva_servicio_item
for each row execute function public.fn_validar_capacidad_item_servicio();

create trigger trg_validar_stock_item_servicio
before insert or update on public.reserva_servicio_item
for each row execute function public.fn_validar_stock_compartido_item_servicio();

create trigger trg_set_importe_parking_reserva
before insert or update of tarifa_id on public.parking_reserva
for each row execute function public.fn_set_importe_parking_reserva();

create trigger trg_validar_pago_aplicacion
before insert or update on public.pago_aplicacion
for each row execute function public.fn_validar_pago_aplicacion();

-- Refresh pago origin validation to point new entities
create or replace function public.validate_pago_origen()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  existe boolean;
begin
  if new.origen_tipo is null then
    raise exception 'pago.origen_tipo no puede ser null';
  end if;

  if new.origen_id is null then
    raise exception 'pago.origen_id no puede ser null';
  end if;

  case new.origen_tipo::text
    when 'pedido' then
      select exists(select 1 from public.pedido where id = new.origen_id) into existe;
    when 'reserva' then
      select exists(select 1 from public.reserva_servicio where id = new.origen_id) into existe;
    when 'parking' then
      select exists(select 1 from public.parking_reserva where id = new.origen_id) into existe;
    when 'actividad' then
      select exists(select 1 from public.servicio where id = new.origen_id) into existe;
    else
      raise exception 'origen_tipo inválido: %', new.origen_tipo::text;
  end case;

  if not existe then
    raise exception 'No existe registro origen (%) con id %', new.origen_tipo::text, new.origen_id;
  end if;

  return new;
end;
$$;

-- RPCs
create or replace function public.rpc_crear_reserva_servicio(
  p_empresa_id uuid,
  p_cliente_id uuid,
  p_observaciones text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_reserva_id uuid;
  v_item jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Debe enviar al menos un item de reserva';
  end if;

  insert into public.reserva_servicio (
    empresa_id,
    cliente_id,
    canal,
    estado,
    observaciones,
    created_by,
    updated_by
  )
  values (
    p_empresa_id,
    p_cliente_id,
    'backoffice',
    'pendiente',
    p_observaciones,
    public.fn_backoffice_user_id(),
    public.fn_backoffice_user_id()
  )
  returning id into v_reserva_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.reserva_servicio_item (
      reserva_id,
      servicio_id,
      sesion_id,
      tarifa_id,
      tarifa_especial_id,
      inicio,
      fin,
      cantidad,
      precio_unitario,
      descuento_unitario,
      subtotal,
      deposito_requerido,
      deposito_cobrado,
      estado,
      notas
    )
    values (
      v_reserva_id,
      (v_item->>'servicio_id')::uuid,
      nullif(v_item->>'sesion_id', '')::uuid,
      nullif(v_item->>'tarifa_id', '')::uuid,
      nullif(v_item->>'tarifa_especial_id', '')::uuid,
      (v_item->>'inicio')::timestamptz,
      (v_item->>'fin')::timestamptz,
      coalesce((v_item->>'cantidad')::integer, 1),
      coalesce((v_item->>'precio_unitario')::numeric, 0),
      coalesce((v_item->>'descuento_unitario')::numeric, 0),
      coalesce((v_item->>'subtotal')::numeric, 0),
      coalesce((v_item->>'deposito_requerido')::numeric, 0),
      coalesce((v_item->>'deposito_cobrado')::numeric, 0),
      coalesce((v_item->>'estado')::public.reserva_item_estado, 'pendiente'::public.reserva_item_estado),
      nullif(v_item->>'notas', '')
    );
  end loop;

  return v_reserva_id;
end;
$$;

create or replace function public.rpc_actualizar_estado_reserva_servicio(
  p_reserva_id uuid,
  p_estado public.reserva_estado,
  p_observaciones text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.reserva_servicio
  set estado = p_estado,
      observaciones = coalesce(p_observaciones, observaciones),
      updated_by = public.fn_backoffice_user_id(),
      updated_at = timezone('utc', now())
  where id = p_reserva_id;

  if not found then
    return false;
  end if;

  return true;
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
  select periodo
  into v_periodo
  from public.parking_tarifa
  where id = p_tarifa_id;

  if v_periodo is null then
    raise exception 'Tarifa de parking no encontrada';
  end if;

  if v_periodo = 'quincena' then
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

create or replace function public.rpc_aplicar_pago_a_entidad(
  p_pago_id uuid,
  p_entidad_tipo public.pago_entidad_tipo,
  p_entidad_id uuid,
  p_importe numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_id uuid;
begin
  insert into public.pago_aplicacion (
    pago_id,
    entidad_tipo,
    entidad_id,
    importe_aplicado,
    created_by
  )
  values (
    p_pago_id,
    p_entidad_tipo,
    p_entidad_id,
    p_importe,
    public.fn_backoffice_user_id()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rpc_consultar_disponibilidad_servicio(
  p_servicio_id uuid,
  p_inicio timestamptz,
  p_fin timestamptz,
  p_cantidad integer default 1
)
returns table (
  disponible boolean,
  stock_total integer,
  reservadas integer,
  stock_disponible integer,
  motivo text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_rango tstzrange;
  v_capacidad integer;
  v_usadas integer;
  v_has_pool boolean;
  v_pool record;
  v_usado_pool numeric;
  v_disponible_pool numeric;
  v_min_disponible numeric;
  v_pool_total_unidades numeric;
  v_pool_reservadas_unidades numeric;
  v_pool_stock_total numeric;
  v_pool_reservadas numeric;
begin
  if p_inicio is null or p_fin is null or p_fin <= p_inicio then
    return query select false, 0, 0, 0, 'rango_invalido';
    return;
  end if;

  if p_cantidad is null or p_cantidad <= 0 then
    return query select false, 0, 0, 0, 'cantidad_invalida';
    return;
  end if;

  v_rango := tstzrange(p_inicio, p_fin, '[)');

  if not exists (select 1 from public.servicio s where s.id = p_servicio_id and s.activo = true and s.reservable = true) then
    return query select false, 0, 0, 0, 'servicio_no_reservable';
    return;
  end if;

  select exists(
    select 1
    from public.servicio_consumo_pool scp
    where scp.servicio_id = p_servicio_id
      and scp.activo = true
      and scp.obligatorio = true
  ) into v_has_pool;

  if v_has_pool then
    v_min_disponible := null;
    v_pool_stock_total := null;
    v_pool_reservadas := null;

    for v_pool in
      select scp.pool_id,
             scp.consumo_por_unidad,
             ip.cantidad_total,
             ip.codigo
      from public.servicio_consumo_pool scp
      join public.inventario_pool ip on ip.id = scp.pool_id
      where scp.servicio_id = p_servicio_id
        and scp.activo = true
        and scp.obligatorio = true
        and ip.activo = true
    loop
      if v_pool.cantidad_total is null or v_pool.cantidad_total <= 0 then
        return query select false, 0, 0, 0, 'pool_sin_stock_' || v_pool.codigo;
        return;
      end if;

      select coalesce(sum(ri.cantidad * scp2.consumo_por_unidad), 0)
      into v_usado_pool
      from public.reserva_servicio_item ri
      join public.servicio_consumo_pool scp2
        on scp2.servicio_id = ri.servicio_id
       and scp2.pool_id = v_pool.pool_id
       and scp2.activo = true
      where ri.estado in ('pendiente', 'confirmada')
        and ri.rango && v_rango;

      v_pool_total_unidades := floor(v_pool.cantidad_total / v_pool.consumo_por_unidad);
      v_disponible_pool := floor((v_pool.cantidad_total - v_usado_pool) / v_pool.consumo_por_unidad);
      v_pool_reservadas_unidades := greatest(v_pool_total_unidades - v_disponible_pool, 0);

      if v_min_disponible is null or v_disponible_pool < v_min_disponible then
        v_min_disponible := v_disponible_pool;
        v_pool_stock_total := v_pool_total_unidades;
        v_pool_reservadas := v_pool_reservadas_unidades;
      end if;
    end loop;

    return query select
      coalesce(v_min_disponible, 0) >= p_cantidad,
      coalesce(v_pool_stock_total, 0)::integer,
      coalesce(v_pool_reservadas, 0)::integer,
      greatest(coalesce(v_min_disponible, 0)::integer, 0),
      case when coalesce(v_min_disponible, 0) >= p_cantidad then 'ok' else 'stock_insuficiente' end;
    return;
  end if;

  select capacidad_max
  into v_capacidad
  from public.servicio
  where id = p_servicio_id;

  if v_capacidad is null then
    return query select true, 0, 0, 999999, 'sin_limite';
    return;
  end if;

  select coalesce(sum(ri.cantidad), 0)
  into v_usadas
  from public.reserva_servicio_item ri
  where ri.servicio_id = p_servicio_id
    and ri.estado in ('pendiente', 'confirmada')
    and ri.rango && v_rango;

  return query select
    (v_capacidad - v_usadas) >= p_cantidad,
    v_capacidad,
    v_usadas,
    greatest(v_capacidad - v_usadas, 0),
    case when (v_capacidad - v_usadas) >= p_cantidad then 'ok' else 'capacidad_insuficiente' end;
end;
$$;

-- RLS
alter table public.servicio enable row level security;
alter table public.servicio_tarifa enable row level security;
alter table public.servicio_tarifa_especial enable row level security;
alter table public.servicio_horario_regla enable row level security;
alter table public.servicio_sesion enable row level security;
alter table public.inventario_pool enable row level security;
alter table public.servicio_consumo_pool enable row level security;
alter table public.reserva_servicio enable row level security;
alter table public.reserva_servicio_item enable row level security;
alter table public.parking_plaza enable row level security;
alter table public.parking_tarifa enable row level security;
alter table public.parking_reserva enable row level security;
alter table public.pago_aplicacion enable row level security;

create policy servicio_select_backoffice on public.servicio
for select using (public.fn_backoffice_can_read());
create policy servicio_write_admin on public.servicio
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy servicio_tarifa_select_backoffice on public.servicio_tarifa
for select using (public.fn_backoffice_can_read());
create policy servicio_tarifa_write_admin on public.servicio_tarifa
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy servicio_tarifa_especial_select_backoffice on public.servicio_tarifa_especial
for select using (public.fn_backoffice_can_read());
create policy servicio_tarifa_especial_write_admin on public.servicio_tarifa_especial
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy servicio_horario_select_backoffice on public.servicio_horario_regla
for select using (public.fn_backoffice_can_read());
create policy servicio_horario_write_admin on public.servicio_horario_regla
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy servicio_sesion_select_backoffice on public.servicio_sesion
for select using (public.fn_backoffice_can_read());
create policy servicio_sesion_write_admin on public.servicio_sesion
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy inventario_pool_select_backoffice on public.inventario_pool
for select using (public.fn_backoffice_can_read());
create policy inventario_pool_write_admin on public.inventario_pool
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy servicio_consumo_pool_select_backoffice on public.servicio_consumo_pool
for select using (public.fn_backoffice_can_read());
create policy servicio_consumo_pool_write_admin on public.servicio_consumo_pool
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy reserva_servicio_select_backoffice on public.reserva_servicio
for select using (public.fn_backoffice_can_read());
create policy reserva_servicio_insert_backoffice on public.reserva_servicio
for insert with check (public.fn_backoffice_can_write());
create policy reserva_servicio_update_backoffice on public.reserva_servicio
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
create policy reserva_servicio_delete_admin on public.reserva_servicio
for delete using (public.fn_backoffice_is_admin());

create policy reserva_item_select_backoffice on public.reserva_servicio_item
for select using (public.fn_backoffice_can_read());
create policy reserva_item_insert_backoffice on public.reserva_servicio_item
for insert with check (public.fn_backoffice_can_write());
create policy reserva_item_update_backoffice on public.reserva_servicio_item
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
create policy reserva_item_delete_admin on public.reserva_servicio_item
for delete using (public.fn_backoffice_is_admin());

create policy parking_plaza_select_backoffice on public.parking_plaza
for select using (public.fn_backoffice_can_read());
create policy parking_plaza_write_admin on public.parking_plaza
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy parking_tarifa_select_backoffice on public.parking_tarifa
for select using (public.fn_backoffice_can_read());
create policy parking_tarifa_write_admin on public.parking_tarifa
for all using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());

create policy parking_reserva_select_backoffice on public.parking_reserva
for select using (public.fn_backoffice_can_read());
create policy parking_reserva_insert_backoffice on public.parking_reserva
for insert with check (public.fn_backoffice_can_write());
create policy parking_reserva_update_backoffice on public.parking_reserva
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
create policy parking_reserva_delete_admin on public.parking_reserva
for delete using (public.fn_backoffice_is_admin());

create policy pago_aplicacion_select_backoffice on public.pago_aplicacion
for select using (public.fn_backoffice_can_read());
create policy pago_aplicacion_insert_backoffice on public.pago_aplicacion
for insert with check (public.fn_backoffice_can_write());
create policy pago_aplicacion_update_backoffice on public.pago_aplicacion
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
create policy pago_aplicacion_delete_admin on public.pago_aplicacion
for delete using (public.fn_backoffice_is_admin());
