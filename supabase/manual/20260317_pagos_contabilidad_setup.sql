-- =============================================================
-- Flecha Extreme
-- Setup manual (idempotente) de Pagos + Contabilidad
-- Fecha: 2026-03-17
-- =============================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- =============================================================
-- 1) Base operativa: parking + pago
-- =============================================================

-- A. Parking: columnas usadas por la app
alter table if exists public.plaza_parking
  add column if not exists disponible boolean not null default true;

alter table if exists public.plaza_parking
  add column if not exists cliente_id uuid references public.cliente(id) on delete set null;

create index if not exists plaza_parking_tipo_disponible_idx
  on public.plaza_parking (tipo, disponible);

create index if not exists plaza_parking_cliente_idx
  on public.plaza_parking (cliente_id);

drop trigger if exists set_plaza_parking_updated_at on public.plaza_parking;
create trigger set_plaza_parking_updated_at
before update on public.plaza_parking
for each row
execute function public.set_updated_at_timestamp();

-- B. Pago: defaults, checks, índices y consistencia de origen
alter table public.pago
  alter column created_at set default timezone('utc', now());

alter table public.pago
  alter column updated_at set default timezone('utc', now());

alter table public.pago
  alter column concepto set default '';

update public.pago
set concepto = ''
where concepto is null;

-- Compatibilidad: si estas columnas son ENUM, ampliar catálogo antes de checks.
do $$
declare
  udt_origen text;
  udt_estado text;
  udt_metodo text;
  v text;
