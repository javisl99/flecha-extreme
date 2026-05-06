'use client';

import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import { useContabilidad } from '@/hooks/useContabilidad';
import { useEmpleados } from '@/hooks/useEmpleados';
import IngresoModalV2, {
  type IngresoFormState,
} from '@/components/Contabilidad/IngresoModal';
import GastoModalV2, {
  type GastoFormState,
} from '@/components/Contabilidad/GastoModal';
import TraspasoModalV2, {
  type TraspasoFormState,
} from '@/components/Contabilidad/TraspasoModal';
import {
  ClaseMetodoPagoContable,
  CuentaContable,
  MetodoPagoContable,
  MovimientoContable,
  TipoCuentaContable,
  TipoMovimientoContable,
} from '@/shared/types';
import {
  accountLabel,
  accountingTypeLabel,
  createEmptyGastoDetail,
  formatCurrency,
  isManualMovement,
  isOperationalExpense,
  isOperationalIncome,
  paymentMethodLabel,
  todayAccountingDate,
} from '@/lib/contabilidad';
import { exportContabilidadMovimientosToXlsx } from '@/lib/contabilidadExcel';

type FiltroOrigen = 'todos' | 'manual' | 'sync' | 'devolucion' | 'traspaso';

type BancoFormState = {
  id: string | null;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
};

type CuentaFormState = {
  id: string | null;
  codigo: string;
  nombre: string;
  tipo: TipoCuentaContable;
  banco_id: string;
  activo: boolean;
  visible_efe: boolean;
  orden: number;
};

type MetodoFormState = {
  id: string | null;
  codigo: string;
  nombre: string;
  clase: ClaseMetodoPagoContable;
  cuenta_liquidacion_id: string;
  activo: boolean;
  permite_pendiente: boolean;
  orden: number;
};

const findMethodIdFromMovimiento = (
  movimiento: MovimientoContable,
  findMethodByCode: (code: string) => MetodoPagoContable | null
) => {
  if (movimiento.metodo_pago_id) return movimiento.metodo_pago_id;
  if (movimiento.metodo === 'tarjeta') return findMethodByCode('tpv')?.id || '';
  if (movimiento.metodo) return findMethodByCode(movimiento.metodo)?.id || '';
  return '';
};

const findAccountIdFromMovimiento = (
  movimiento: MovimientoContable,
  findAccountByCode: (code: string) => CuentaContable | null
) => movimiento.cuenta_id || findAccountByCode(movimiento.caja)?.id || '';

const getSourceLabel = (movimiento: MovimientoContable) => {
  if (movimiento.es_devolucion) return 'Devolución';
  if (
    movimiento.tipo === 'traspaso_entrada' ||
    movimiento.tipo === 'traspaso_salida'
  ) {
    return 'Traspaso';
  }
  if (movimiento.id_pago) return 'Pago sync';
  return 'Manual';
};

const getAmountTone = (movimiento: MovimientoContable) => {
  if (movimiento.estado === 'anulado') return 'text-outline';
  if (movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida') {
    return 'text-red-600';
  }
  return 'text-emerald-600';
};

const emptyIngresoForm = (): IngresoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  concepto: '',
  comentario: '',
  metodoPagoId: '',
  cuentaId: '',
  importeTotal: '',
  idEmpleado: '',
  esDevolucion: false,
  idMovimientoRelacionado: '',
});

const emptyGastoForm = (): GastoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  cuentaId: '',
  metodoPagoId: '',
  concepto: '',
  comentario: '',
  detalle: {
    ...createEmptyGastoDetail(),
    base_imponible: 0,
    iva_pct: 21,
  },
  archivo: null,
  nombreDocumento: '',
  descripcionDocumento: '',
});

const emptyTraspasoForm = (): TraspasoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  desdeCuentaId: '',
  haciaCuentaId: '',
  importeTotal: '',
  comentario: '',
});

const emptyBancoForm = (): BancoFormState => ({
  id: null,
  codigo: '',
  nombre: '',
  activo: true,
  orden: 10,
});

const emptyCuentaForm = (): CuentaFormState => ({
  id: null,
  codigo: '',
  nombre: '',
  tipo: 'caja',
  banco_id: '',
  activo: true,
  visible_efe: true,
  orden: 10,
});

const emptyMetodoForm = (): MetodoFormState => ({
  id: null,
  codigo: '',
  nombre: '',
  clase: 'efectivo',
  cuenta_liquidacion_id: '',
  activo: true,
  permite_pendiente: false,
  orden: 10,
});

