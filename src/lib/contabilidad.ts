import {
  CajaContable,
  CuentaContable,
  DetalleGastoContable,
  LegacyMetodoPagoCode,
  MetodoPagoContable,
  MovimientoContable,
  ResumenCuentaContable,
  ResumenEfeCuenta,
  ResumenEfeDiario,
  SaldoInicialContable,
  TipoGastoContable,
  TipoMovimientoContable,
} from '@/shared/types';

export const LEGACY_ACCOUNT_LABELS: Record<CajaContable, string> = {
  efectivo: 'Caja Efectivo',
  santander: 'Banco Santander',
  bbva: 'Banco BBVA',
  personal: 'Caja Personal',
};

export const LEGACY_PAYMENT_METHOD_LABELS: Record<LegacyMetodoPagoCode, string> = {
  efectivo: 'Efectivo',
  tpv: 'Tarjeta / TPV',
  tpv_online: 'Tarjeta Online',
  bizum_alfonso: 'Bizum Alfonso',
  bizum_robe: 'Bizum Robe',
  bizum_alba: 'Bizum Alba',
  bizum_maria: 'Bizum María',
  bizum_jm: 'Bizum JM',
  angeles: 'Ángeles',
  transferencia: 'Transferencia',
};

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

export const IVA_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 4, label: '4%' },
  { value: 10, label: '10%' },
  { value: 21, label: '21%' },
  { value: -1, label: 'Otro' },
];

export const todayAccountingDate = () => new Date().toISOString().slice(0, 10);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);

export const paymentMethodCodeLabel = (code?: string | null) => {
  if (!code) return '-';
  return LEGACY_PAYMENT_METHOD_LABELS[code as LegacyMetodoPagoCode] || code;
};

export const accountingMethodLabel = (code?: string | null) =>
  paymentMethodCodeLabel(code === 'tarjeta' ? 'tpv' : code);

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

export const legacyAccountLabel = (code?: CajaContable | null) => {
  if (!code) return '-';
  return LEGACY_ACCOUNT_LABELS[code] || code;
};

export const sortBanks = <T extends { orden?: number; nombre?: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const orderDiff = Number(a.orden || 0) - Number(b.orden || 0);
    if (orderDiff !== 0) return orderDiff;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
  });

export const sortAccounts = <T extends { orden?: number; nombre?: string }>(items: T[]) => sortBanks(items);

export const sortPaymentMethods = <T extends { orden?: number; nombre?: string }>(items: T[]) => sortBanks(items);

export const findAccountByCode = (accounts: CuentaContable[], code?: string | null) =>
  accounts.find((account) => account.codigo === code) || null;

export const findMethodByCode = (methods: MetodoPagoContable[], code?: string | null) =>
  methods.find((method) => method.codigo === code) || null;

export const accountLabel = (account?: CuentaContable | null, fallbackCode?: string | null) => {
  if (account?.nombre) return account.nombre;
  if (fallbackCode) return legacyAccountLabel(fallbackCode as CajaContable);
  return '-';
};

export const paymentMethodLabel = (
  method?: MetodoPagoContable | null,
  fallbackCode?: string | null
) => {
  if (method?.nombre) return method.nombre;
  if (fallbackCode) return paymentMethodCodeLabel(fallbackCode);
  return '-';
};

export const isOperationalMovement = (movimiento: MovimientoContable) =>
  movimiento.estado === 'confirmado' &&
  movimiento.tipo !== 'traspaso_entrada' &&
  movimiento.tipo !== 'traspaso_salida';

export const isOperationalIncome = (movimiento: MovimientoContable) =>
  isOperationalMovement(movimiento) && movimiento.tipo === 'ingreso';

export const isOperationalExpense = (movimiento: MovimientoContable) =>
  isOperationalMovement(movimiento) && movimiento.tipo === 'gasto';

export const isManualMovement = (movimiento: MovimientoContable) => !movimiento.id_pago;

