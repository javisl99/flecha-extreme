-- Rollback logico del seed contable manual de junio 2026
-- Ejecutar solo sobre el proyecto vvcpgnkatdwwzwnfihrf con supabase-org2

begin;

do $$
declare
  run_id constant text := 'seed_contabilidad_manual_20260610_jun01_jul01';
begin
  delete from public.documento
  where id_movimiento_contable in (
    select id
    from public.movimiento_contable
    where concepto like run_id || '%'
  );

  delete from public.movimiento_contable_gasto
  where id_movimiento_contable in (
    select id
    from public.movimiento_contable
    where concepto like run_id || '%'
  );

  delete from public.movimiento_contable
  where concepto like run_id || '%';
end;
$$;

commit;
