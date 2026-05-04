-- Hardening posterior al reset inicial: índices FK faltantes y políticas RLS sin FOR ALL.

create index if not exists servicio_created_by_idx on public.servicio (created_by);
create index if not exists servicio_updated_by_idx on public.servicio (updated_by);

create index if not exists servicio_tarifa_especial_tarifa_id_idx
  on public.servicio_tarifa_especial (tarifa_id);

create index if not exists servicio_sesion_created_by_idx on public.servicio_sesion (created_by);
create index if not exists servicio_sesion_updated_by_idx on public.servicio_sesion (updated_by);

create index if not exists reserva_servicio_cliente_id_idx on public.reserva_servicio (cliente_id);
create index if not exists reserva_servicio_created_by_idx on public.reserva_servicio (created_by);
create index if not exists reserva_servicio_updated_by_idx on public.reserva_servicio (updated_by);

create index if not exists reserva_servicio_item_sesion_id_idx on public.reserva_servicio_item (sesion_id);
create index if not exists reserva_servicio_item_tarifa_id_idx on public.reserva_servicio_item (tarifa_id);
create index if not exists reserva_servicio_item_tarifa_especial_id_idx
  on public.reserva_servicio_item (tarifa_especial_id);

create index if not exists parking_reserva_empresa_id_idx on public.parking_reserva (empresa_id);
create index if not exists parking_reserva_tarifa_id_idx on public.parking_reserva (tarifa_id);
create index if not exists parking_reserva_created_by_idx on public.parking_reserva (created_by);
create index if not exists parking_reserva_updated_by_idx on public.parking_reserva (updated_by);

create index if not exists pago_aplicacion_created_by_idx on public.pago_aplicacion (created_by);

drop policy if exists servicio_write_admin on public.servicio;
create policy servicio_insert_admin on public.servicio
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_update_admin on public.servicio
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_delete_admin on public.servicio
for delete using (public.fn_backoffice_is_admin());

drop policy if exists servicio_tarifa_write_admin on public.servicio_tarifa;
create policy servicio_tarifa_insert_admin on public.servicio_tarifa
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_tarifa_update_admin on public.servicio_tarifa
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_tarifa_delete_admin on public.servicio_tarifa
for delete using (public.fn_backoffice_is_admin());

drop policy if exists servicio_tarifa_especial_write_admin on public.servicio_tarifa_especial;
create policy servicio_tarifa_especial_insert_admin on public.servicio_tarifa_especial
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_tarifa_especial_update_admin on public.servicio_tarifa_especial
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_tarifa_especial_delete_admin on public.servicio_tarifa_especial
for delete using (public.fn_backoffice_is_admin());

drop policy if exists servicio_horario_write_admin on public.servicio_horario_regla;
create policy servicio_horario_insert_admin on public.servicio_horario_regla
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_horario_update_admin on public.servicio_horario_regla
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_horario_delete_admin on public.servicio_horario_regla
for delete using (public.fn_backoffice_is_admin());

drop policy if exists servicio_sesion_write_admin on public.servicio_sesion;
create policy servicio_sesion_insert_admin on public.servicio_sesion
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_sesion_update_admin on public.servicio_sesion
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_sesion_delete_admin on public.servicio_sesion
for delete using (public.fn_backoffice_is_admin());

drop policy if exists inventario_pool_write_admin on public.inventario_pool;
create policy inventario_pool_insert_admin on public.inventario_pool
for insert with check (public.fn_backoffice_is_admin());
create policy inventario_pool_update_admin on public.inventario_pool
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy inventario_pool_delete_admin on public.inventario_pool
for delete using (public.fn_backoffice_is_admin());

drop policy if exists servicio_consumo_pool_write_admin on public.servicio_consumo_pool;
create policy servicio_consumo_pool_insert_admin on public.servicio_consumo_pool
for insert with check (public.fn_backoffice_is_admin());
create policy servicio_consumo_pool_update_admin on public.servicio_consumo_pool
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy servicio_consumo_pool_delete_admin on public.servicio_consumo_pool
for delete using (public.fn_backoffice_is_admin());

drop policy if exists parking_plaza_write_admin on public.parking_plaza;
create policy parking_plaza_insert_admin on public.parking_plaza
for insert with check (public.fn_backoffice_is_admin());
create policy parking_plaza_update_admin on public.parking_plaza
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy parking_plaza_delete_admin on public.parking_plaza
for delete using (public.fn_backoffice_is_admin());

drop policy if exists parking_tarifa_write_admin on public.parking_tarifa;
create policy parking_tarifa_insert_admin on public.parking_tarifa
for insert with check (public.fn_backoffice_is_admin());
create policy parking_tarifa_update_admin on public.parking_tarifa
for update using (public.fn_backoffice_is_admin()) with check (public.fn_backoffice_is_admin());
create policy parking_tarifa_delete_admin on public.parking_tarifa
for delete using (public.fn_backoffice_is_admin());
