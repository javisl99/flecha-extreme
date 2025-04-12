interface MovimientoCaja {
  id: string;
  fecha: string;
  concepto: string;
  tipo: 'ingreso' | 'gasto';
  importe: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  referencia?: string;
  notas?: string;
}

export const movimientosCajaMock: MovimientoCaja[] = [
  {
    id: 'mc1',
    fecha: '2024-04-24',
    concepto: 'Clase de Kitesurf',
    tipo: 'ingreso',
    importe: 80,
    metodoPago: 'efectivo',
    referencia: 'Reserva R1'
  },
  {
    id: 'mc2',
    fecha: '2024-04-24',
    concepto: 'Venta Material',
    tipo: 'ingreso',
    importe: 120,
    metodoPago: 'tarjeta',
    referencia: 'FAC-2024-042'
  },
  {
    id: 'mc3',
    fecha: '2024-04-24',
    concepto: 'Compra Suministros',
    tipo: 'gasto',
    importe: 45.50,
    metodoPago: 'efectivo',
    notas: 'Material de oficina'
  },
  {
    id: 'mc4',
    fecha: '2024-04-24',
    concepto: 'Tour Paddleboard',
    tipo: 'ingreso',
    importe: 60,
    metodoPago: 'efectivo',
    referencia: 'Reserva R3'
  },
  {
    id: 'mc5',
    fecha: '2024-04-24',
    concepto: 'Reposición Combustible',
    tipo: 'gasto',
    importe: 70.25,
    metodoPago: 'tarjeta',
    notas: 'Gasolina furgoneta'
  },
  {
    id: 'mc6',
    fecha: '2024-04-25',
    concepto: 'Alquiler Equipos',
    tipo: 'ingreso',
    importe: 95,
    metodoPago: 'tarjeta',
    referencia: 'ALQ-2024-043'
  },
  {
    id: 'mc7',
    fecha: '2024-04-25',
    concepto: 'Reparación Equipo',
    tipo: 'gasto',
    importe: 85.30,
    metodoPago: 'transferencia',
    notas: 'Piezas tabla kitesurf'
  },
  {
    id: 'mc8',
    fecha: '2024-04-25',
    concepto: 'Clase Privada',
    tipo: 'ingreso',
    importe: 150,
    metodoPago: 'tarjeta',
    referencia: 'Reserva R8'
  },
  {
    id: 'mc9',
    fecha: '2024-04-25',
    concepto: 'Comisiones Bancarias',
    tipo: 'gasto',
    importe: 12.45,
    metodoPago: 'otro',
    notas: 'Comisiones TPV'
  },
  {
    id: 'mc10',
    fecha: '2024-04-25',
    concepto: 'Anticipo Campus Verano',
    tipo: 'ingreso',
    importe: 250,
    metodoPago: 'transferencia',
    referencia: 'Reserva R6'
  }
];

// Función para calcular el balance diario
export const calcularBalanceDiario = (fecha: string) => {
  const movimientosDia = movimientosCajaMock.filter(m => m.fecha === fecha);
  
  const ingresos = movimientosDia
    .filter(m => m.tipo === 'ingreso')
    .reduce((total, m) => total + m.importe, 0);
    
  const gastos = movimientosDia
    .filter(m => m.tipo === 'gasto')
    .reduce((total, m) => total + m.importe, 0);
    
  return {
    fecha,
    ingresos,
    gastos,
    balance: ingresos - gastos
  };
};

export type BalanceDiario = ReturnType<typeof calcularBalanceDiario>; 