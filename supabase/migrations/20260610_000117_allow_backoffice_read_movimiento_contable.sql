drop policy if exists movimiento_contable_select_admin on public.movimiento_contable;
create policy movimiento_contable_select_backoffice on public.movimiento_contable
for select
using (public.fn_backoffice_can_read());
