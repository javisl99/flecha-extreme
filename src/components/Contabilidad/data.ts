import { MovimientoCaja } from '@/shared/types';

export const movimientosCajaMock: MovimientoCaja[] = [];

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