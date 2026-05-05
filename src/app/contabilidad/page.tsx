'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import { useContabilidad } from '@/hooks/useContabilidad';
import { useEmpleados } from '@/hooks/useEmpleados';
import IngresoModalV2, { type IngresoFormState } from '@/components/Contabilidad/IngresoModal';
import GastoModalV2, { type GastoFormState } from '@/components/Contabilidad/GastoModal';
import TraspasoModalV2, { type TraspasoFormState } from '@/components/Contabilidad/TraspasoModal';
import {
  CajaContable,
  MovimientoContable,
  TipoMovimientoContable,
} from '@/shared/types';
import {
  accountingBoxByMethod,
  accountingBoxLabel,
  accountingMethodLabel,
  accountingTypeLabel,
  CAJAS_CONTABLES,
  formatCurrency,
  isManualMovement,
  isOperationalExpense,
  isOperationalIncome,
  todayAccountingDate,
} from '@/lib/contabilidad';

type FiltroOrigen = 'todos' | 'manual' | 'sync' | 'devolucion' | 'traspaso';

const createIngresoForm = (): IngresoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  concepto: '',
  comentario: '',
  metodo: 'efectivo',
  caja: 'efectivo',
  importeTotal: '',
  idEmpleado: '',
  esDevolucion: false,
  idMovimientoRelacionado: '',
});

const createGastoForm = (): GastoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  caja: 'santander',
  concepto: '',
  comentario: '',
  detalle: {
    tipo_gasto: 'otros',
    deducible: 'preguntar',
    descripcion: '',
    proveedor: '',
    num_factura: '',
    fecha_factura: todayAccountingDate(),
    comentario: '',
    base_imponible: 0,
    iva_pct: 21,
  },
  archivo: null,
  nombreDocumento: '',
  descripcionDocumento: '',
});

const createTraspasoForm = (): TraspasoFormState => ({
  id: null,
  fechaOperacion: todayAccountingDate(),
  desde: 'santander',
  hacia: 'bbva',
  importeTotal: '',
  comentario: '',
});

