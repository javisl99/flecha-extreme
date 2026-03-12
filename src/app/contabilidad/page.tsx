'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Button, Card } from '@/shared/components';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import { useContabilidad, DetalleGastoFormulario } from '@/hooks/useContabilidad';
import { useEmpleados } from '@/hooks/useEmpleados';
import {
  CajaContable,
  MetodoContable,
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
  METODOS_CONTABLES,
  TIPOS_GASTO_CONTABLES,
  todayAccountingDate,
} from '@/lib/contabilidad';

type FiltroOrigen = 'todos' | 'manual' | 'sync' | 'devolucion' | 'traspaso';

type IngresoFormState = {
  id: string | null;
  fechaOperacion: string;
  concepto: string;
  comentario: string;
  metodo: MetodoContable;
  caja: CajaContable;
  importeTotal: string;
  idEmpleado: string;
  esDevolucion: boolean;
  idMovimientoRelacionado: string;
};

type GastoFormState = {
  id: string | null;
  fechaOperacion: string;
  caja: CajaContable;
  concepto: string;
  comentario: string;
  detalle: DetalleGastoFormulario;
  archivo: File | null;
  nombreDocumento: string;
  descripcionDocumento: string;
};

type TraspasoFormState = {
  id: string | null;
  fechaOperacion: string;
  desde: CajaContable;
  hacia: CajaContable;
  importeTotal: string;
  comentario: string;
};

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
  if (movimiento.es_devolucion) return 'Devolucion';
  if (movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida') return 'Traspaso';
  if (movimiento.id_pago) return 'Pago sync';
  return 'Manual';
};