begin
  select udt_name
  into udt_origen
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'pago'
    and column_name = 'origen_tipo';

  if udt_origen is not null
     and exists (
       select 1
       from pg_type t
       join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = 'public'
         and t.typname = udt_origen
         and t.typtype = 'e'
     ) then
    foreach v in array array['pedido', 'reserva', 'parking', 'actividad']
    loop
      execute format('alter type public.%I add value if not exists %L', udt_origen, v);
    end loop;
  end if;

  select udt_name
  into udt_estado
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'pago'
    and column_name = 'estado';

  if udt_estado is not null
     and exists (
       select 1
       from pg_type t
       join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = 'public'
         and t.typname = udt_estado
         and t.typtype = 'e'
     ) then
    foreach v in array array['completado', 'pendiente', 'cancelado']
    loop
      execute format('alter type public.%I add value if not exists %L', udt_estado, v);
    end loop;
  end if;

  select udt_name
  into udt_metodo
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'pago'
    and column_name = 'metodo';

  if udt_metodo is not null
     and exists (
       select 1
       from pg_type t
       join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = 'public'
         and t.typname = udt_metodo
         and t.typtype = 'e'
     ) then
    foreach v in array array[
      'efectivo',
      'tpv',
      'tpv_online',
      'transferencia',
      'bizum_alfonso',
      'bizum_robe',
      'bizum_alba',
      'bizum_maria',
      'bizum_jm',
      'angeles'
    ]
    loop
      execute format('alter type public.%I add value if not exists %L', udt_metodo, v);
    end loop;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pago_origen_tipo_chk') then
    alter table public.pago
      add constraint pago_origen_tipo_chk
      check (origen_tipo::text in ('pedido', 'reserva', 'parking', 'actividad'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pago_estado_chk') then
    alter table public.pago
      add constraint pago_estado_chk
      check (estado::text in ('completado', 'pendiente', 'cancelado'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pago_metodo_chk') then
    alter table public.pago
      add constraint pago_metodo_chk
      check (
        metodo::text in (
          'efectivo',
          'tpv',
          'tpv_online',
          'transferencia',
          'bizum_alfonso',
          'bizum_robe',
          'bizum_alba',
          'bizum_maria',
          'bizum_jm',
          'angeles'
        )
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pago_importe_non_negative_chk') then
    alter table public.pago
      add constraint pago_importe_non_negative_chk
      check (importe >= 0);
  end if;
end $$;

create index if not exists pago_created_at_idx
  on public.pago (created_at desc);

create index if not exists pago_estado_idx
  on public.pago (estado);

create index if not exists pago_origen_idx
  on public.pago (origen_tipo, origen_id);

create index if not exists pago_cliente_idx
  on public.pago (id_cliente);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'pago_unique_pedido_origen_idx'
  ) then
    if exists (
      select 1
      from public.pago
      where origen_tipo = 'pedido'
        and origen_id is not null
      group by origen_id
      having count(*) > 1
    ) then
      raise notice 'No se crea pago_unique_pedido_origen_idx: hay pedidos con más de un pago.';
    else
      create unique index pago_unique_pedido_origen_idx
        on public.pago (origen_id)
        where origen_tipo = 'pedido'
          and origen_id is not null;
    end if;
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'pago_unique_parking_origen_idx'
  ) then
    if exists (
      select 1
      from public.pago
      where origen_tipo = 'parking'
        and origen_id is not null
      group by origen_id
      having count(*) > 1
    ) then
      raise notice 'No se crea pago_unique_parking_origen_idx: hay reservas de parking con más de un pago.';
    else
      create unique index pago_unique_parking_origen_idx
        on public.pago (origen_id)
        where origen_tipo = 'parking'
          and origen_id is not null;
    end if;
  end if;
end $$;

drop trigger if exists set_pago_updated_at on public.pago;
create trigger set_pago_updated_at
before update on public.pago
for each row
execute function public.set_updated_at_timestamp();

create or replace function public.validate_pago_origen()
returns trigger
language plpgsql
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
      select exists(select 1 from public.reserva where id = new.origen_id) into existe;
    when 'parking' then
      select exists(select 1 from public.reserva_parking where id = new.origen_id) into existe;
    when 'actividad' then
      select exists(select 1 from public.actividad where id = new.origen_id) into existe;
    else
      raise exception 'origen_tipo inválido: %', new.origen_tipo::text;
  end case;

  if not existe then
    raise exception 'No existe registro origen (%) con id %', new.origen_tipo::text, new.origen_id;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_pago_origen on public.pago;
create trigger validate_pago_origen
before insert or update of origen_tipo, origen_id
on public.pago
for each row
execute function public.validate_pago_origen();

-- =============================================================
-- 2) Modelo contable (ledger) + sincronización desde pago
-- =============================================================

do $$
begin
  create type public.movimiento_contable_tipo as enum (
    'ingreso',
    'gasto',
    'traspaso_entrada',
    'traspaso_salida'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.movimiento_contable_estado as enum (
    'confirmado',
    'anulado'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.caja_contable as enum (
    'efectivo',
    'santander',
    'bbva',
    'personal'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metodo_contable as enum (
    'efectivo',
    'tarjeta',
    'transferencia',
    'bizum_alfonso',
    'bizum_robe',
    'otro'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tipo_gasto_contable as enum (
    'publicidad_marketing',
    'personal',
    'material',
    'gasolina',
    'gestor',
    'impuestos',
    'alquiler_robe',
    'otros'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.deducible_contable as enum (
    'si',
    'no',
    'preguntar'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.movimiento_contable (
  id uuid primary key default gen_random_uuid(),
  fecha_operacion date not null default current_date,
  tipo public.movimiento_contable_tipo not null,
  estado public.movimiento_contable_estado not null default 'confirmado',
  caja public.caja_contable not null,
  metodo public.metodo_contable,
  concepto text not null,
  comentario text,
  importe_total numeric(12, 2) not null,
  base_imponible numeric(12, 2) not null default 0,
  iva_pct numeric(5, 2) not null default 0,
  iva_importe numeric(12, 2) not null default 0,
  es_devolucion boolean not null default false,
  origen_tipo text,
  origen_id uuid,
  id_pago uuid references public.pago(id) on delete set null,
  id_empleado uuid references public.empleado(id) on delete set null,
  id_movimiento_relacionado uuid references public.movimiento_contable(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.usuario(id) on delete set null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'movimiento_contable_id_pago_key'
  ) then
    alter table public.movimiento_contable
      add constraint movimiento_contable_id_pago_key unique (id_pago);
  end if;
end $$;

create index if not exists movimiento_contable_fecha_idx
  on public.movimiento_contable (fecha_operacion desc);

create index if not exists movimiento_contable_tipo_estado_idx
  on public.movimiento_contable (tipo, estado);

create index if not exists movimiento_contable_caja_idx
  on public.movimiento_contable (caja);

create index if not exists movimiento_contable_origen_idx
  on public.movimiento_contable (origen_tipo, origen_id);

create table if not exists public.movimiento_contable_gasto (
  id_movimiento_contable uuid primary key references public.movimiento_contable(id) on delete cascade,
  tipo_gasto public.tipo_gasto_contable not null,
  deducible public.deducible_contable not null default 'preguntar',
  descripcion text not null,
  proveedor text not null,
  num_factura text,
  fecha_factura date not null,
  comentario text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.documento
  add column if not exists id_movimiento_contable uuid references public.movimiento_contable(id) on delete set null;

alter table if exists public.documento
  add column if not exists categoria text default 'general';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'documento'
  ) then
    execute 'create index if not exists documento_movimiento_contable_idx on public.documento (id_movimiento_contable)';
  end if;
end $$;

drop trigger if exists set_movimiento_contable_updated_at on public.movimiento_contable;
create trigger set_movimiento_contable_updated_at
before update on public.movimiento_contable
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists set_movimiento_contable_gasto_updated_at on public.movimiento_contable_gasto;
create trigger set_movimiento_contable_gasto_updated_at
before update on public.movimiento_contable_gasto
for each row
execute function public.set_updated_at_timestamp();

create or replace function public.contabilidad_metodo_desde_pago(metodo_pago text)
returns public.metodo_contable
language plpgsql
immutable
as $$
begin
  case metodo_pago
    when 'tpv', 'tpv_online' then return 'tarjeta';
    when 'bizum_alfonso' then return 'bizum_alfonso';
    when 'bizum_robe' then return 'bizum_robe';
    when 'transferencia' then return 'transferencia';
    when 'efectivo' then return 'efectivo';
    when 'bizum_alba', 'bizum_maria', 'bizum_jm', 'angeles' then return 'otro';
    else return 'otro';
  end case;
end;
$$;

create or replace function public.contabilidad_caja_desde_metodo(metodo public.metodo_contable)
returns public.caja_contable
language plpgsql
immutable
as $$
begin
  case metodo
    when 'tarjeta' then return 'bbva';
    when 'efectivo' then return 'efectivo';
    else return 'santander';
  end case;
end;
$$;

create or replace function public.contabilidad_iva_pct_desde_metodo(metodo public.metodo_contable)
returns numeric
language plpgsql
immutable
as $$
begin
  case metodo
    when 'tarjeta', 'bizum_alfonso', 'bizum_robe', 'transferencia' then return 21;
    else return 0;
  end case;
end;
$$;

-- RLS deshabilitado por decisión actual del proyecto.
-- Limpieza defensiva por si existen políticas de una versión anterior.
alter table public.movimiento_contable disable row level security;
alter table public.movimiento_contable_gasto disable row level security;

drop policy if exists movimiento_contable_select_admin on public.movimiento_contable;
drop policy if exists movimiento_contable_insert_admin on public.movimiento_contable;
drop policy if exists movimiento_contable_update_admin on public.movimiento_contable;
drop policy if exists movimiento_contable_delete_admin on public.movimiento_contable;

drop policy if exists movimiento_contable_gasto_select_admin on public.movimiento_contable_gasto;
drop policy if exists movimiento_contable_gasto_insert_admin on public.movimiento_contable_gasto;
drop policy if exists movimiento_contable_gasto_update_admin on public.movimiento_contable_gasto;
drop policy if exists movimiento_contable_gasto_delete_admin on public.movimiento_contable_gasto;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'documento'
  ) then
    execute 'alter table public.documento disable row level security';
    execute 'drop policy if exists documento_contabilidad_admin_select on public.documento';
    execute 'drop policy if exists documento_contabilidad_admin_insert on public.documento';
    execute 'drop policy if exists documento_contabilidad_admin_update on public.documento';
    execute 'drop policy if exists documento_contabilidad_admin_delete on public.documento';
  end if;
end $$;

create or replace function public.sync_movimiento_contable_desde_pago(pago_row public.pago)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  metodo_normalizado public.metodo_contable;
  caja_destino public.caja_contable;
  iva_pct_normalizado numeric(5, 2);
  base_calculada numeric(12, 2);
  iva_calculado numeric(12, 2);
  movimiento_id uuid;
begin
  if pago_row.estado is distinct from 'completado' then
    delete from public.movimiento_contable where id_pago = pago_row.id;
    return null;
  end if;

  metodo_normalizado := public.contabilidad_metodo_desde_pago(pago_row.metodo::text);
  caja_destino := public.contabilidad_caja_desde_metodo(metodo_normalizado);
  iva_pct_normalizado := public.contabilidad_iva_pct_desde_metodo(metodo_normalizado);

  if iva_pct_normalizado > 0 then
    base_calculada := round((pago_row.importe / (1 + (iva_pct_normalizado / 100)))::numeric, 2);
    iva_calculado := round((pago_row.importe - base_calculada)::numeric, 2);
  else
    base_calculada := pago_row.importe;
    iva_calculado := 0;
  end if;

  insert into public.movimiento_contable (
    fecha_operacion,
    tipo,
    estado,
    caja,
    metodo,
    concepto,
    comentario,
    importe_total,
    base_imponible,
    iva_pct,
    iva_importe,
    es_devolucion,
    origen_tipo,
    origen_id,
    id_pago
  )
  values (
    coalesce((pago_row.created_at at time zone 'utc')::date, current_date),
    'ingreso',
    'confirmado',
    caja_destino,
    metodo_normalizado,
    coalesce(nullif(trim(pago_row.concepto), ''), 'Pago sincronizado'),
    'Sincronizado automaticamente desde la tabla pago',
    pago_row.importe,
    base_calculada,
    iva_pct_normalizado,
    iva_calculado,
    false,
    coalesce(pago_row.origen_tipo::text, 'pago'),
    pago_row.origen_id,
    pago_row.id
  )
  on conflict (id_pago) do update
    set fecha_operacion = excluded.fecha_operacion,
        tipo = excluded.tipo,
        estado = excluded.estado,
        caja = excluded.caja,
        metodo = excluded.metodo,
        concepto = excluded.concepto,
        comentario = excluded.comentario,
        importe_total = excluded.importe_total,
        base_imponible = excluded.base_imponible,
        iva_pct = excluded.iva_pct,
        iva_importe = excluded.iva_importe,
        es_devolucion = excluded.es_devolucion,
        origen_tipo = excluded.origen_tipo,
        origen_id = excluded.origen_id,
        updated_at = timezone('utc', now())
  returning id into movimiento_id;

  return movimiento_id;
end;
$$;

create or replace function public.handle_sync_movimiento_contable_desde_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.movimiento_contable where id_pago = old.id;
    return old;
  end if;

  perform public.sync_movimiento_contable_desde_pago(new);
  return new;
end;
$$;

drop trigger if exists sync_movimiento_contable_desde_pago on public.pago;
create trigger sync_movimiento_contable_desde_pago
after insert or update of importe, metodo, estado, concepto, origen_tipo, origen_id, created_at
on public.pago
for each row
execute function public.handle_sync_movimiento_contable_desde_pago();

drop trigger if exists sync_movimiento_contable_desde_pago_delete on public.pago;
create trigger sync_movimiento_contable_desde_pago_delete
after delete
on public.pago
for each row
execute function public.handle_sync_movimiento_contable_desde_pago();

create or replace function public.backfill_movimientos_contables_desde_pagos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  pago_row public.pago%rowtype;
  total_sincronizados integer := 0;
begin
  for pago_row in
    select *
    from public.pago
    where estado = 'completado'
    order by created_at asc
  loop
    perform public.sync_movimiento_contable_desde_pago(pago_row);
    total_sincronizados := total_sincronizados + 1;
  end loop;

  return total_sincronizados;
end;
$$;

select public.backfill_movimientos_contables_desde_pagos();

-- =============================================================
-- 3) Verificación post-ejecución
-- =============================================================

-- Pagos completados sin movimiento contable (esperado: 0 filas)
select p.id, p.origen_tipo, p.origen_id, p.importe, p.estado
from public.pago p
left join public.movimiento_contable mc on mc.id_pago = p.id
where p.estado = 'completado'
  and mc.id is null;

-- Resumen por origen de pagos y movimientos
select origen_tipo, count(*) as total_pagos
from public.pago
group by origen_tipo
order by origen_tipo;

select tipo, count(*) as total_movimientos, sum(importe_total) as importe_total
from public.movimiento_contable
group by tipo
order by tipo;

-- Confirmar fix de parking
select id, codigo, tipo, disponible, cliente_id
from public.plaza_parking
limit 20;