export default function ContabilidadPage() {
  const {
    movimientos,
    bancos,
    cuentas,
    metodosPago,
    pendingBizums,
    loading,
    saving,
    error,
    guardarBanco,
    toggleBancoActivo,
    guardarCuenta,
    toggleCuentaActiva,
    guardarMetodoPago,
    toggleMetodoPagoActivo,
    guardarSaldoInicialDiario,
    createIngresoManual,
    createGasto,
    createDevolucion,
    createTraspaso,
    editarMovimientoManual,
    editarGastoManual,
    editarTraspasoManual,
    anularMovimientoManual,
    completarBizumPendiente,
    cancelarBizumPendiente,
    getResumenCuentas,
    getResumenEfeDiario,
    findMethodByCode,
    findAccountByCode,
  } = useContabilidad();
  const { empleados, loading: empleadosLoading } = useEmpleados();

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: '' as '' | TipoMovimientoContable,
    cuentaId: '',
    origen: 'todos' as FiltroOrigen,
    busqueda: '',
  });
  const [fechaEFE, setFechaEFE] = useState(todayAccountingDate());
  const [ajustesEfeDraft, setAjustesEfeDraft] = useState<
    Record<string, { saldoInicial: string; comentario: string }>
  >({});

  const [ingresoForm, setIngresoForm] = useState<IngresoFormState>(emptyIngresoForm());
  const [gastoForm, setGastoForm] = useState<GastoFormState>(emptyGastoForm());
  const [traspasoForm, setTraspasoForm] = useState<TraspasoFormState>(emptyTraspasoForm());
  const [bancoForm, setBancoForm] = useState<BancoFormState>(emptyBancoForm());
  const [cuentaForm, setCuentaForm] = useState<CuentaFormState>(emptyCuentaForm());
  const [metodoForm, setMetodoForm] = useState<MetodoFormState>(emptyMetodoForm());

  const [isIngresoOpen, setIsIngresoOpen] = useState(false);
  const [isGastoOpen, setIsGastoOpen] = useState(false);
  const [isTraspasoOpen, setIsTraspasoOpen] = useState(false);
  const [movimientoAAnular, setMovimientoAAnular] = useState<MovimientoContable | null>(null);

  const activeAccounts = useMemo(() => cuentas.filter((cuenta) => cuenta.activo), [cuentas]);
  const activePaymentMethods = useMemo(
    () => metodosPago.filter((metodo) => metodo.activo),
    [metodosPago]
  );

  const buildDefaultIngresoForm = (): IngresoFormState => {
    const efectivo = findMethodByCode('efectivo');
    return {
      ...emptyIngresoForm(),
      metodoPagoId: efectivo?.id || activePaymentMethods[0]?.id || '',
      cuentaId: efectivo?.cuenta_liquidacion_id || activeAccounts[0]?.id || '',
    };
  };

  const buildDefaultGastoForm = (): GastoFormState => {
    const transferencia = findMethodByCode('transferencia');
    return {
      ...emptyGastoForm(),
      metodoPagoId: transferencia?.id || activePaymentMethods[0]?.id || '',
      cuentaId: transferencia?.cuenta_liquidacion_id || activeAccounts[0]?.id || '',
    };
  };

  const buildDefaultTraspasoForm = (): TraspasoFormState => {
    const cuentaEfectivo = findAccountByCode('efectivo');
    const cuentaPersonal = findAccountByCode('personal');
    return {
      ...emptyTraspasoForm(),
      desdeCuentaId: cuentaEfectivo?.id || activeAccounts[0]?.id || '',
      haciaCuentaId: cuentaPersonal?.id || activeAccounts[1]?.id || '',
    };
  };

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const fecha = movimiento.fecha_operacion;
    const origen = filtros.origen;
    const search = filtros.busqueda.trim().toLowerCase();
    const sourceLabel = getSourceLabel(movimiento).toLowerCase();

    if (filtros.fechaInicio && fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && fecha > filtros.fechaFin) return false;
    if (filtros.tipo && movimiento.tipo !== filtros.tipo) return false;
    if (filtros.cuentaId && movimiento.cuenta_id !== filtros.cuentaId) return false;
    if (
      origen === 'manual' &&
      (!isManualMovement(movimiento) ||
        movimiento.es_devolucion ||
        movimiento.tipo.includes('traspaso'))
    ) {
      return false;
    }
    if (origen === 'sync' && !movimiento.id_pago) return false;
    if (origen === 'devolucion' && !movimiento.es_devolucion) return false;
    if (origen === 'traspaso' && !movimiento.tipo.includes('traspaso')) return false;

    if (
      search &&
      ![
        movimiento.concepto,
        movimiento.comentario || '',
        paymentMethodLabel(
          movimiento.metodo_pago,
          movimiento.metodo_pago?.codigo || movimiento.metodo || null
        ),
        accountLabel(movimiento.cuenta, movimiento.caja),
        sourceLabel,
        movimiento.gasto?.proveedor || '',
        movimiento.gasto?.num_factura || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }

    return true;
  });

  const ingresosOperativos = movimientosFiltrados
    .filter(isOperationalIncome)
    .reduce((total, movimiento) => total + movimiento.importe_total, 0);
  const gastosOperativos = movimientosFiltrados
    .filter(isOperationalExpense)
    .reduce((total, movimiento) => total + movimiento.importe_total, 0);
  const saldoOperativo = ingresosOperativos - gastosOperativos;
  const resumenCuentas = getResumenCuentas();
  const resumenEFE = getResumenEfeDiario(fechaEFE);

  const totalGastoFormulario = Number(
    (
      Number(gastoForm.detalle.base_imponible || 0) +
      (Number(gastoForm.detalle.base_imponible || 0) * Number(gastoForm.detalle.iva_pct || 0)) /
        100
    ).toFixed(2)
  );

  const resetIngreso = () => setIngresoForm(buildDefaultIngresoForm());
  const resetGasto = () => setGastoForm(buildDefaultGastoForm());
  const resetTraspaso = () => setTraspasoForm(buildDefaultTraspasoForm());
  const resetBanco = () => setBancoForm(emptyBancoForm());
  const resetCuenta = () => setCuentaForm(emptyCuentaForm());
  const resetMetodo = () => setMetodoForm(emptyMetodoForm());

  const abrirNuevoIngreso = () => {
    setIngresoForm(buildDefaultIngresoForm());
    setIsIngresoOpen(true);
  };

  const abrirNuevoGasto = () => {
    setGastoForm(buildDefaultGastoForm());
    setIsGastoOpen(true);
  };

  const abrirNuevoTraspaso = (quick = false) => {
    const nextForm = buildDefaultTraspasoForm();
    if (quick) {
      nextForm.desdeCuentaId = findAccountByCode('efectivo')?.id || nextForm.desdeCuentaId;
      nextForm.haciaCuentaId = findAccountByCode('personal')?.id || nextForm.haciaCuentaId;
    }
    setTraspasoForm(nextForm);
    setIsTraspasoOpen(true);
  };

  const handleGuardarIngreso = async () => {
    const importe = Number(ingresoForm.importeTotal);

    if (
      !ingresoForm.concepto.trim() ||
      !Number.isFinite(importe) ||
      importe <= 0 ||
      !ingresoForm.metodoPagoId ||
      !ingresoForm.cuentaId
    ) {
      toast.error('Revisa concepto, método, cuenta e importe del ingreso');
      return;
    }

    const payload = {
      fechaOperacion: ingresoForm.fechaOperacion,
      concepto: ingresoForm.concepto,
      comentario: ingresoForm.comentario,
      metodoPagoId: ingresoForm.metodoPagoId,
      cuentaId: ingresoForm.cuentaId,
      importeTotal: importe,
      idEmpleado: ingresoForm.idEmpleado || null,
      esDevolucion: ingresoForm.esDevolucion,
      idMovimientoRelacionado: ingresoForm.idMovimientoRelacionado || null,
    };

    const result = ingresoForm.id
      ? await editarMovimientoManual({
          id: ingresoForm.id,
          ...payload,
        })
      : ingresoForm.esDevolucion
        ? await createDevolucion(payload)
        : await createIngresoManual(payload);

    if (result.success) {
      toast.success(
        ingresoForm.id
          ? 'Movimiento actualizado'
          : ingresoForm.esDevolucion
            ? 'Devolución registrada'
            : 'Ingreso registrado'
      );
      resetIngreso();
      setIsIngresoOpen(false);
    } else {
      toast.error(result.error || 'No se pudo guardar el ingreso');
    }
  };

  const handleGuardarGasto = async () => {
    const baseImponible = Number(gastoForm.detalle.base_imponible);
    const ivaPct = Number(gastoForm.detalle.iva_pct);

    if (
      !gastoForm.concepto.trim() ||
      !gastoForm.detalle.descripcion.trim() ||
      !gastoForm.detalle.proveedor.trim() ||
      !gastoForm.metodoPagoId ||
      !gastoForm.cuentaId ||
      !Number.isFinite(baseImponible) ||
      baseImponible <= 0 ||
      !Number.isFinite(ivaPct) ||
      ivaPct < 0
    ) {
      toast.error('Completa los datos obligatorios del gasto');
      return;
    }

    const payload = {
      fechaOperacion: gastoForm.fechaOperacion,
      cuentaId: gastoForm.cuentaId,
      metodoPagoId: gastoForm.metodoPagoId,
      concepto: gastoForm.concepto,
      comentario: gastoForm.comentario,
      detalle: {
        ...gastoForm.detalle,
        base_imponible: baseImponible,
        iva_pct: ivaPct,
      },
      archivo: gastoForm.archivo,
      nombreDocumento: gastoForm.nombreDocumento,
      descripcionDocumento: gastoForm.descripcionDocumento,
    };

    const result = gastoForm.id
      ? await editarGastoManual({
          id: gastoForm.id,
          ...payload,
        })
      : await createGasto(payload);

    if (result.success) {
      toast.success(gastoForm.id ? 'Gasto actualizado' : 'Gasto registrado');
      resetGasto();
      setIsGastoOpen(false);
    } else {
      toast.error(result.error || 'No se pudo guardar el gasto');
    }
  };

  const handleGuardarTraspaso = async () => {
    const importe = Number(traspasoForm.importeTotal);

    if (
      !Number.isFinite(importe) ||
      importe <= 0 ||
      !traspasoForm.desdeCuentaId ||
      !traspasoForm.haciaCuentaId ||
      traspasoForm.desdeCuentaId === traspasoForm.haciaCuentaId
    ) {
      toast.error('Revisa las cuentas y el importe del traspaso');
      return;
    }

    const result = traspasoForm.id
      ? await editarTraspasoManual({
          id: traspasoForm.id,
          fechaOperacion: traspasoForm.fechaOperacion,
          desdeCuentaId: traspasoForm.desdeCuentaId,
          haciaCuentaId: traspasoForm.haciaCuentaId,
          importeTotal: importe,
          comentario: traspasoForm.comentario,
        })
      : await createTraspaso({
          fechaOperacion: traspasoForm.fechaOperacion,
          desdeCuentaId: traspasoForm.desdeCuentaId,
          haciaCuentaId: traspasoForm.haciaCuentaId,
          importeTotal: importe,
          comentario: traspasoForm.comentario,
        });

    if (result.success) {
      toast.success(traspasoForm.id ? 'Traspaso actualizado' : 'Traspaso registrado');
      resetTraspaso();
      setIsTraspasoOpen(false);
    } else {
      toast.error(result.error || 'No se pudo guardar el traspaso');
    }
  };

  const cargarIngresoEnFormulario = (movimiento: MovimientoContable) => {
    setIngresoForm({
      id: movimiento.id,
      fechaOperacion: movimiento.fecha_operacion,
      concepto: movimiento.concepto,
      comentario: movimiento.comentario || '',
      metodoPagoId: findMethodIdFromMovimiento(movimiento, findMethodByCode),
      cuentaId: findAccountIdFromMovimiento(movimiento, findAccountByCode),
      importeTotal: String(Math.abs(movimiento.importe_total)),
      idEmpleado: movimiento.id_empleado || '',
      esDevolucion: movimiento.es_devolucion,
      idMovimientoRelacionado: movimiento.id_movimiento_relacionado || '',
    });
    setIsIngresoOpen(true);
  };

  const cargarGastoEnFormulario = (movimiento: MovimientoContable) => {
    if (!movimiento.gasto) return;

    setGastoForm({
      id: movimiento.id,
      fechaOperacion: movimiento.fecha_operacion,
      cuentaId: findAccountIdFromMovimiento(movimiento, findAccountByCode),
      metodoPagoId: findMethodIdFromMovimiento(movimiento, findMethodByCode),
      concepto: movimiento.concepto,
      comentario: movimiento.comentario || '',
      detalle: {
        ...movimiento.gasto,
        base_imponible: movimiento.base_imponible,
        iva_pct: movimiento.iva_pct,
      },
      archivo: null,
      nombreDocumento: movimiento.documentos?.[0]?.nombre || '',
      descripcionDocumento: movimiento.documentos?.[0]?.descripcion || '',
    });
    setIsGastoOpen(true);
  };

  const cargarTraspasoEnFormulario = (movimiento: MovimientoContable) => {
    const salida =
      movimiento.tipo === 'traspaso_salida'
        ? movimiento
        : movimientos.find((item) => item.id === movimiento.id_movimiento_relacionado) || movimiento;

    const entrada = salida.id_movimiento_relacionado
      ? movimientos.find((item) => item.id === salida.id_movimiento_relacionado)
      : null;

    if (!entrada) return;

    setTraspasoForm({
      id: salida.id,
      fechaOperacion: salida.fecha_operacion,
      desdeCuentaId: salida.cuenta_id || '',
      haciaCuentaId: entrada.cuenta_id || '',
      importeTotal: String(Math.abs(salida.importe_total)),
      comentario: salida.comentario || '',
    });
    setIsTraspasoOpen(true);
  };

  const prepararDevolucion = (movimiento: MovimientoContable) => {
    setIngresoForm({
      id: null,
      fechaOperacion: todayAccountingDate(),
      concepto: `Devolución de ${movimiento.concepto}`,
      comentario: '',
      metodoPagoId: findMethodIdFromMovimiento(movimiento, findMethodByCode),
      cuentaId: findAccountIdFromMovimiento(movimiento, findAccountByCode),
      importeTotal: String(Math.abs(movimiento.importe_total)),
      idEmpleado: movimiento.id_empleado || '',
      esDevolucion: true,
      idMovimientoRelacionado: movimiento.id,
    });
    setIsIngresoOpen(true);
  };

  const confirmarAnulacion = async () => {
    if (!movimientoAAnular) return;
    const result = await anularMovimientoManual(movimientoAAnular.id);
    if (result.success) {
      toast.success('Movimiento anulado');
      setMovimientoAAnular(null);
      return;
    }
    toast.error(result.error || 'No se pudo anular el movimiento');
  };

  const saveEfeAdjustment = async (cuentaId: string, defaultSaldo: number) => {
    const draft = ajustesEfeDraft[cuentaId];
    const saldoInicial = Number(draft?.saldoInicial ?? defaultSaldo);
    if (!Number.isFinite(saldoInicial)) {
      toast.error('Introduce un saldo inicial válido');
      return;
    }

    const result = await guardarSaldoInicialDiario({
      fecha: fechaEFE,
      cuentaId,
      saldoInicial,
      comentario: draft?.comentario || '',
    });

    if (result.success) {
      toast.success('Saldo inicial guardado');
      setAjustesEfeDraft((prev) => {
        const next = { ...prev };
        delete next[cuentaId];
        return next;
      });
      return;
    }

    toast.error(result.error || 'No se pudo guardar el saldo inicial');
  };

  const handleExportExcel = async () => {
    try {
      await exportContabilidadMovimientosToXlsx({
        movimientos: movimientosFiltrados,
        filters: {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
          tipo: filtros.tipo,
          cuenta:
            cuentas.find((cuenta) => cuenta.id === filtros.cuentaId)?.nombre || filtros.cuentaId,
          origen: filtros.origen,
          busqueda: filtros.busqueda,
        },
        fileName: `movimientos-contables-${todayAccountingDate()}.xlsx`,
      });
      toast.success('Excel exportado');
    } catch (exportError) {
      console.error('Error exportando Excel:', exportError);
      toast.error('No se pudo exportar el Excel');
    }
  };

  const handleGuardarBanco = async () => {
    if (!bancoForm.codigo.trim() || !bancoForm.nombre.trim()) {
      toast.error('Completa código y nombre del banco');
      return;
    }
    const result = await guardarBanco(bancoForm);
    if (result.success) {
      toast.success(bancoForm.id ? 'Banco actualizado' : 'Banco creado');
      resetBanco();
      return;
    }
    toast.error(result.error || 'No se pudo guardar el banco');
  };

  const handleGuardarCuenta = async () => {
    if (!cuentaForm.codigo.trim() || !cuentaForm.nombre.trim()) {
      toast.error('Completa código y nombre de la cuenta');
      return;
    }
    if (cuentaForm.tipo === 'banco' && !cuentaForm.banco_id) {
      toast.error('Selecciona el banco de la cuenta');
      return;
    }
    const result = await guardarCuenta(cuentaForm);
    if (result.success) {
      toast.success(cuentaForm.id ? 'Cuenta actualizada' : 'Cuenta creada');
      resetCuenta();
      return;
    }
    toast.error(result.error || 'No se pudo guardar la cuenta');
  };

  const handleGuardarMetodo = async () => {
    if (!metodoForm.codigo.trim() || !metodoForm.nombre.trim()) {
      toast.error('Completa código y nombre del método');
      return;
    }
    const result = await guardarMetodoPago(metodoForm);
    if (result.success) {
      toast.success(metodoForm.id ? 'Método actualizado' : 'Método creado');
      resetMetodo();
      return;
    }
    toast.error(result.error || 'No se pudo guardar el método');
  };

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
        <div className="p-6 lg:p-8">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">
              Contabilidad
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Libro contable configurable con catálogos de bancos, cuentas, métodos de pago, EFE
              diario y exportación Excel.
            </p>
          </div>
          <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={handleExportExcel}
              className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            >
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => abrirNuevoTraspaso(true)}
              className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
            >
              Caja efectivo a personal
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={abrirNuevoIngreso}
              className="primary-gradient rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Ingreso
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={abrirNuevoGasto}
              className="primary-gradient rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Gasto
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => abrirNuevoTraspaso(false)}
              className="primary-gradient rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Traspaso
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Ingresos operativos</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-emerald-600">
              {formatCurrency(ingresosOperativos)}
            </p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Gastos operativos</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-red-600">
              {formatCurrency(gastosOperativos)}
            </p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Saldo operativo</p>
            <p
              className={`mt-2 font-headline text-3xl font-extrabold ${
                saldoOperativo >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(saldoOperativo)}
            </p>
          </article>
        </section>

        <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <header className="border-b border-outline-variant/20 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                  Bizum Alfonso pendiente
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Bandeja de bizums pendientes de liquidar en Santander.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-amber-700">
                {pendingBizums.length} pendientes
              </span>
            </div>
          </header>
          <div className="p-6">
            {pendingBizums.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-8 text-center text-sm text-outline">
                No hay Bizums Alfonso pendientes ahora mismo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low/70">
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Importe
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBizums.map((bizum, index) => (
                      <tr
                        key={bizum.id}
                        className={`border-b border-outline-variant/10 ${
                          index % 2 ? 'bg-surface-container-low/25' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-sm text-on-surface-variant">
                          {new Date(bizum.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 text-sm text-on-surface">
                          {bizum.cliente
                            ? `${bizum.cliente.nombre} ${bizum.cliente.apellidos}`
                            : 'Sin cliente'}
                        </td>
                        <td className="px-4 py-3 text-sm text-on-surface">{bizum.concepto}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-on-surface">
                          {formatCurrency(bizum.importe)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await completarBizumPendiente(bizum.id);
                                if (result.success) toast.success('Bizum completado');
                                else toast.error(result.error || 'No se pudo completar el Bizum');
                              }}
                              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Completar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await cancelarBizumPendiente(bizum.id);
                                if (result.success) toast.success('Bizum cancelado');
                                else toast.error(result.error || 'No se pudo cancelar el Bizum');
                              }}
                              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                Saldo por cuentas
              </h2>
            </header>
            <div className="space-y-3 p-6">
              {resumenCuentas.map((resumen) => (
                <div
                  key={resumen.cuenta_id}
                  className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-on-surface">
                      {accountLabel(resumen.cuenta)}
                    </span>
                    <span
                      className={`font-bold ${
                        resumen.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(resumen.saldo)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-on-surface-variant md:grid-cols-2">
                    <span>Ingresos operativos {formatCurrency(resumen.ingresos_operativos)}</span>
                    <span className="md:text-right">
                      Gastos operativos {formatCurrency(resumen.gastos_operativos)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                    Gestión EFE por día
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Saldo inicial automático desde el histórico y ajuste manual por cuenta.
                  </p>
                </div>
                <label className="text-sm text-on-surface">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                    Fecha
                  </span>
                  <input
                    type="date"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={fechaEFE}
                    onChange={(e) => {
                      setFechaEFE(e.target.value);
                      setAjustesEfeDraft({});
                    }}
                  />
                </label>
              </div>
            </header>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Ingresos</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {formatCurrency(resumenEFE.ingresos)}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Gastos</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {formatCurrency(resumenEFE.gastos)}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Saldo día</p>
                  <p
                    className={`mt-1 text-2xl font-bold ${
                      resumenEFE.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(resumenEFE.saldo)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {resumenEFE.cuentas.map((resumenCuenta) => {
                  const draft = ajustesEfeDraft[resumenCuenta.cuenta_id];
                  return (
                    <div
                      key={resumenCuenta.cuenta_id}
                      className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="font-semibold text-on-surface">
                            {accountLabel(resumenCuenta.cuenta)}
                          </h3>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-on-surface-variant md:grid-cols-4">
                            <span>Saldo inicial {formatCurrency(resumenCuenta.saldo_inicial)}</span>
                            <span>Ingresos {formatCurrency(resumenCuenta.ingresos)}</span>
                            <span>Gastos {formatCurrency(resumenCuenta.gastos)}</span>
                            <span>Saldo cierre {formatCurrency(resumenCuenta.saldo_cierre)}</span>
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 lg:max-w-xl lg:grid-cols-[1fr_1.3fr_auto]">
                          <input
                            type="number"
                            step="0.01"
                            className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                            value={draft?.saldoInicial ?? String(resumenCuenta.saldo_inicial)}
                            onChange={(e) =>
                              setAjustesEfeDraft((prev) => ({
                                ...prev,
                                [resumenCuenta.cuenta_id]: {
                                  saldoInicial: e.target.value,
                                  comentario:
                                    prev[resumenCuenta.cuenta_id]?.comentario ||
                                    resumenCuenta.comentario_ajuste ||
                                    '',
                                },
                              }))
                            }
                            placeholder="Saldo inicial"
                          />
                          <input
                            type="text"
                            className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                            value={draft?.comentario ?? resumenCuenta.comentario_ajuste ?? ''}
                            onChange={(e) =>
                              setAjustesEfeDraft((prev) => ({
                                ...prev,
                                [resumenCuenta.cuenta_id]: {
                                  saldoInicial:
                                    prev[resumenCuenta.cuenta_id]?.saldoInicial ||
                                    String(resumenCuenta.saldo_inicial),
                                  comentario: e.target.value,
                                },
                              }))
                            }
                            placeholder="Comentario del ajuste"
                          />
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() =>
                              saveEfeAdjustment(
                                resumenCuenta.cuenta_id,
                                resumenCuenta.saldo_inicial
                              )
                            }
                            className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <header className="border-b border-outline-variant/20 px-6 py-4">
            <h2 className="font-headline text-xl font-extrabold text-primary-dark">
              Movimientos contables
            </h2>
          </header>

          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Desde
                </span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                />
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Hasta
                </span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
                />
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Tipo
                </span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.tipo}
                  onChange={(e) =>
                    setFiltros((prev) => ({
                      ...prev,
                      tipo: e.target.value as '' | TipoMovimientoContable,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                  <option value="traspaso_entrada">Traspaso entrada</option>
                  <option value="traspaso_salida">Traspaso salida</option>
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Cuenta
                </span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.cuentaId}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, cuentaId: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {cuentas.map((cuenta) => (
                    <option key={cuenta.id} value={cuenta.id}>
                      {accountLabel(cuenta)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Origen
                </span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.origen}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, origen: e.target.value as FiltroOrigen }))
                  }
                >
                  <option value="todos">Todos</option>
                  <option value="manual">Manuales</option>
                  <option value="sync">Sincronizados</option>
                  <option value="devolucion">Devoluciones</option>
                  <option value="traspaso">Traspasos</option>
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  Buscar
                </span>
                <input
                  type="text"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
                  placeholder="Concepto, proveedor, factura..."
                />
              </label>
            </div>

            {loading ? (
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-10 text-center text-sm text-outline">
                Cargando movimientos contables...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low/70 backdrop-blur-md">
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Cuenta
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Método / fiscalidad
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Importe
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosFiltrados.map((movimiento, index) => {
                      const esTraspaso =
                        movimiento.tipo === 'traspaso_entrada' ||
                        movimiento.tipo === 'traspaso_salida';
                      const puedeEditar =
                        isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                      const puedeRegistrarDevolucion =
                        movimiento.estado === 'confirmado' &&
                        movimiento.tipo === 'ingreso' &&
                        !movimiento.es_devolucion &&
                        movimiento.importe_total > 0;

                      return (
                        <tr
                          key={movimiento.id}
                          className={`border-b border-outline-variant/10 transition ${
                            index % 2
                              ? 'bg-surface-container-low/25 hover:bg-surface-container-low'
                              : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            {movimiento.fecha_operacion}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                                {accountingTypeLabel(movimiento.tipo)}
                              </span>
                              <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {getSourceLabel(movimiento)}
                              </span>
                              {movimiento.estado === 'anulado' ? (
                                <span className="inline-flex w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  Anulado
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            <p>{accountLabel(movimiento.cuenta, movimiento.caja)}</p>
                            <p className="text-xs text-outline">
                              {movimiento.cuenta?.banco?.nombre || movimiento.cuenta?.tipo || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface">
                            <p className="font-semibold">{movimiento.concepto}</p>
                            {movimiento.empleado ? (
                              <p className="text-xs text-on-surface-variant">
                                Empleado: {movimiento.empleado.nombre} {movimiento.empleado.apellidos}
                              </p>
                            ) : null}
                            {movimiento.comentario ? (
                              <p className="text-xs text-on-surface-variant">{movimiento.comentario}</p>
                            ) : null}
                            {movimiento.gasto?.proveedor ? (
                              <p className="text-xs text-on-surface-variant">
                                Proveedor: {movimiento.gasto.proveedor}
                                {movimiento.gasto.num_factura
                                  ? ` · Factura ${movimiento.gasto.num_factura}`
                                  : ''}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            <p>
                              {paymentMethodLabel(
                                movimiento.metodo_pago,
                                movimiento.metodo_pago?.codigo || movimiento.metodo || null
                              )}
                            </p>
                            <p className="text-xs text-outline">
                              Base {formatCurrency(movimiento.base_imponible)} · IVA {movimiento.iva_pct}%
                            </p>
                            <p className="text-xs text-outline">
                              Impuesto {formatCurrency(movimiento.iva_importe)}
                            </p>
                            {movimiento.documentos?.[0] ? (
                              <a
                                href={movimiento.documentos[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Ver documento
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold">
                            <span className={getAmountTone(movimiento)}>
                              {formatCurrency(movimiento.importe_total)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              {puedeEditar && movimiento.tipo === 'gasto' ? (
                                <button
                                  type="button"
                                  onClick={() => cargarGastoEnFormulario(movimiento)}
                                  className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                                >
                                  Editar
                                </button>
                              ) : null}

                              {puedeEditar && movimiento.tipo === 'ingreso' ? (
                                <button
                                  type="button"
                                  onClick={() => cargarIngresoEnFormulario(movimiento)}
                                  className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                                >
                                  Editar
                                </button>
                              ) : null}

                              {puedeEditar && esTraspaso && movimiento.tipo === 'traspaso_salida' ? (
                                <button
                                  type="button"
                                  onClick={() => cargarTraspasoEnFormulario(movimiento)}
                                  className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                                >
                                  Editar
                                </button>
                              ) : null}

                              {puedeRegistrarDevolucion ? (
                                <button
                                  type="button"
                                  onClick={() => prepararDevolucion(movimiento)}
                                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                  Devolución
                                </button>
                              ) : null}

                              {puedeEditar && (!esTraspaso || movimiento.tipo === 'traspaso_salida') ? (
                                <button
                                  type="button"
                                  onClick={() => setMovimientoAAnular(movimiento)}
                                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Anular
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {movimientosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm font-medium text-outline">
                          No hay movimientos para los filtros actuales.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">Bancos</h2>
            </header>
            <div className="space-y-4 p-6">
              <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                <input
                  type="text"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={bancoForm.nombre}
                  onChange={(e) => setBancoForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del banco"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={bancoForm.codigo}
                    onChange={(e) => setBancoForm((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Código"
                  />
                  <input
                    type="number"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={bancoForm.orden}
                    onChange={(e) =>
                      setBancoForm((prev) => ({ ...prev, orden: Number(e.target.value) || 0 }))
                    }
                    placeholder="Orden"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={bancoForm.activo}
                    onChange={(e) => setBancoForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  Activo
                </label>
                <div className="flex justify-end gap-2">
                  {bancoForm.id ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={resetBanco}
                      className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                    >
                      Cancelar
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    type="button"
                    loading={saving}
                    onClick={handleGuardarBanco}
                    className="primary-gradient rounded-full px-4 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                  >
                    {bancoForm.id ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {bancos.map((banco) => (
                  <div
                    key={banco.id}
                    className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{banco.nombre}</p>
                        <p className="text-xs text-outline">
                          {banco.codigo} · orden {banco.orden}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          banco.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {banco.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setBancoForm({ ...banco, id: banco.id })}
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await toggleBancoActivo(banco.id, !banco.activo);
                          if (result.success) toast.success('Estado del banco actualizado');
                          else toast.error(result.error || 'No se pudo actualizar el banco');
                        }}
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        {banco.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">Cuentas</h2>
            </header>
            <div className="space-y-4 p-6">
              <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={cuentaForm.nombre}
                    onChange={(e) => setCuentaForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre de la cuenta"
                  />
                  <input
                    type="text"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={cuentaForm.codigo}
                    onChange={(e) => setCuentaForm((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Código"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={cuentaForm.tipo}
                    onChange={(e) =>
                      setCuentaForm((prev) => ({
                        ...prev,
                        tipo: e.target.value as TipoCuentaContable,
                        banco_id: e.target.value === 'banco' ? prev.banco_id : '',
                      }))
                    }
                  >
                    <option value="caja">Caja</option>
                    <option value="banco">Banco</option>
                  </select>
                  <select
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={cuentaForm.banco_id}
                    onChange={(e) => setCuentaForm((prev) => ({ ...prev, banco_id: e.target.value }))}
                    disabled={cuentaForm.tipo !== 'banco'}
                  >
                    <option value="">Sin banco</option>
                    {bancos.map((banco) => (
                      <option key={banco.id} value={banco.id}>
                        {banco.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={cuentaForm.activo}
                      onChange={(e) =>
                        setCuentaForm((prev) => ({ ...prev, activo: e.target.checked }))
                      }
                    />
                    Activa
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={cuentaForm.visible_efe}
                      onChange={(e) =>
                        setCuentaForm((prev) => ({ ...prev, visible_efe: e.target.checked }))
                      }
                    />
                    Visible en EFE
                  </label>
                </div>
                <input
                  type="number"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={cuentaForm.orden}
                  onChange={(e) =>
                    setCuentaForm((prev) => ({ ...prev, orden: Number(e.target.value) || 0 }))
                  }
                  placeholder="Orden"
                />
                <div className="flex justify-end gap-2">
                  {cuentaForm.id ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={resetCuenta}
                      className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                    >
                      Cancelar
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    type="button"
                    loading={saving}
                    onClick={handleGuardarCuenta}
                    className="primary-gradient rounded-full px-4 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                  >
                    {cuentaForm.id ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {cuentas.map((cuenta) => (
                  <div
                    key={cuenta.id}
                    className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{accountLabel(cuenta)}</p>
                        <p className="text-xs text-outline">
                          {cuenta.codigo} · {cuenta.tipo}
                          {cuenta.banco ? ` · ${cuenta.banco.nombre}` : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          cuenta.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {cuenta.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCuentaForm({
                            id: cuenta.id,
                            codigo: cuenta.codigo,
                            nombre: cuenta.nombre,
                            tipo: cuenta.tipo,
                            banco_id: cuenta.banco_id || '',
                            activo: cuenta.activo,
                            visible_efe: cuenta.visible_efe,
                            orden: cuenta.orden,
                          })
                        }
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await toggleCuentaActiva(cuenta.id, !cuenta.activo);
                          if (result.success) toast.success('Estado de la cuenta actualizado');
                          else toast.error(result.error || 'No se pudo actualizar la cuenta');
                        }}
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        {cuenta.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                Métodos de pago
              </h2>
            </header>
            <div className="space-y-4 p-6">
              <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={metodoForm.nombre}
                    onChange={(e) => setMetodoForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del método"
                  />
                  <input
                    type="text"
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={metodoForm.codigo}
                    onChange={(e) => setMetodoForm((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Código"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={metodoForm.clase}
                    onChange={(e) =>
                      setMetodoForm((prev) => ({
                        ...prev,
                        clase: e.target.value as ClaseMetodoPagoContable,
                      }))
                    }
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tpv">TPV</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="bizum">Bizum</option>
                    <option value="otro">Otro</option>
                  </select>
                  <select
                    className="h-11 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    value={metodoForm.cuenta_liquidacion_id}
                    onChange={(e) =>
                      setMetodoForm((prev) => ({
                        ...prev,
                        cuenta_liquidacion_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Sin cuenta por defecto</option>
                    {cuentas.map((cuenta) => (
                      <option key={cuenta.id} value={cuenta.id}>
                        {accountLabel(cuenta)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={metodoForm.activo}
                      onChange={(e) =>
                        setMetodoForm((prev) => ({ ...prev, activo: e.target.checked }))
                      }
                    />
                    Activo
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={metodoForm.permite_pendiente}
                      onChange={(e) =>
                        setMetodoForm((prev) => ({
                          ...prev,
                          permite_pendiente: e.target.checked,
                        }))
                      }
                    />
                    Permite pendiente
                  </label>
                </div>
                <input
                  type="number"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={metodoForm.orden}
                  onChange={(e) =>
                    setMetodoForm((prev) => ({ ...prev, orden: Number(e.target.value) || 0 }))
                  }
                  placeholder="Orden"
                />
                <div className="flex justify-end gap-2">
                  {metodoForm.id ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={resetMetodo}
                      className="rounded-full border-outline-variant/45 bg-surface-container-low px-4 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                    >
                      Cancelar
                    </Button>
                  ) : null}
                  <Button
                    variant="primary"
                    type="button"
                    loading={saving}
                    onClick={handleGuardarMetodo}
                    className="primary-gradient rounded-full px-4 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                  >
                    {metodoForm.id ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {metodosPago.map((metodo) => (
                  <div
                    key={metodo.id}
                    className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-on-surface">{paymentMethodLabel(metodo)}</p>
                        <p className="text-xs text-outline">
                          {metodo.codigo} · {metodo.clase}
                          {metodo.cuenta_liquidacion
                            ? ` · ${accountLabel(metodo.cuenta_liquidacion)}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          metodo.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {metodo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMetodoForm({
                            id: metodo.id,
                            codigo: metodo.codigo,
                            nombre: metodo.nombre,
                            clase: metodo.clase,
                            cuenta_liquidacion_id: metodo.cuenta_liquidacion_id || '',
                            activo: metodo.activo,
                            permite_pendiente: metodo.permite_pendiente,
                            orden: metodo.orden,
                          })
                        }
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await toggleMetodoPagoActivo(metodo.id, !metodo.activo);
                          if (result.success) toast.success('Estado del método actualizado');
                          else toast.error(result.error || 'No se pudo actualizar el método');
                        }}
                        className="rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                      >
                        {metodo.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <IngresoModalV2
          isOpen={isIngresoOpen}
          onClose={() => setIsIngresoOpen(false)}
          form={ingresoForm}
          setForm={setIngresoForm}
          movimientos={movimientos}
          metodosPago={metodosPago}
          cuentas={cuentas}
          empleados={empleados}
          empleadosLoading={empleadosLoading}
          saving={saving}
          onSubmit={handleGuardarIngreso}
          onReset={resetIngreso}
        />

        <GastoModalV2
          isOpen={isGastoOpen}
          onClose={() => setIsGastoOpen(false)}
          form={gastoForm}
          setForm={setGastoForm}
          cuentas={cuentas}
          metodosPago={metodosPago}
          totalGastoFormulario={totalGastoFormulario}
          saving={saving}
          onSubmit={handleGuardarGasto}
          onReset={resetGasto}
        />

        <TraspasoModalV2
          isOpen={isTraspasoOpen}
          onClose={() => setIsTraspasoOpen(false)}
          form={traspasoForm}
          setForm={setTraspasoForm}
          cuentas={cuentas}
          saving={saving}
          onSubmit={handleGuardarTraspaso}
          onReset={resetTraspaso}
        />

        <ModalConfirmacion
          isOpen={Boolean(movimientoAAnular)}
          onClose={() => setMovimientoAAnular(null)}
          onConfirm={confirmarAnulacion}
          titulo="Anular movimiento"
          mensaje={`Vas a anular "${movimientoAAnular?.concepto || 'este movimiento'}". Los traspasos anulan también su contrapartida.`}
          textoConfirmar="Anular"
          textoCancelar="Cancelar"
          variante="contabilidad-v2"
        />
      </div>
    </ProtectedRoute>
  );
}