const getSourceLabel = (movimiento: MovimientoContable) => {
  if (movimiento.es_devolucion) return 'Devolución';
  if (movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida') return 'Traspaso';
  if (movimiento.id_pago) return 'Pago sync';
  return 'Manual';
};

const getEstadoPillClass = (movimiento: MovimientoContable) => {
  if (movimiento.estado === 'anulado') return 'bg-red-100 text-red-700';
  if (movimiento.es_devolucion) return 'bg-violet-100 text-violet-700';
  if (movimiento.id_pago) return 'bg-blue-100 text-blue-700';
  if (movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-surface-container-high text-on-surface-variant';
};

const getAmountTone = (movimiento: MovimientoContable) => {
  if (movimiento.estado === 'anulado') return 'text-outline';
  if (movimiento.importe_total < 0) return 'text-red-600';
  if (movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida') return 'text-red-600';
  return 'text-emerald-600';
};

export default function ContabilidadPage() {
  const {
    movimientos,
    loading,
    saving,
    error,
    createIngresoManual,
    createGasto,
    createDevolucion,
    createTraspaso,
    editarMovimientoManual,
    editarGastoManual,
    editarTraspasoManual,
    anularMovimientoManual,
    getResumenCajas,
    getResumenEfeDiario,
  } = useContabilidad();
  const { empleados, loading: empleadosLoading } = useEmpleados();

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: '' as '' | TipoMovimientoContable,
    caja: '' as '' | CajaContable,
    origen: 'todos' as FiltroOrigen,
    busqueda: '',
  });
  const [fechaEFE, setFechaEFE] = useState(todayAccountingDate());
  const [ingresoForm, setIngresoForm] = useState<IngresoFormState>(createIngresoForm());
  const [gastoForm, setGastoForm] = useState<GastoFormState>(createGastoForm());
  const [traspasoForm, setTraspasoForm] = useState<TraspasoFormState>(createTraspasoForm());

  const [isIngresoOpen, setIsIngresoOpen] = useState(false);
  const [isGastoOpen, setIsGastoOpen] = useState(false);
  const [isTraspasoOpen, setIsTraspasoOpen] = useState(false);
  const [movimientoAAnular, setMovimientoAAnular] = useState<MovimientoContable | null>(null);

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const fecha = movimiento.fecha_operacion;
    const origen = filtros.origen;
    const search = filtros.busqueda.trim().toLowerCase();
    const sourceLabel = getSourceLabel(movimiento).toLowerCase();

    if (filtros.fechaInicio && fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && fecha > filtros.fechaFin) return false;
    if (filtros.tipo && movimiento.tipo !== filtros.tipo) return false;
    if (filtros.caja && movimiento.caja !== filtros.caja) return false;
    if (origen === 'manual' && (!isManualMovement(movimiento) || movimiento.es_devolucion || movimiento.tipo.includes('traspaso'))) {
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
        accountingMethodLabel(movimiento.metodo),
        accountingBoxLabel(movimiento.caja),
        sourceLabel,
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
  const resumenCajas = getResumenCajas();
  const resumenEFE = getResumenEfeDiario(fechaEFE);

  const totalGastoFormulario = Number(
    (
      Number(gastoForm.detalle.base_imponible || 0) +
      (Number(gastoForm.detalle.base_imponible || 0) * Number(gastoForm.detalle.iva_pct || 0)) / 100
    ).toFixed(2)
  );

  const resetIngreso = () => setIngresoForm(createIngresoForm());
  const resetGasto = () => setGastoForm(createGastoForm());
  const resetTraspaso = () => setTraspasoForm(createTraspasoForm());

  const abrirNuevoIngreso = () => {
    resetIngreso();
    setIsIngresoOpen(true);
  };

  const abrirNuevoGasto = () => {
    resetGasto();
    setIsGastoOpen(true);
  };

  const abrirNuevoTraspaso = () => {
    resetTraspaso();
    setIsTraspasoOpen(true);
  };

  const handleGuardarIngreso = async () => {
    const importe = Number(ingresoForm.importeTotal);
    const cajaSugerida = accountingBoxByMethod(ingresoForm.metodo);

    if (!ingresoForm.concepto.trim() || !Number.isFinite(importe) || importe <= 0) {
      toast.error('Revisa concepto e importe del ingreso');
      return;
    }

    if (ingresoForm.caja !== cajaSugerida && !ingresoForm.comentario.trim()) {
      toast.error('Si cambias la caja sugerida, añade una justificación');
      return;
    }

    const payload = {
      fechaOperacion: ingresoForm.fechaOperacion,
      concepto: ingresoForm.concepto,
      comentario: ingresoForm.comentario,
      metodo: ingresoForm.metodo,
      caja: ingresoForm.caja,
      importeTotal: importe,
      idEmpleado: ingresoForm.idEmpleado || null,
      esDevolucion: ingresoForm.esDevolucion,
      idMovimientoRelacionado: ingresoForm.idMovimientoRelacionado || null,
    };

    const result = ingresoForm.id
      ? await editarMovimientoManual({
          id: ingresoForm.id,
          fechaOperacion: payload.fechaOperacion,
          concepto: payload.concepto,
          comentario: payload.comentario,
          metodo: payload.metodo,
          caja: payload.caja,
          importeTotal: payload.importeTotal,
          idEmpleado: payload.idEmpleado,
          esDevolucion: payload.esDevolucion,
          idMovimientoRelacionado: payload.idMovimientoRelacionado,
        })
      : ingresoForm.esDevolucion
        ? await createDevolucion(payload)
        : await createIngresoManual(payload);

    if (result.success) {
      toast.success(ingresoForm.id ? 'Movimiento actualizado' : ingresoForm.esDevolucion ? 'Devolución registrada' : 'Ingreso registrado');
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
      caja: gastoForm.caja,
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

    if (!Number.isFinite(importe) || importe <= 0 || traspasoForm.desde === traspasoForm.hacia) {
      toast.error('Revisa las cajas y el importe del traspaso');
      return;
    }

    const result = traspasoForm.id
      ? await editarTraspasoManual({
          id: traspasoForm.id,
          fechaOperacion: traspasoForm.fechaOperacion,
          desde: traspasoForm.desde,
          hacia: traspasoForm.hacia,
          importeTotal: importe,
          comentario: traspasoForm.comentario,
        })
      : await createTraspaso({
          fechaOperacion: traspasoForm.fechaOperacion,
          desde: traspasoForm.desde,
          hacia: traspasoForm.hacia,
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
      metodo: movimiento.metodo || 'otro',
      caja: movimiento.caja,
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
      caja: movimiento.caja,
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
      desde: salida.caja,
      hacia: entrada.caja,
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
      metodo: movimiento.metodo || 'otro',
      caja: movimiento.caja,
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

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
        <div className="page-container">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="page-container space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Contabilidad</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Libro contable real en Supabase con trazabilidad de pagos, gastos, devoluciones, traspasos y documentos.
            </p>
          </div>
          <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap">
            <Button
              variant="primary"
              type="button"
              onClick={abrirNuevoIngreso}
              className="primary-gradient min-h-11 shrink-0 whitespace-nowrap rounded-full border border-primary-light/10 px-3.5 py-2 text-[13px] font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Nuevo ingreso
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={abrirNuevoGasto}
              className="primary-gradient min-h-11 shrink-0 whitespace-nowrap rounded-full border border-primary-light/10 px-3.5 py-2 text-[13px] font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Nuevo gasto
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={abrirNuevoTraspaso}
              className="primary-gradient min-h-11 shrink-0 whitespace-nowrap rounded-full border border-primary-light/10 px-3.5 py-2 text-[13px] font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
              icon={<PlusIcon className="h-3.5 w-3.5" />}
            >
              Nuevo traspaso
            </Button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Ingresos operativos</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-emerald-600">{formatCurrency(ingresosOperativos)}</p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Gastos operativos</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-red-600">{formatCurrency(gastosOperativos)}</p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
            <p className="text-sm font-medium text-outline">Saldo operativo</p>
            <p className={`mt-2 font-headline text-3xl font-extrabold ${saldoOperativo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(saldoOperativo)}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">Vista de cajas</h2>
            </header>
            <div className="space-y-3 p-6">
              {resumenCajas.map((resumen) => (
                <div key={resumen.caja} className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-on-surface">{accountingBoxLabel(resumen.caja)}</span>
                    <span className={`font-bold ${resumen.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(resumen.saldo)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-on-surface-variant md:grid-cols-2">
                    <span>Ingresos operativos {formatCurrency(resumen.ingresos_operativos)}</span>
                    <span className="md:text-right">Gastos operativos {formatCurrency(resumen.gastos_operativos)}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">Gestión EFE por día</h2>
            </header>
            <div className="space-y-4 p-6">
              <label className="block text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Fecha</span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={fechaEFE}
                  onChange={(e) => setFechaEFE(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Ingresos</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(resumenEFE.ingresos)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Gastos</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(resumenEFE.gastos)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <p className="text-sm text-outline">Saldo</p>
                  <p className={`mt-1 text-2xl font-bold ${resumenEFE.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(resumenEFE.saldo)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-outline">Bizum Alfonso</p>
                  <p className="mt-1 font-semibold text-on-surface">{formatCurrency(resumenEFE.bizum_alfonso)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-outline">Bizum Robe</p>
                  <p className="mt-1 font-semibold text-on-surface">{formatCurrency(resumenEFE.bizum_robe)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-outline">Tarjeta</p>
                  <p className="mt-1 font-semibold text-on-surface">{formatCurrency(resumenEFE.tarjeta)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-outline">Transferencia</p>
                  <p className="mt-1 font-semibold text-on-surface">{formatCurrency(resumenEFE.transferencia)}</p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <header className="border-b border-outline-variant/20 px-6 py-4">
            <h2 className="font-headline text-xl font-extrabold text-primary-dark">Movimientos contables</h2>
          </header>

          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Desde</span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                />
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Hasta</span>
                <input
                  type="date"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
                />
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Tipo</span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.tipo}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, tipo: e.target.value as '' | TipoMovimientoContable }))}
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                  <option value="traspaso_entrada">Traspaso entrada</option>
                  <option value="traspaso_salida">Traspaso salida</option>
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Caja</span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.caja}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, caja: e.target.value as '' | CajaContable }))}
                >
                  <option value="">Todas</option>
                  {CAJAS_CONTABLES.map((caja) => (
                    <option key={caja.value} value={caja.value}>
                      {caja.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Origen</span>
                <select
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.origen}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, origen: e.target.value as FiltroOrigen }))}
                >
                  <option value="todos">Todos</option>
                  <option value="manual">Manuales</option>
                  <option value="sync">Sincronizados</option>
                  <option value="devolucion">Devoluciones</option>
                  <option value="traspaso">Traspasos</option>
                </select>
              </label>

              <label className="text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Buscar</span>
                <input
                  type="text"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
                  placeholder="Concepto, caja, método..."
                />
              </label>
            </div>

            {loading ? (
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-10 text-center text-sm text-outline">
                Cargando movimientos contables...
              </div>
            ) : (
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low/70 backdrop-blur-md">
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Fecha</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Tipo</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Caja</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Concepto</th>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline">Método / IVA</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.12em] text-outline">Importe</th>
                      <th className="px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.12em] text-outline">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientosFiltrados.map((movimiento, index) => {
                      const esTraspaso = movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida';
                      const puedeEditar = isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                      const puedeRegistrarDevolucion =
                        movimiento.estado === 'confirmado' &&
                        movimiento.tipo === 'ingreso' &&
                        !movimiento.es_devolucion &&
                        movimiento.importe_total > 0;

                      return (
                        <tr
                          key={movimiento.id}
                          className={`border-b border-outline-variant/10 transition ${
                            index % 2 ? 'bg-surface-container-low/25 hover:bg-surface-container-low' : 'hover:bg-surface-container-low'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-on-surface-variant">{movimiento.fecha_operacion}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                                {accountingTypeLabel(movimiento.tipo)}
                              </span>
                              <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoPillClass(movimiento)}`}>
                                {getSourceLabel(movimiento)}
                              </span>
                              {movimiento.estado === 'anulado' ? (
                                <span className="inline-flex w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  Anulado
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">{accountingBoxLabel(movimiento.caja)}</td>
                          <td className="px-4 py-3 text-sm text-on-surface">
                            <p className="font-semibold">{movimiento.concepto}</p>
                            {movimiento.empleado ? (
                              <p className="text-xs text-on-surface-variant">
                                Empleado: {movimiento.empleado.nombre} {movimiento.empleado.apellidos}
                              </p>
                            ) : null}
                            {movimiento.comentario ? <p className="text-xs text-on-surface-variant">{movimiento.comentario}</p> : null}
                            {movimiento.gasto?.proveedor ? (
                              <p className="text-xs text-on-surface-variant">
                                Proveedor: {movimiento.gasto.proveedor}
                                {movimiento.gasto.num_factura ? ` · Factura ${movimiento.gasto.num_factura}` : ''}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface-variant">
                            <p>{accountingMethodLabel(movimiento.metodo)}</p>
                            <p className="text-xs text-outline">IVA {movimiento.iva_pct}%</p>
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
                            <span className={getAmountTone(movimiento)}>{formatCurrency(movimiento.importe_total)}</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap justify-end gap-2">
                              {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'gasto' ? (
                                <button
                                  type="button"
                                  onClick={() => cargarGastoEnFormulario(movimiento)}
                                  className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                                >
                                  Editar
                                </button>
                              ) : null}

                              {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'ingreso' ? (
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

            {!loading ? (
              <div className="space-y-3 md:hidden">
                {movimientosFiltrados.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                    No hay movimientos para los filtros actuales.
                  </div>
                ) : (
                  movimientosFiltrados.map((movimiento) => {
                    const esTraspaso = movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida';
                    const puedeEditar = isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                    const puedeRegistrarDevolucion =
                      movimiento.estado === 'confirmado' &&
                      movimiento.tipo === 'ingreso' &&
                      !movimiento.es_devolucion &&
                      movimiento.importe_total > 0;

                    return (
                      <div
                        key={movimiento.id}
                        className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-on-surface">{movimiento.concepto}</p>
                            <p className="mt-1 text-sm text-on-surface-variant">{movimiento.fecha_operacion}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoPillClass(movimiento)}`}>
                            {getSourceLabel(movimiento)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                            {accountingTypeLabel(movimiento.tipo)}
                          </span>
                          {movimiento.estado === 'anulado' ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Anulado
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-on-surface-variant">
                          <p>Caja: {accountingBoxLabel(movimiento.caja)}</p>
                          <p>Método: {accountingMethodLabel(movimiento.metodo)}</p>
                          <p>IVA: {movimiento.iva_pct}%</p>
                          <p className={`font-bold ${getAmountTone(movimiento)}`}>{formatCurrency(movimiento.importe_total)}</p>
                          {movimiento.comentario ? <p>{movimiento.comentario}</p> : null}
                          {movimiento.documentos?.[0] ? (
                            <a
                              href={movimiento.documentos[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary hover:underline"
                            >
                              Ver documento
                            </a>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'gasto' ? (
                            <button
                              type="button"
                              onClick={() => cargarGastoEnFormulario(movimiento)}
                              className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                            >
                              Editar gasto
                            </button>
                          ) : null}

                          {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'ingreso' ? (
                            <button
                              type="button"
                              onClick={() => cargarIngresoEnFormulario(movimiento)}
                              className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                            >
                              Editar ingreso
                            </button>
                          ) : null}

                          {puedeEditar && esTraspaso && movimiento.tipo === 'traspaso_salida' ? (
                            <button
                              type="button"
                              onClick={() => cargarTraspasoEnFormulario(movimiento)}
                              className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                            >
                              Editar traspaso
                            </button>
                          ) : null}

                          {puedeRegistrarDevolucion ? (
                            <button
                              type="button"
                              onClick={() => prepararDevolucion(movimiento)}
                              className="min-h-11 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                              Registrar devolución
                            </button>
                          ) : null}

                          {puedeEditar && (!esTraspaso || movimiento.tipo === 'traspaso_salida') ? (
                            <button
                              type="button"
                              onClick={() => setMovimientoAAnular(movimiento)}
                              className="min-h-11 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              Anular movimiento
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </section>

        <IngresoModalV2
          isOpen={isIngresoOpen}
          onClose={() => setIsIngresoOpen(false)}
          form={ingresoForm}
          setForm={setIngresoForm}
          movimientos={movimientos}
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
