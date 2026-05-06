-- Rediseño contable configurable:
-- - Catálogos de bancos, cuentas y métodos de pago
-- - Backfill desde columnas legacy
-- - Bandeja de Bizum pendiente y EFE diario
-- - RLS en tablas contables y compartidas tocadas por el módulo

create extension if not exists pgcrypto;

do $$
begin
  create type public.contabilidad_cuenta_tipo as enum ('caja', 'banco');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contabilidad_metodo_clase as enum ('efectivo', 'tpv', 'transferencia', 'bizum', 'otro');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.contabilidad_banco (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contabilidad_cuenta (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  tipo public.contabilidad_cuenta_tipo not null,
  banco_id uuid references public.contabilidad_banco(id) on delete restrict,
  activo boolean not null default true,
  visible_efe boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contabilidad_metodo_pago (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  clase public.contabilidad_metodo_clase not null,
  cuenta_liquidacion_id uuid references public.contabilidad_cuenta(id) on delete restrict,
  activo boolean not null default true,
  permite_pendiente boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contabilidad_saldo_inicial_diario (
  fecha date not null,
  cuenta_id uuid not null references public.contabilidad_cuenta(id) on delete cascade,
  saldo_inicial numeric(12,2) not null,
  comentario text,
  updated_by uuid references public.usuario(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (fecha, cuenta_id)
);

drop trigger if exists set_contabilidad_banco_updated_at on public.contabilidad_banco;
create trigger set_contabilidad_banco_updated_at
before update on public.contabilidad_banco
for each row execute function public.fn_set_updated_at();

drop trigger if exists set_contabilidad_cuenta_updated_at on public.contabilidad_cuenta;
create trigger set_contabilidad_cuenta_updated_at
before update on public.contabilidad_cuenta
for each row execute function public.fn_set_updated_at();

drop trigger if exists set_contabilidad_metodo_pago_updated_at on public.contabilidad_metodo_pago;
create trigger set_contabilidad_metodo_pago_updated_at
before update on public.contabilidad_metodo_pago
for each row execute function public.fn_set_updated_at();

drop trigger if exists set_contabilidad_saldo_inicial_diario_updated_at on public.contabilidad_saldo_inicial_diario;
create trigger set_contabilidad_saldo_inicial_diario_updated_at
before update on public.contabilidad_saldo_inicial_diario
for each row execute function public.fn_set_updated_at();

insert into public.contabilidad_banco (codigo, nombre, activo, orden)
values
  ('santander', 'Banco Santander', true, 10),
  ('bbva', 'Banco BBVA', true, 20)
on conflict (codigo) do update
set nombre = excluded.nombre,
    activo = excluded.activo,
    orden = excluded.orden;

insert into public.contabilidad_cuenta (codigo, nombre, tipo, banco_id, activo, visible_efe, orden)
values
  ('efectivo', 'Caja Efectivo', 'caja', null, true, true, 10),
  ('personal', 'Caja Personal', 'caja', null, true, true, 20),
  ('santander', 'Banco Santander', 'banco', (select id from public.contabilidad_banco where codigo = 'santander'), true, true, 30),
  ('bbva', 'Banco BBVA', 'banco', (select id from public.contabilidad_banco where codigo = 'bbva'), true, true, 40)
on conflict (codigo) do update
set nombre = excluded.nombre,
    tipo = excluded.tipo,
    banco_id = excluded.banco_id,
    activo = excluded.activo,
    visible_efe = excluded.visible_efe,
    orden = excluded.orden;

insert into public.contabilidad_metodo_pago (
  codigo,
  nombre,
  clase,
  cuenta_liquidacion_id,
  activo,
  permite_pendiente,
  orden
)
values
  ('efectivo', 'Efectivo', 'efectivo', (select id from public.contabilidad_cuenta where codigo = 'efectivo'), true, false, 10),
  ('tpv', 'Tarjeta / TPV', 'tpv', (select id from public.contabilidad_cuenta where codigo = 'bbva'), true, false, 20),
  ('transferencia', 'Transferencia', 'transferencia', (select id from public.contabilidad_cuenta where codigo = 'santander'), true, false, 30),
  ('bizum_alfonso', 'Bizum Alfonso', 'bizum', (select id from public.contabilidad_cuenta where codigo = 'santander'), true, true, 40),
  ('tpv_online', 'Tarjeta Online', 'tpv', (select id from public.contabilidad_cuenta where codigo = 'bbva'), false, false, 50),
  ('bizum_robe', 'Bizum Robe', 'bizum', (select id from public.contabilidad_cuenta where codigo = 'santander'), false, false, 60),
  ('bizum_alba', 'Bizum Alba', 'bizum', (select id from public.contabilidad_cuenta where codigo = 'santander'), false, false, 70),
  ('bizum_maria', 'Bizum María', 'bizum', (select id from public.contabilidad_cuenta where codigo = 'santander'), false, false, 80),
  ('bizum_jm', 'Bizum JM', 'bizum', (select id from public.contabilidad_cuenta where codigo = 'santander'), false, false, 90),
  ('angeles', 'Ángeles', 'otro', (select id from public.contabilidad_cuenta where codigo = 'personal'), false, false, 100)
on conflict (codigo) do update
set nombre = excluded.nombre,
    clase = excluded.clase,
    cuenta_liquidacion_id = excluded.cuenta_liquidacion_id,
    activo = excluded.activo,
    permite_pendiente = excluded.permite_pendiente,
    orden = excluded.orden;

alter table public.pago
  add column if not exists metodo_pago_id uuid references public.contabilidad_metodo_pago(id) on delete restrict;

create index if not exists pago_metodo_pago_id_idx
  on public.pago (metodo_pago_id);

update public.pago p
set metodo_pago_id = mp.id
from public.contabilidad_metodo_pago mp
where p.metodo_pago_id is null
  and mp.codigo = p.metodo::text;

alter table public.movimiento_contable
  add column if not exists cuenta_id uuid references public.contabilidad_cuenta(id) on delete restrict;

alter table public.movimiento_contable
  add column if not exists metodo_pago_id uuid references public.contabilidad_metodo_pago(id) on delete restrict;

create index if not exists movimiento_contable_cuenta_id_idx
  on public.movimiento_contable (cuenta_id);

create index if not exists movimiento_contable_metodo_pago_id_idx
  on public.movimiento_contable (metodo_pago_id);

update public.movimiento_contable mc
set cuenta_id = cc.id
from public.contabilidad_cuenta cc
where mc.cuenta_id is null
  and cc.codigo = mc.caja::text;

update public.movimiento_contable mc
set metodo_pago_id = mp.id
from public.contabilidad_metodo_pago mp
where mc.metodo_pago_id is null
  and (
    (mc.metodo = 'efectivo' and mp.codigo = 'efectivo') or
    (mc.metodo = 'tarjeta' and mp.codigo = 'tpv') or
    (mc.metodo = 'transferencia' and mp.codigo = 'transferencia') or
    (mc.metodo = 'bizum_alfonso' and mp.codigo = 'bizum_alfonso') or
    (mc.metodo = 'bizum_robe' and mp.codigo = 'bizum_robe') or
    (mc.metodo = 'otro' and mp.codigo = 'angeles')
  );

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'movimiento_contable_gasto'
      and column_name = 'deducible'
      and udt_name = 'deducible_contable'
  ) then
    alter table public.movimiento_contable_gasto
      rename column deducible to deducible_legacy;
  end if;
end $$;

alter table public.movimiento_contable_gasto
  add column if not exists deducible boolean;

update public.movimiento_contable_gasto
set deducible = case
  when coalesce(deducible_legacy::text, 'no') = 'si' then true
  else false
end
where deducible is null;

alter table public.movimiento_contable_gasto
  alter column deducible set default false;

update public.movimiento_contable_gasto
set deducible = false
where deducible is null;

alter table public.movimiento_contable_gasto
  alter column deducible set not null;

create or replace function public.can_access_accounting()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_catalog
as $$
  select public.fn_backoffice_is_admin();
$$;

create or replace function public.contabilidad_resolve_metodo_pago_id(p_codigo text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select mp.id
  from public.contabilidad_metodo_pago mp
  where mp.codigo = p_codigo
  limit 1;
$$;

create or replace function public.contabilidad_resolve_cuenta_id_desde_codigo(p_codigo text)
returns uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select c.id
  from public.contabilidad_cuenta c
  where c.codigo = p_codigo
  limit 1;
$$;

create or replace function public.contabilidad_legacy_caja_desde_cuenta(p_cuenta_id uuid)
returns public.caja_contable
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  cuenta_row record;
begin
  if p_cuenta_id is null then
    return 'santander';
  end if;

  select codigo, tipo
  into cuenta_row
  from public.contabilidad_cuenta
  where id = p_cuenta_id;

  if cuenta_row.codigo = 'efectivo' then
    return 'efectivo';
  elsif cuenta_row.codigo = 'santander' then
    return 'santander';
  elsif cuenta_row.codigo = 'bbva' then
    return 'bbva';
  elsif cuenta_row.codigo = 'personal' then
    return 'personal';
  elsif cuenta_row.tipo = 'caja' then
    return 'personal';
  end if;

  return 'santander';
end;
$$;

create or replace function public.contabilidad_legacy_metodo_desde_metodo_pago(p_metodo_pago_id uuid)
returns public.metodo_contable
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  metodo_codigo text;
begin
  if p_metodo_pago_id is null then
    return null;
  end if;

  select codigo
  into metodo_codigo
  from public.contabilidad_metodo_pago
  where id = p_metodo_pago_id;

  case metodo_codigo
    when 'efectivo' then return 'efectivo';
    when 'tpv', 'tpv_online' then return 'tarjeta';
    when 'transferencia' then return 'transferencia';
    when 'bizum_alfonso' then return 'bizum_alfonso';
    when 'bizum_robe' then return 'bizum_robe';
    else return 'otro';
  end case;
end;
$$;

create or replace function public.contabilidad_iva_pct_desde_metodo_pago(p_metodo_pago_id uuid, p_legacy_metodo text default null)
returns numeric
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  clase_metodo public.contabilidad_metodo_clase;
begin
  if p_metodo_pago_id is not null then
    select clase
    into clase_metodo
    from public.contabilidad_metodo_pago
    where id = p_metodo_pago_id;
  end if;

  if clase_metodo in ('tpv', 'bizum', 'transferencia') then
    return 21;
  end if;

  if p_legacy_metodo in ('tpv', 'tpv_online', 'bizum_alfonso', 'bizum_robe', 'transferencia', 'tarjeta') then
    return 21;
  end if;

  return 0;
end;
$$;

create or replace function public.contabilidad_sync_pago_metodo_pago_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.metodo_pago_id is null and new.metodo is not null then
    new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id(new.metodo::text);
  end if;

  return new;
end;
$$;

drop trigger if exists sync_pago_metodo_pago_id on public.pago;
create trigger sync_pago_metodo_pago_id
before insert or update of metodo, metodo_pago_id
on public.pago
for each row
execute function public.contabilidad_sync_pago_metodo_pago_id();

create or replace function public.contabilidad_sync_movimiento_catalogos()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if new.cuenta_id is null and new.caja is not null then
    new.cuenta_id := public.contabilidad_resolve_cuenta_id_desde_codigo(new.caja::text);
  end if;

  if new.metodo_pago_id is null and new.metodo is not null then
    case new.metodo
      when 'efectivo' then new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('efectivo');
      when 'tarjeta' then new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('tpv');
      when 'transferencia' then new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('transferencia');
      when 'bizum_alfonso' then new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('bizum_alfonso');
      when 'bizum_robe' then new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('bizum_robe');
      else new.metodo_pago_id := public.contabilidad_resolve_metodo_pago_id('angeles');
    end case;
  end if;

  if new.cuenta_id is null and new.metodo_pago_id is not null then
    select cuenta_liquidacion_id
    into new.cuenta_id
    from public.contabilidad_metodo_pago
    where id = new.metodo_pago_id;
  end if;

  if new.cuenta_id is not null then
    new.caja := public.contabilidad_legacy_caja_desde_cuenta(new.cuenta_id);
  end if;

  if new.metodo_pago_id is not null then
    new.metodo := public.contabilidad_legacy_metodo_desde_metodo_pago(new.metodo_pago_id);
  end if;

  return new;
end;
$$;

drop trigger if exists sync_movimiento_contable_catalogos on public.movimiento_contable;
create trigger sync_movimiento_contable_catalogos
before insert or update of caja, cuenta_id, metodo, metodo_pago_id
on public.movimiento_contable
for each row
execute function public.contabilidad_sync_movimiento_catalogos();

create or replace function public.sync_movimiento_contable_desde_pago(pago_row public.pago)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  metodo_pago_id_value uuid;
  cuenta_destino_id uuid;
  legacy_caja_value public.caja_contable;
  legacy_metodo_value public.metodo_contable;
  iva_pct_normalizado numeric(5,2);
  base_calculada numeric(12,2);
  iva_calculado numeric(12,2);
  movimiento_id uuid;
begin
  if pago_row.estado is distinct from 'completado' then
    delete from public.movimiento_contable where id_pago = pago_row.id;
    return null;
  end if;

  metodo_pago_id_value := coalesce(
    pago_row.metodo_pago_id,
    public.contabilidad_resolve_metodo_pago_id(pago_row.metodo::text)
  );

  if metodo_pago_id_value is null then
    delete from public.movimiento_contable where id_pago = pago_row.id;
    return null;
  end if;

  select cuenta_liquidacion_id
  into cuenta_destino_id
  from public.contabilidad_metodo_pago
  where id = metodo_pago_id_value;

  if cuenta_destino_id is null then
    cuenta_destino_id := public.contabilidad_resolve_cuenta_id_desde_codigo('santander');
  end if;

  legacy_caja_value := public.contabilidad_legacy_caja_desde_cuenta(cuenta_destino_id);
  legacy_metodo_value := public.contabilidad_legacy_metodo_desde_metodo_pago(metodo_pago_id_value);
  iva_pct_normalizado := public.contabilidad_iva_pct_desde_metodo_pago(metodo_pago_id_value, pago_row.metodo::text);

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
    cuenta_id,
    metodo,
    metodo_pago_id,
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
    legacy_caja_value,
    cuenta_destino_id,
    legacy_metodo_value,
    metodo_pago_id_value,
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
        cuenta_id = excluded.cuenta_id,
        metodo = excluded.metodo,
        metodo_pago_id = excluded.metodo_pago_id,
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
set search_path = public, pg_catalog
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
after insert or update of concepto, importe, metodo, metodo_pago_id, estado, origen_tipo, origen_id, created_at
on public.pago
for each row
execute function public.handle_sync_movimiento_contable_desde_pago();

drop trigger if exists sync_movimiento_contable_desde_pago_delete on public.pago;
create trigger sync_movimiento_contable_desde_pago_delete
after delete
on public.pago
for each row
execute function public.handle_sync_movimiento_contable_desde_pago();

update public.pago p
set metodo_pago_id = public.contabilidad_resolve_metodo_pago_id(p.metodo::text)
where p.metodo_pago_id is null;

do $$
declare
  pago_row public.pago%rowtype;
begin
  for pago_row in
    select *
    from public.pago
  loop
    perform public.sync_movimiento_contable_desde_pago(pago_row);
  end loop;
end $$;

alter table public.contabilidad_banco enable row level security;
alter table public.contabilidad_cuenta enable row level security;
alter table public.contabilidad_metodo_pago enable row level security;
alter table public.contabilidad_saldo_inicial_diario enable row level security;
alter table public.movimiento_contable enable row level security;
alter table public.movimiento_contable_gasto enable row level security;
alter table public.pago enable row level security;
alter table public.documento enable row level security;
alter table public.usuario enable row level security;
alter table public.empleado enable row level security;

drop policy if exists contabilidad_banco_select_backoffice on public.contabilidad_banco;
create policy contabilidad_banco_select_backoffice on public.contabilidad_banco
for select using (public.fn_backoffice_can_read());
drop policy if exists contabilidad_banco_insert_admin on public.contabilidad_banco;
create policy contabilidad_banco_insert_admin on public.contabilidad_banco
for insert with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_banco_update_admin on public.contabilidad_banco;
create policy contabilidad_banco_update_admin on public.contabilidad_banco
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_banco_delete_admin on public.contabilidad_banco;
create policy contabilidad_banco_delete_admin on public.contabilidad_banco
for delete using (public.fn_backoffice_is_admin());

drop policy if exists contabilidad_cuenta_select_backoffice on public.contabilidad_cuenta;
create policy contabilidad_cuenta_select_backoffice on public.contabilidad_cuenta
for select using (public.fn_backoffice_can_read());
drop policy if exists contabilidad_cuenta_insert_admin on public.contabilidad_cuenta;
create policy contabilidad_cuenta_insert_admin on public.contabilidad_cuenta
for insert with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_cuenta_update_admin on public.contabilidad_cuenta;
create policy contabilidad_cuenta_update_admin on public.contabilidad_cuenta
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_cuenta_delete_admin on public.contabilidad_cuenta;
create policy contabilidad_cuenta_delete_admin on public.contabilidad_cuenta
for delete using (public.fn_backoffice_is_admin());

drop policy if exists contabilidad_metodo_pago_select_backoffice on public.contabilidad_metodo_pago;
create policy contabilidad_metodo_pago_select_backoffice on public.contabilidad_metodo_pago
for select using (public.fn_backoffice_can_read());
drop policy if exists contabilidad_metodo_pago_insert_admin on public.contabilidad_metodo_pago;
create policy contabilidad_metodo_pago_insert_admin on public.contabilidad_metodo_pago
for insert with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_metodo_pago_update_admin on public.contabilidad_metodo_pago;
create policy contabilidad_metodo_pago_update_admin on public.contabilidad_metodo_pago
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_metodo_pago_delete_admin on public.contabilidad_metodo_pago;
create policy contabilidad_metodo_pago_delete_admin on public.contabilidad_metodo_pago
for delete using (public.fn_backoffice_is_admin());

drop policy if exists contabilidad_saldo_inicial_diario_select_admin on public.contabilidad_saldo_inicial_diario;
create policy contabilidad_saldo_inicial_diario_select_admin on public.contabilidad_saldo_inicial_diario
for select using (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_saldo_inicial_diario_insert_admin on public.contabilidad_saldo_inicial_diario;
create policy contabilidad_saldo_inicial_diario_insert_admin on public.contabilidad_saldo_inicial_diario
for insert with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_saldo_inicial_diario_update_admin on public.contabilidad_saldo_inicial_diario;
create policy contabilidad_saldo_inicial_diario_update_admin on public.contabilidad_saldo_inicial_diario
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
drop policy if exists contabilidad_saldo_inicial_diario_delete_admin on public.contabilidad_saldo_inicial_diario;
create policy contabilidad_saldo_inicial_diario_delete_admin on public.contabilidad_saldo_inicial_diario
for delete using (public.fn_backoffice_is_admin());

drop policy if exists movimiento_contable_select_admin on public.movimiento_contable;
create policy movimiento_contable_select_admin on public.movimiento_contable
for select using (public.can_access_accounting());
drop policy if exists movimiento_contable_insert_admin on public.movimiento_contable;
create policy movimiento_contable_insert_admin on public.movimiento_contable
for insert with check (public.can_access_accounting());
drop policy if exists movimiento_contable_update_admin on public.movimiento_contable;
create policy movimiento_contable_update_admin on public.movimiento_contable
for update using (public.can_access_accounting()) with check (public.can_access_accounting());
drop policy if exists movimiento_contable_delete_admin on public.movimiento_contable;
create policy movimiento_contable_delete_admin on public.movimiento_contable
for delete using (public.can_access_accounting());

drop policy if exists movimiento_contable_gasto_select_admin on public.movimiento_contable_gasto;
create policy movimiento_contable_gasto_select_admin on public.movimiento_contable_gasto
for select using (public.can_access_accounting());
drop policy if exists movimiento_contable_gasto_insert_admin on public.movimiento_contable_gasto;
create policy movimiento_contable_gasto_insert_admin on public.movimiento_contable_gasto
for insert with check (public.can_access_accounting());
drop policy if exists movimiento_contable_gasto_update_admin on public.movimiento_contable_gasto;
create policy movimiento_contable_gasto_update_admin on public.movimiento_contable_gasto
for update using (public.can_access_accounting()) with check (public.can_access_accounting());
drop policy if exists movimiento_contable_gasto_delete_admin on public.movimiento_contable_gasto;
create policy movimiento_contable_gasto_delete_admin on public.movimiento_contable_gasto
for delete using (public.can_access_accounting());

drop policy if exists pago_select_backoffice on public.pago;
create policy pago_select_backoffice on public.pago
for select using (public.fn_backoffice_can_read());
drop policy if exists pago_insert_backoffice on public.pago;
create policy pago_insert_backoffice on public.pago
for insert with check (public.fn_backoffice_can_write());
drop policy if exists pago_update_backoffice on public.pago;
create policy pago_update_backoffice on public.pago
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
drop policy if exists pago_delete_admin on public.pago;
create policy pago_delete_admin on public.pago
for delete using (public.fn_backoffice_is_admin());

drop policy if exists documento_select_backoffice on public.documento;
create policy documento_select_backoffice on public.documento
for select using (public.fn_backoffice_can_read());
drop policy if exists documento_insert_backoffice on public.documento;
create policy documento_insert_backoffice on public.documento
for insert with check (public.fn_backoffice_can_write());
drop policy if exists documento_update_backoffice on public.documento;
create policy documento_update_backoffice on public.documento
for update using (public.fn_backoffice_can_write()) with check (public.fn_backoffice_can_write());
drop policy if exists documento_delete_admin on public.documento;
create policy documento_delete_admin on public.documento
for delete using (public.fn_backoffice_is_admin());

drop policy if exists usuario_select_self_or_admin on public.usuario;
create policy usuario_select_self_or_admin on public.usuario
for select using (
  public.fn_backoffice_is_admin()
  or email = auth.email()
);

drop policy if exists empleado_select_admin on public.empleado;
create policy empleado_select_admin on public.empleado
for select using (public.fn_backoffice_is_admin());
drop policy if exists empleado_insert_admin on public.empleado;
create policy empleado_insert_admin on public.empleado
for insert with check (public.fn_backoffice_is_admin());
drop policy if exists empleado_update_admin on public.empleado;
create policy empleado_update_admin on public.empleado
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
drop policy if exists empleado_delete_admin on public.empleado;
create policy empleado_delete_admin on public.empleado
for delete using (public.fn_backoffice_is_admin());