export const signedBalanceDelta = (movimiento: MovimientoContable) => {
  if (movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida') {
    return -Math.abs(movimiento.importe_total);
  }

  return Math.abs(movimiento.importe_total);
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

export const buildResumenCuentas = (
  movimientos: MovimientoContable[],
  cuentas: CuentaContable[]
): ResumenCuentaContable[] => {
  return sortAccounts(cuentas)
    .filter((cuenta) => cuenta.activo)
    .map((cuenta) => {
      const movimientosCuenta = movimientos.filter(
        (movimiento) =>
          movimiento.cuenta_id === cuenta.id &&
          movimiento.estado === 'confirmado'
      );

      const saldo = movimientosCuenta.reduce(
        (total, movimiento) => total + signedBalanceDelta(movimiento),
        0
      );

      const ingresos_operativos = movimientosCuenta
        .filter(isOperationalIncome)
        .reduce((total, movimiento) => total + movimiento.importe_total, 0);

      const gastos_operativos = movimientosCuenta
        .filter(isOperationalExpense)
        .reduce((total, movimiento) => total + movimiento.importe_total, 0);

      return {
        cuenta_id: cuenta.id,
        cuenta,
        saldo,
        ingresos_operativos,
        gastos_operativos,
      };
    });
};

const getOpeningBalanceForAccount = ({
  cuentaId,
  fecha,
  movimientos,
  saldosIniciales,
}: {
  cuentaId: string;
  fecha: string;
  movimientos: MovimientoContable[];
  saldosIniciales: SaldoInicialContable[];
}) => {
  const ajustes = saldosIniciales
    .filter((saldo) => saldo.cuenta_id === cuentaId && saldo.fecha <= fecha)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const ajusteBase = ajustes[0] || null;
  const fechaBase = ajusteBase?.fecha || null;
  const saldoBase = Number(ajusteBase?.saldo_inicial || 0);

  const movimientosPrevios = movimientos.filter((movimiento) => {
    if (movimiento.cuenta_id !== cuentaId || movimiento.estado !== 'confirmado') {
      return false;
    }

    if (fechaBase) {
      return movimiento.fecha_operacion >= fechaBase && movimiento.fecha_operacion < fecha;
    }

    return movimiento.fecha_operacion < fecha;
  });

  return Number(
    (
      saldoBase +
      movimientosPrevios.reduce((total, movimiento) => total + signedBalanceDelta(movimiento), 0)
    ).toFixed(2)
  );
};

export const buildResumenEfeDiario = (
  movimientos: MovimientoContable[],
  cuentas: CuentaContable[],
  fecha: string,
  saldosIniciales: SaldoInicialContable[]
): ResumenEfeDiario => {
  const cuentasEfe = sortAccounts(cuentas).filter(
    (cuenta) => cuenta.activo && cuenta.visible_efe
  );

  const cuentasResumen: ResumenEfeCuenta[] = cuentasEfe.map((cuenta) => {
    const movimientosDia = movimientos
      .filter(
        (movimiento) =>
          movimiento.cuenta_id === cuenta.id &&
          movimiento.fecha_operacion === fecha &&
          movimiento.estado === 'confirmado'
      )
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    const ingresos = movimientosDia
      .filter((movimiento) => movimiento.tipo === 'ingreso' || movimiento.tipo === 'traspaso_entrada')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0);

    const gastos = movimientosDia
      .filter((movimiento) => movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida')
      .reduce((total, movimiento) => total + movimiento.importe_total, 0);

    const saldo_inicial = getOpeningBalanceForAccount({
      cuentaId: cuenta.id,
      fecha,
      movimientos,
      saldosIniciales,
    });

    const saldo_cierre = Number((saldo_inicial + ingresos - gastos).toFixed(2));
    const ajuste = saldosIniciales.find(
      (saldo) => saldo.cuenta_id === cuenta.id && saldo.fecha === fecha
    );

    return {
      cuenta_id: cuenta.id,
      cuenta,
      saldo_inicial,
      ingresos,
      gastos,
      saldo_cierre,
      comentario_ajuste: ajuste?.comentario || null,
      movimientos: movimientosDia,
    };
  });

  const movimientosDia = cuentasResumen.flatMap((cuenta) => cuenta.movimientos);
  const ingresos = cuentasResumen.reduce((total, cuenta) => total + cuenta.ingresos, 0);
  const gastos = cuentasResumen.reduce((total, cuenta) => total + cuenta.gastos, 0);

  return {
    fecha,
    ingresos,
    gastos,
    saldo: Number((ingresos - gastos).toFixed(2)),
    cuentas: cuentasResumen,
    movimientos: movimientosDia.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  };
};

export const createEmptyGastoDetail = (): Omit<
  DetalleGastoContable,
  'id_movimiento_contable'
> => ({
  tipo_gasto: 'otros',
  deducible: false,
  descripcion: '',
  proveedor: '',
  num_factura: '',
  fecha_factura: todayAccountingDate(),
  comentario: '',
});