const getAmountTone = (movimiento: MovimientoContable) => {
  if (movimiento.estado === 'anulado') return 'text-gray-500 dark:text-gray-400';
  if (movimiento.importe_total < 0) return 'text-red-600 dark:text-red-500';
  if (movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida') {
    return 'text-red-600 dark:text-red-500';
  }
  return 'text-green-600 dark:text-green-500';
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

  const handleGuardarIngreso = async () => {
    const importe = Number(ingresoForm.importeTotal);
    const cajaSugerida = accountingBoxByMethod(ingresoForm.metodo);

    if (!ingresoForm.concepto.trim() || !Number.isFinite(importe) || importe <= 0) {
      toast.error('Revisa concepto e importe del ingreso');
      return;
    }

    if (ingresoForm.caja !== cajaSugerida && !ingresoForm.comentario.trim()) {
      toast.error('Si cambias la caja sugerida, añade una justificacion');
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
      toast.success(ingresoForm.id ? 'Movimiento actualizado' : ingresoForm.esDevolucion ? 'Devolucion registrada' : 'Ingreso registrado');
      resetIngreso();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cargarTraspasoEnFormulario = (movimiento: MovimientoContable) => {
    const salida = movimiento.tipo === 'traspaso_salida'
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prepararDevolucion = (movimiento: MovimientoContable) => {
    setIngresoForm({
      id: null,
      fechaOperacion: todayAccountingDate(),
      concepto: `Devolucion de ${movimiento.concepto}`,
      comentario: '',
      metodo: movimiento.metodo || 'otro',
      caja: movimiento.caja,
      importeTotal: String(Math.abs(movimiento.importe_total)),
      idEmpleado: movimiento.id_empleado || '',
      esDevolucion: true,
      idMovimientoRelacionado: movimiento.id,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Contabilidad</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Libro contable real en Supabase con trazabilidad de pagos, gastos, devoluciones, traspasos y documentos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetIngreso}>
              Nuevo ingreso
            </Button>
            <Button variant="outline" onClick={resetGasto}>
              Nuevo gasto
            </Button>
            <Button variant="outline" onClick={resetTraspaso}>
              Nuevo traspaso
            </Button>
          </div>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Reglas activas: TPV a BBVA, resto de cobros no TPV a Santander, efectivo a caja. Los pagos sincronizados desde
            `pago` quedan bloqueados para edicion directa y las devoluciones se registran como ingresos negativos.
          </p>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos operativos</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(ingresosOperativos)}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos operativos</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{formatCurrency(gastosOperativos)}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo operativo</h3>
            <p className={`text-2xl font-bold ${saldoOperativo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              {formatCurrency(saldoOperativo)}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card title={ingresoForm.id ? 'Editar ingreso / devolucion' : 'Nuevo ingreso / devolucion'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.fechaOperacion}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, fechaOperacion: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Metodo
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.metodo}
                  onChange={(e) => {
                    const metodo = e.target.value as MetodoContable;
                    setIngresoForm((prev) => ({
                      ...prev,
                      metodo,
                      caja: accountingBoxByMethod(metodo),
                    }));
                  }}
                >
                  {METODOS_CONTABLES.map((metodo) => (
                    <option key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Concepto
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.concepto}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, concepto: e.target.value }))}
                  placeholder="Ej: Cobro reserva barranco"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Importe total
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.importeTotal}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, importeTotal: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Caja destino
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.caja}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, caja: e.target.value as CajaContable }))}
                >
                  {CAJAS_CONTABLES.map((caja) => (
                    <option key={caja.value} value={caja.value}>
                      {caja.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Empleado vinculado
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.idEmpleado}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, idEmpleado: e.target.value }))}
                  disabled={empleadosLoading}
                >
                  <option value="">Sin empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellidos}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Movimiento relacionado
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.idMovimientoRelacionado}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, idMovimientoRelacionado: e.target.value }))}
                >
                  <option value="">Sin relacion</option>
                  {movimientos
                    .filter((movimiento) => movimiento.estado === 'confirmado')
                    .slice(0, 50)
                    .map((movimiento) => (
                      <option key={movimiento.id} value={movimiento.id}>
                        {movimiento.fecha_operacion} · {movimiento.concepto}
                      </option>
                    ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                <input
                  type="checkbox"
                  checked={ingresoForm.esDevolucion}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, esDevolucion: e.target.checked }))}
                />
                Registrar como devolucion / reembolso
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Justificacion / comentario
                <textarea
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={ingresoForm.comentario}
                  onChange={(e) => setIngresoForm((prev) => ({ ...prev, comentario: e.target.value }))}
                />
              </label>

              <div className="md:col-span-2 flex gap-2">
                <Button className="flex-1" loading={saving} onClick={handleGuardarIngreso}>
                  {ingresoForm.id ? 'Actualizar ingreso' : ingresoForm.esDevolucion ? 'Registrar devolucion' : 'Guardar ingreso'}
                </Button>
                {ingresoForm.id && (
                  <Button variant="outline" onClick={resetIngreso}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title={gastoForm.id ? 'Editar gasto' : 'Nuevo gasto'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Fecha registro
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.fechaOperacion}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, fechaOperacion: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Caja
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.caja}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, caja: e.target.value as CajaContable }))}
                >
                  {CAJAS_CONTABLES.map((caja) => (
                    <option key={caja.value} value={caja.value}>
                      {caja.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Concepto
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.concepto}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, concepto: e.target.value }))}
                  placeholder="Ej: Factura combustible marzo"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Tipo gasto
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.tipo_gasto}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, tipo_gasto: e.target.value as DetalleGastoFormulario['tipo_gasto'] },
                    }))
                  }
                >
                  {TIPOS_GASTO_CONTABLES.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Deducible
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.deducible}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, deducible: e.target.value as DetalleGastoFormulario['deducible'] },
                    }))
                  }
                >
                  <option value="si">Si</option>
                  <option value="no">No</option>
                  <option value="preguntar">Preguntar</option>
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Descripcion gasto
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.descripcion}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, descripcion: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Proveedor
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.proveedor}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, proveedor: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Num factura
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.num_factura || ''}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, num_factura: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Fecha factura
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.fecha_factura}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, fecha_factura: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Base imponible
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.base_imponible}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, base_imponible: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                IVA %
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.iva_pct}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, iva_pct: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Total imponible
                <input
                  type="text"
                  readOnly
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-gray-100 dark:bg-gray-800 rounded-md"
                  value={formatCurrency(totalGastoFormulario)}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Comentario gasto
                <textarea
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.detalle.comentario || ''}
                  onChange={(e) =>
                    setGastoForm((prev) => ({
                      ...prev,
                      detalle: { ...prev.detalle, comentario: e.target.value },
                    }))
                  }
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Comentario interno del movimiento
                <textarea
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.comentario}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, comentario: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Nombre documento
                <input
                  type="text"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.nombreDocumento}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, nombreDocumento: e.target.value }))}
                  placeholder="Factura gasolina marzo"
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                PDF justificante
                <input
                  type="file"
                  accept=".pdf"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, archivo: e.target.files?.[0] || null }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Descripcion documento
                <textarea
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={gastoForm.descripcionDocumento}
                  onChange={(e) => setGastoForm((prev) => ({ ...prev, descripcionDocumento: e.target.value }))}
                />
              </label>

              <div className="md:col-span-2 flex gap-2">
                <Button className="flex-1" loading={saving} onClick={handleGuardarGasto}>
                  {gastoForm.id ? 'Actualizar gasto' : 'Guardar gasto'}
                </Button>
                {gastoForm.id && (
                  <Button variant="outline" onClick={resetGasto}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card title={traspasoForm.id ? 'Editar traspaso' : 'Nuevo traspaso'}>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={traspasoForm.fechaOperacion}
                  onChange={(e) => setTraspasoForm((prev) => ({ ...prev, fechaOperacion: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Desde
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={traspasoForm.desde}
                  onChange={(e) => setTraspasoForm((prev) => ({ ...prev, desde: e.target.value as CajaContable }))}
                >
                  {CAJAS_CONTABLES.map((caja) => (
                    <option key={caja.value} value={caja.value}>
                      {caja.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Hacia
                <select
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={traspasoForm.hacia}
                  onChange={(e) => setTraspasoForm((prev) => ({ ...prev, hacia: e.target.value as CajaContable }))}
                >
                  {CAJAS_CONTABLES.map((caja) => (
                    <option key={caja.value} value={caja.value}>
                      {caja.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Importe
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={traspasoForm.importeTotal}
                  onChange={(e) => setTraspasoForm((prev) => ({ ...prev, importeTotal: e.target.value }))}
                />
              </label>

              <label className="text-sm text-gray-700 dark:text-gray-300">
                Comentario
                <textarea
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                  value={traspasoForm.comentario}
                  onChange={(e) => setTraspasoForm((prev) => ({ ...prev, comentario: e.target.value }))}
                />
              </label>

              <div className="flex gap-2">
                <Button className="flex-1" loading={saving} onClick={handleGuardarTraspaso}>
                  {traspasoForm.id ? 'Actualizar traspaso' : 'Registrar traspaso'}
                </Button>
                {traspasoForm.id && (
                  <Button variant="outline" onClick={resetTraspaso}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Vista de cajas">
            <div className="space-y-3">
              {resumenCajas.map((resumen) => (
                <div
                  key={resumen.caja}
                  className="rounded-xl border border-card-border bg-white/60 dark:bg-gray-900/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{accountingBoxLabel(resumen.caja)}</span>
                    <span className={`font-semibold ${resumen.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                      {formatCurrency(resumen.saldo)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Ingresos operativos {formatCurrency(resumen.ingresos_operativos)}</span>
                    <span>Gastos operativos {formatCurrency(resumen.gastos_operativos)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Gestion EFE por dia">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Fecha
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                value={fechaEFE}
                onChange={(e) => setFechaEFE(e.target.value)}
              />
            </label>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-500">{formatCurrency(resumenEFE.ingresos)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Gastos</p>
                <p className="text-xl font-semibold text-red-600 dark:text-red-500">{formatCurrency(resumenEFE.gastos)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
                <p className={`text-xl font-semibold ${resumenEFE.saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                  {formatCurrency(resumenEFE.saldo)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-gray-500 dark:text-gray-400">Bizum Alfonso</p>
                <p className="font-semibold">{formatCurrency(resumenEFE.bizum_alfonso)}</p>
              </div>
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-gray-500 dark:text-gray-400">Bizum Robe</p>
                <p className="font-semibold">{formatCurrency(resumenEFE.bizum_robe)}</p>
              </div>
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-gray-500 dark:text-gray-400">Tarjeta</p>
                <p className="font-semibold">{formatCurrency(resumenEFE.tarjeta)}</p>
              </div>
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-gray-500 dark:text-gray-400">Transferencia</p>
                <p className="font-semibold">{formatCurrency(resumenEFE.transferencia)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Movimientos contables">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Desde
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Hasta
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Tipo
              <select
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Caja
              <select
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Origen
              <select
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
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
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Buscar
              <input
                type="text"
                className="mt-1 w-full px-3 py-2 border border-input-border bg-input-bg rounded-md"
                value={filtros.busqueda}
                onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
                placeholder="Concepto, caja, metodo..."
              />
            </label>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando movimientos contables...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-table-head-bg dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Caja</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metodo / IVA</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importe</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {movimientosFiltrados.map((movimiento) => {
                    const esTraspaso = movimiento.tipo === 'traspaso_entrada' || movimiento.tipo === 'traspaso_salida';
                    const puedeEditar = isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                    const puedeRegistrarDevolucion =
                      movimiento.estado === 'confirmado' &&
                      movimiento.tipo === 'ingreso' &&
                      !movimiento.es_devolucion &&
                      movimiento.importe_total > 0;

                    return (
                      <tr key={movimiento.id}>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{movimiento.fecha_operacion}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex rounded-md px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-fit">
                              {accountingTypeLabel(movimiento.tipo)}
                            </span>
                            <span className="inline-flex rounded-md px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 w-fit">
                              {getSourceLabel(movimiento)}
                            </span>
                            {movimiento.estado === 'anulado' && (
                              <span className="inline-flex rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 w-fit">
                                Anulado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{accountingBoxLabel(movimiento.caja)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <p className="font-medium">{movimiento.concepto}</p>
                          {movimiento.empleado && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Empleado: {movimiento.empleado.nombre} {movimiento.empleado.apellidos}
                            </p>
                          )}
                          {movimiento.comentario && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{movimiento.comentario}</p>
                          )}
                          {movimiento.gasto?.proveedor && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Proveedor: {movimiento.gasto.proveedor}
                              {movimiento.gasto.num_factura ? ` · Factura ${movimiento.gasto.num_factura}` : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <p>{accountingMethodLabel(movimiento.metodo)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">IVA {movimiento.iva_pct}%</p>
                          {movimiento.documentos?.[0] && (
                            <a
                              href={movimiento.documentos[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver documento
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          <span className={getAmountTone(movimiento)}>{formatCurrency(movimiento.importe_total)}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap justify-end gap-2">
                            {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'gasto' && (
                              <Button variant="outline" size="sm" onClick={() => cargarGastoEnFormulario(movimiento)}>
                                Editar
                              </Button>
                            )}
                            {puedeEditar && !movimiento.id_pago && movimiento.tipo === 'ingreso' && (
                              <Button variant="outline" size="sm" onClick={() => cargarIngresoEnFormulario(movimiento)}>
                                Editar
                              </Button>
                            )}
                            {puedeEditar && esTraspaso && movimiento.tipo === 'traspaso_salida' && (
                              <Button variant="outline" size="sm" onClick={() => cargarTraspasoEnFormulario(movimiento)}>
                                Editar
                              </Button>
                            )}
                            {puedeRegistrarDevolucion && (
                              <Button variant="secondary" size="sm" onClick={() => prepararDevolucion(movimiento)}>
                                Devolucion
                              </Button>
                            )}
                            {puedeEditar && (!esTraspaso || movimiento.tipo === 'traspaso_salida') && (
                              <Button variant="accent" size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setMovimientoAAnular(movimiento)}>
                                Anular
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {movimientosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay movimientos para los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <ModalConfirmacion
          isOpen={Boolean(movimientoAAnular)}
          onClose={() => setMovimientoAAnular(null)}
          onConfirm={confirmarAnulacion}
          titulo="Anular movimiento"
          mensaje={`Vas a anular "${movimientoAAnular?.concepto || 'este movimiento'}". Los traspasos anulan tambien su contrapartida.`}
          textoConfirmar="Anular"
          textoCancelar="Cancelar"
        />
      </div>
    </ProtectedRoute>
  );
}
