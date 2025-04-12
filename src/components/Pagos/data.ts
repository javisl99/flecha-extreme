import { Pago } from '@/shared/types';
import { clientesMock } from '@/components/Clientes/data';
import { reservasMock } from '@/components/Reservas/data';

export const pagosMock: Pago[] = [
  {
    id: 'p1',
    clienteId: 'c1',
    cliente: clientesMock.find(c => c.id === 'c1'),
    reservaId: 'r1',
    reserva: reservasMock.find(r => r.id === 'r1'),
    concepto: 'Clase de Kitesurf',
    monto: 80,
    fechaPago: '2024-04-20',
    metodoPago: 'tarjeta',
    estado: 'completado'
  },
  {
    id: 'p2',
    clienteId: 'c3',
    cliente: clientesMock.find(c => c.id === 'c3'),
    reservaId: 'r3',
    reserva: reservasMock.find(r => r.id === 'r3'),
    concepto: 'Tour de Paddleboard',
    monto: 60,
    fechaPago: '2024-04-25',
    metodoPago: 'efectivo',
    estado: 'completado'
  },
  {
    id: 'p3',
    clienteId: 'c4',
    cliente: clientesMock.find(c => c.id === 'c4'),
    reservaId: 'r4',
    reserva: reservasMock.find(r => r.id === 'r4'),
    concepto: 'Mantenimiento de Equipo',
    monto: 50,
    fechaPago: '2024-04-28',
    metodoPago: 'tarjeta',
    estado: 'completado'
  },
  {
    id: 'p4',
    clienteId: 'c6',
    cliente: clientesMock.find(c => c.id === 'c6'),
    reservaId: 'r6',
    reserva: reservasMock.find(r => r.id === 'r6'),
    concepto: 'Campus de Verano',
    monto: 250,
    fechaPago: '2024-06-15',
    metodoPago: 'transferencia',
    estado: 'completado',
    notas: 'Pago anticipado'
  },
  {
    id: 'p5',
    clienteId: 'c8',
    cliente: clientesMock.find(c => c.id === 'c8'),
    reservaId: 'r8',
    reserva: reservasMock.find(r => r.id === 'r8'),
    concepto: 'Clase Privada de Kitesurf',
    monto: 150,
    fechaPago: '2024-05-01',
    metodoPago: 'tarjeta',
    estado: 'completado'
  },
  {
    id: 'p6',
    clienteId: 'c2',
    cliente: clientesMock.find(c => c.id === 'c2'),
    reservaId: 'r2',
    reserva: reservasMock.find(r => r.id === 'r2'),
    concepto: 'Alquiler de Kayak',
    monto: 40,
    fechaPago: '2024-04-26',
    metodoPago: 'efectivo',
    estado: 'pendiente'
  },
  {
    id: 'p7',
    clienteId: 'c5',
    cliente: clientesMock.find(c => c.id === 'c5'),
    reservaId: 'r5',
    reserva: reservasMock.find(r => r.id === 'r5'),
    concepto: 'Clase de Kitesurf',
    monto: 80,
    fechaPago: '2024-04-29',
    metodoPago: 'efectivo',
    estado: 'pendiente'
  },
  {
    id: 'p8',
    clienteId: 'c7',
    cliente: clientesMock.find(c => c.id === 'c7'),
    reservaId: 'r7',
    reserva: reservasMock.find(r => r.id === 'r7'),
    concepto: 'Alquiler de Equipo',
    monto: 70,
    fechaPago: '2024-04-30',
    metodoPago: 'tarjeta',
    estado: 'pendiente'
  },
  {
    id: 'p9',
    clienteId: 'c1',
    cliente: clientesMock.find(c => c.id === 'c1'),
    concepto: 'Venta de Material',
    monto: 120,
    fechaPago: '2024-04-15',
    metodoPago: 'tarjeta',
    estado: 'completado'
  },
  // Nuevos pagos para el 25 de abril
  {
    id: 'p10',
    clienteId: 'c2',
    cliente: clientesMock.find(c => c.id === 'c2'),
    reservaId: 'r10',
    reserva: reservasMock.find(r => r.id === 'r10'),
    concepto: 'Alquiler de Paddleboard',
    monto: 35,
    fechaPago: '2024-04-25',
    metodoPago: 'tarjeta',
    estado: 'completado'
  },
  {
    id: 'p11',
    clienteId: 'c4',
    cliente: clientesMock.find(c => c.id === 'c4'),
    reservaId: 'r11',
    reserva: reservasMock.find(r => r.id === 'r11'),
    concepto: 'Excursión Grupal',
    monto: 45,
    fechaPago: '2024-04-25',
    metodoPago: 'efectivo',
    estado: 'completado',
    notas: 'Pago en el momento'
  },
  {
    id: 'p12',
    clienteId: 'c3',
    cliente: clientesMock.find(c => c.id === 'c3'),
    reservaId: 'r13',
    reserva: reservasMock.find(r => r.id === 'r13'),
    concepto: 'Reparación de Material',
    monto: 25,
    fechaPago: '2024-04-25',
    metodoPago: 'efectivo',
    estado: 'completado'
  },
  {
    id: 'p13',
    clienteId: 'c5',
    cliente: clientesMock.find(c => c.id === 'c5'),
    concepto: 'Venta de Accesorios',
    monto: 65,
    fechaPago: '2024-04-25',
    metodoPago: 'tarjeta',
    estado: 'completado',
    notas: 'Leash y funda tabla'
  }
]; 