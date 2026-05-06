create or replace function public.fn_sync_cancelled_reserva_servicio_items()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.estado is distinct from old.estado and new.estado = 'cancelada' then
    update public.reserva_servicio_item
    set estado = 'cancelada'
    where reserva_id = new.id
      and estado in ('pendiente', 'confirmada');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_cancelled_reserva_servicio_items on public.reserva_servicio;

create trigger trg_sync_cancelled_reserva_servicio_items
after update of estado on public.reserva_servicio
for each row execute function public.fn_sync_cancelled_reserva_servicio_items();

update public.reserva_servicio_item ri
set estado = 'cancelada'
from public.reserva_servicio r
where r.id = ri.reserva_id
  and r.estado = 'cancelada'
  and ri.estado in ('pendiente', 'confirmada');
