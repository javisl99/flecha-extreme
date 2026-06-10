-- Rollback logico del seed masivo de junio 2026
-- Ejecutar solo sobre el proyecto vvcpgnkatdwwzwnfihrf con supabase-org2

begin;

do $$
declare
  run_id constant text := 'seed_masiva_20260610_jun01_jul01';
begin
  delete from public.pago_descuento_snapshot
  where pago_id in (
    select id
    from public.pago
    where concepto like run_id || '%'
  );

  delete from public.campamento_participante_descuento
  where campamento_participante_id in (
    select cp.id
    from public.campamento_participante cp
    join public.reserva_servicio r on r.id = cp.reserva_id
    where r.observaciones like run_id || '%'
  );

  delete from public.pago_aplicacion
  where pago_id in (
    select id
    from public.pago
    where concepto like run_id || '%'
  );

  delete from public.pago
  where concepto like run_id || '%';

  delete from public.campamento_participante
  where reserva_id in (
    select id
    from public.reserva_servicio
    where observaciones like run_id || '%'
  );

  delete from public.reserva_servicio_item
  where reserva_id in (
    select id
    from public.reserva_servicio
    where observaciones like run_id || '%'
  );

  delete from public.reserva_servicio
  where observaciones like run_id || '%';

  delete from public.campamento_programa
  where notas like run_id || '%';

  delete from public.campamento_participante_catalogo
  where dni in (
    'SEED-CAMP-001', 'SEED-CAMP-002', 'SEED-CAMP-003', 'SEED-CAMP-004', 'SEED-CAMP-005',
    'SEED-CAMP-006', 'SEED-CAMP-007', 'SEED-CAMP-008', 'SEED-CAMP-009', 'SEED-CAMP-010',
    'SEED-CAMP-011', 'SEED-CAMP-012', 'SEED-CAMP-013', 'SEED-CAMP-014', 'SEED-CAMP-015',
    'SEED-CAMP-016', 'SEED-CAMP-017', 'SEED-CAMP-018', 'SEED-CAMP-019', 'SEED-CAMP-020',
    'SEED-CAMP-021', 'SEED-CAMP-022', 'SEED-CAMP-023', 'SEED-CAMP-024', 'SEED-CAMP-025',
    'SEED-CAMP-026'
  );

  delete from public.cliente
  where email in (
    'seed.massive+01@flecha-extreme.test', 'seed.massive+02@flecha-extreme.test',
    'seed.massive+03@flecha-extreme.test', 'seed.massive+04@flecha-extreme.test',
    'seed.massive+05@flecha-extreme.test', 'seed.massive+06@flecha-extreme.test',
    'seed.massive+07@flecha-extreme.test', 'seed.massive+08@flecha-extreme.test',
    'seed.massive+09@flecha-extreme.test', 'seed.massive+10@flecha-extreme.test',
    'seed.massive+11@flecha-extreme.test', 'seed.massive+12@flecha-extreme.test',
    'seed.massive+13@flecha-extreme.test', 'seed.massive+14@flecha-extreme.test',
    'seed.massive+15@flecha-extreme.test', 'seed.massive+16@flecha-extreme.test',
    'seed.massive+17@flecha-extreme.test', 'seed.massive+18@flecha-extreme.test',
    'seed.massive+19@flecha-extreme.test', 'seed.massive+20@flecha-extreme.test',
    'seed.massive+21@flecha-extreme.test', 'seed.massive+22@flecha-extreme.test',
    'seed.massive+23@flecha-extreme.test', 'seed.massive+24@flecha-extreme.test',
    'seed.massive+25@flecha-extreme.test', 'seed.massive+26@flecha-extreme.test',
    'seed.massive+27@flecha-extreme.test', 'seed.massive+28@flecha-extreme.test',
    'seed.massive+29@flecha-extreme.test', 'seed.massive+30@flecha-extreme.test',
    'seed.massive+31@flecha-extreme.test', 'seed.massive+32@flecha-extreme.test',
    'seed.massive+33@flecha-extreme.test', 'seed.massive+34@flecha-extreme.test',
    'seed.massive+35@flecha-extreme.test', 'seed.massive+36@flecha-extreme.test'
  );
end;
$$;

commit;
