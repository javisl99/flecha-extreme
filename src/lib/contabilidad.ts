import {
  CajaContable,
  DetalleGastoContable,
  MetodoContable,
  MovimientoContable,
  ResumenCaja,
  ResumenEfeDiario,
  TipoGastoContable,
  TipoMovimientoContable,
} from '@/shared/types';

export const CAJAS_CONTABLES: Array<{ value: CajaContable; label: string }> = [
  { value: 'efectivo', label: 'Caja Efectivo' },
  { value: 'santander', label: 'Banco Santander' },
  { value: 'bbva', label: 'Banco BBVA' },
  { value: 'personal', label: 'Caja Personal' },
];

export const METODOS_CONTABLES: Array<{ value: MetodoContable; label: string }> = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta / TPV' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum_alfonso', label: 'Bizum Alfonso' },
  { value: 'bizum_robe', label: 'Bizum Robe' },
  { value: 'otro', label: 'Otro' },
];

export const TIPOS_GASTO_CONTABLES: Array<{ value: TipoGastoContable; label: string }> = [
  { value: 'publicidad_marketing', label: 'Publicidad y marketing' },
  { value: 'personal', label: 'Personal' },
  { value: 'material', label: 'Material' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'alquiler_robe', label: 'Alquiler robe' },
  { value: 'otros', label: 'Otros' },
];

export const MOVIMIENTOS_CON_IVA = new Set<MetodoContable>([
  'tarjeta',
  'bizum_alfonso',
  'bizum_robe',
  'transferencia',
]);

export const todayAccountingDate = () => new Date().toISOString().slice(0, 10);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);

export const accountingTypeLabel = (tipo: TipoMovimientoContable) => {
  switch (tipo) {
    case 'ingreso':
      return 'Ingreso';
    case 'gasto':
      return 'Gasto';
    case 'traspaso_entrada':
      return 'Traspaso entrada';
    case 'traspaso_salida':
      return 'Traspaso salida';
    default:
      return tipo;
  }
};

export const accountingMethodLabel = (metodo?: MetodoContable | null) => {
  if (!metodo) return '-';
  return METODOS_CONTABLES.find((item) => item.value === metodo)?.label || metodo;
};

export const accountingBoxLabel = (caja: CajaContable) =>
  CAJAS_CONTABLES.find((item) => item.value === caja)?.label || caja;

export const isOperationalMovement = (movimiento: MovimientoContable) =>
  movimiento.estado === 'confirmado' &&
  movimiento.tipo !== 'traspaso_entrada' &&
  movimiento.tipo !== 'traspaso_salida';

export const isOperationalIncome = (movimiento: MovimientoContable) =>
  isOperationalMovement(movimiento) && movimiento.tipo === 'ingreso';

export const isOperationalExpense = (movimiento: MovimientoContable) =>
  isOperationalMovement(movimiento) && movimiento.tipo === 'gasto';

export const isManualMovement = (movimiento: MovimientoContable) => !movimiento.id_pago;

export const accountingVatPercent = (metodo?: MetodoContable | null) =>
  metodo && MOVIMIENTOS_CON_IVA.has(metodo) ? 21 : 0;

export const accountingBoxByMethod = (metodo?: MetodoContable | null): CajaContable => {
  if (metodo === 'tarjeta') return 'bbva';
  if (metodo === 'efectivo') return 'efectivo';
  return 'santander';
};

export const normalizePaymentMethodToAccounting = (metodo?: string | null): MetodoContable => {
  switch (metodo) {
    case 'tpv':
    case 'tpv_online':
      return 'tarjeta';
    case 'bizum_alfonso':
      return 'bizum_alfonso';
    case 'bizum_robe':
      return 'bizum_robe';
    case 'transferencia':
      return 'transferencia';
    case 'efectivo':
      return 'efectivo';
    default:
      return 'otro';
  }
};

export const calculateTaxBreakdown = (importeTotal: number, ivaPct: number) => {
  if (!ivaPct) {
    return {
      baseImponible: importeTotal,
      ivaImporte: 0,
    };
  }

  const baseImponible = Number((importeTotal / (1 + ivaPct / 100)).toFixed(2));
  return {
    baseImponible,
    ivaImporte: Number((importeTotal - baseImponible).toFixed(2)),
  };
};

export const buildResumenCajas = (movimientos: MovimientoContable[]): ResumenCaja[] => {
  return CAJAS_CONTABLES.map((caja) => {
    const movimientosCaja = movimientos.filter(
      (movimiento) => movimiento.caja === caja.value && movimiento.estado === 'confirmado'
    );

    const saldo = movimientosCaja.reduce((total, movimiento) => {
      if (movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida') {
        return total - movimiento.importe_total;
      }

      return total + movimiento.importe_total;
    }, 0);

    const ingresos_operativos = movimientosCaja
      .filter(isOperationalIncome)
      .reduce((total, movimiento) => total + movimiento.importe_total, 0);

    const gastos_operativos = movimientosCaja
      .filter(isOperationalExpense)
      .reduce((total, movimiento) => total + movimiento.importe_total, 0);

    return {
      caja: caja.value,
      saldo,
      ingresos_operativos,
      gastos_operativos,
    };
  });
};

export const buildResumenEfeDiario = (
  movimientos: MovimientoContable[],
  fecha: string
): ResumenEfeDiario => {
  const movimientosDia = movimientos.filter(
    (movimiento) => movimiento.fecha_operacion === fecha && movimiento.estado === 'confirmado'
  );

  const ingresos = movimientosDia
    .filter(isOperationalIncome)
    .reduce((total, movimiento) => total + movimiento.importe_total, 0);

  const gastos = movimientosDia
    .filter(isOperationalExpense)
    .reduce((total, movimiento) => total + movimiento.importe_total, 0);

  return {
    fecha,
    ingresos,
    gastos,
    saldo: ingresos - gastos,
    bizum_alfonso: movimientosDia
      .filter((movimiento) => isOperationalIncome(movimiento) && movimiento.metodo === 'bizum_alfonso')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0),
    bizum_robe: movimientosDia
      .filter((movimiento) => isOperationalIncome(movimiento) && movimiento.metodo === 'bizum_robe')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0),
    tarjeta: movimientosDia
      .filter((movimiento) => isOperationalIncome(movimiento) && movimiento.metodo === 'tarjeta')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0),
    transferencia: movimientosDia
      .filter((movimiento) => isOperationalIncome(movimiento) && movimiento.metodo === 'transferencia')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0),
    movimientos: movimientosDia.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  };
};

export const createEmptyGastoDetail = (): Omit<DetalleGastoContable, 'id_movimiento_contable'> => ({
  tipo_gasto: 'otros',
  deducible: 'preguntar',
  descripcion: '',
  proveedor: '',
  num_factura: '',
  fecha_factura: todayAccountingDate(),
  comentario: '',
});
