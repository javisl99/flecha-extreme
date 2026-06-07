'use client';

import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import ContabilidadAccionesMenu from '@/components/Contabilidad/ContabilidadAccionesMenu';
import GastoModalV2, {
  type GastoFormState,
} from '@/components/Contabilidad/GastoModal';
import IngresoModalV2, {
  type IngresoFormState,
} from '@/components/Contabilidad/IngresoModal';
import SwitchVistaContabilidad, {
  type VistaContabilidadTipo,
} from '@/components/Contabilidad/SwitchVistaContabilidad';
import TraspasoModalV2, {
  type TraspasoFormState,
} from '@/components/Contabilidad/TraspasoModal';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import { useContabilidad, type PendingBizum } from '@/hooks/useContabilidad';
import { useEmpleados } from '@/hooks/useEmpleados';
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
import { Button } from '@/shared/components';
import {
  ClaseMetodoPagoContable,
  CuentaContable,
  MetodoPagoContable,
  MovimientoContable,
  ResumenCuentaContable,
  TipoCuentaContable,
  TipoMovimientoContable,
} from '@/shared/types';

type FiltroOrigen = 'todos' | 'manual' | 'sync' | 'devolucion' | 'traspaso';

type FiltrosContabilidadState = {
  fechaInicio: string;
  fechaFin: string;
  tipo: '' | TipoMovimientoContable;
  cuentaId: string;
  origen: FiltroOrigen;
  busqueda: string;
};

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

const getEstadoPillClass = (movimiento: MovimientoContable) => {
  if (movimiento.estado === 'anulado') return 'bg-red-100 text-red-700';
  if (movimiento.es_devolucion) return 'bg-violet-100 text-violet-700';
  if (movimiento.id_pago) return 'bg-blue-100 text-blue-700';
  if (
    movimiento.tipo === 'traspaso_entrada' ||
    movimiento.tipo === 'traspaso_salida'
  ) {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-surface-container-high text-on-surface-variant';
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

const cardClassName =
  'rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient';

const fieldClassName =
  'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

const LoadingSkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-surface-container-high ${className}`}>
    <div className="contabilidad-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

const LoadingSkeletonPill = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-full bg-surface-container-high ${className}`}>
    <div className="contabilidad-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

const buildFilteredMovimientos = ({
  movimientos,
  filtros,
  cuentaId,
}: {
  movimientos: MovimientoContable[];
  filtros: FiltrosContabilidadState;
  cuentaId?: string;
}) =>
  movimientos.filter((movimiento) => {
    const fecha = movimiento.fecha_operacion;
    const origen = filtros.origen;
    const search = filtros.busqueda.trim().toLowerCase();
    const sourceLabel = getSourceLabel(movimiento).toLowerCase();
    const effectiveCuentaId = cuentaId || filtros.cuentaId;

    if (filtros.fechaInicio && fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && fecha > filtros.fechaFin) return false;
    if (filtros.tipo && movimiento.tipo !== filtros.tipo) return false;
    if (effectiveCuentaId && movimiento.cuenta_id !== effectiveCuentaId) return false;
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

function MetricCard({
  label,
  value,
  tone = 'neutral',
  icon,
  description,
  footer,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
  description?: string;
  footer?: ReactNode;
}) {
  const toneClassNames = {
    positive: {
      value: 'text-emerald-700',
      icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      glow: 'from-emerald-500/16 via-emerald-400/8 to-transparent',
    },
    negative: {
      value: 'text-red-700',
      icon: 'bg-red-50 text-red-600 ring-red-100',
      glow: 'from-red-500/16 via-red-400/8 to-transparent',
    },
    neutral: {
      value: 'text-primary-dark',
      icon: 'bg-primary/10 text-primary ring-primary/10',
      glow: 'from-primary/14 via-primary/6 to-transparent',
    },
  }[tone];

  return (
    <article className={`relative overflow-hidden ${cardClassName} p-5`}>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${toneClassNames.glow}`}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              {label}
            </p>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-on-surface-variant">
                {description}
              </p>
            ) : null}
          </div>
          {icon ? (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClassNames.icon}`}
            >
              {icon}
            </div>
          ) : null}
        </div>

        <p className={`font-headline text-3xl font-extrabold tracking-tight ${toneClassNames.value}`}>
          {value}
        </p>

        {footer ? (
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/75 px-3 py-2 text-sm font-semibold text-on-surface-variant">
            {footer}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function AccountSummaryCard({
  resumen,
  selected,
  onClick,
}: {
  resumen: ResumenCuentaContable;
  selected: boolean;
  onClick: () => void;
}) {
  const AccountIcon = resumen.cuenta.tipo === 'banco' ? BuildingLibraryIcon : BanknotesIcon;
  const saldoToneClassName = resumen.saldo >= 0 ? 'text-emerald-700' : 'text-red-700';

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-[1.5rem] border p-5 text-left shadow-card-ambient transition ${
        selected
          ? 'border-primary/35 bg-primary/5 shadow-primary/10'
          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/25 hover:bg-surface-container-low'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              {resumen.cuenta.tipo === 'banco' ? 'Cuenta bancaria' : 'Caja contable'}
            </p>
            <p className="mt-2 text-lg font-extrabold text-on-surface">
              {accountLabel(resumen.cuenta)}
            </p>
          </div>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
              selected
                ? 'bg-primary text-white ring-primary/20'
                : 'bg-primary/10 text-primary ring-primary/10'
            }`}
          >
            <AccountIcon className="h-5 w-5" />
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-outline">
            Saldo actual
          </p>
          <p className={`mt-1 font-headline text-3xl font-extrabold tracking-tight ${saldoToneClassName}`}>
            {formatCurrency(resumen.saldo)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/75 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-outline">
              Aportaciones
            </p>
            <p className="mt-1 text-sm font-extrabold text-emerald-700">
              {formatCurrency(resumen.ingresos_operativos)}
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/75 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-outline">
              Gastos
            </p>
            <p className="mt-1 text-sm font-extrabold text-red-700">
              {formatCurrency(resumen.gastos_operativos)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-on-surface-variant">
          <span>{resumen.cuenta.visible_efe ? 'Visible en EFE' : 'Fuera de EFE'}</span>
          <span className={selected ? 'text-primary' : 'text-outline'}>
            {selected ? 'Cuenta activa' : 'Ver movimientos'}
          </span>
        </div>
      </div>
    </button>
  );
}

function MovimientosSection({
  title,
  description,
  loading,
  movimientos,
  filtros,
  setFiltros,
  cuentas,
  onEditGasto,
  onEditAportacion,
  onEditTraspaso,
  onPrepararDevolucion,
  onAbrirPagoSincronizado,
  onAnular,
  headerAction,
  lockedCuenta,
  onClearLockedCuenta,
}: {
  title: string;
  description?: string;
  loading: boolean;
  movimientos: MovimientoContable[];
  filtros: FiltrosContabilidadState;
  setFiltros: Dispatch<SetStateAction<FiltrosContabilidadState>>;
  cuentas: CuentaContable[];
  onEditGasto: (movimiento: MovimientoContable) => void;
  onEditAportacion: (movimiento: MovimientoContable) => void;
  onEditTraspaso: (movimiento: MovimientoContable) => void;
  onPrepararDevolucion: (movimiento: MovimientoContable) => void;
  onAbrirPagoSincronizado: (movimiento: MovimientoContable) => void;
  onAnular: (movimiento: MovimientoContable) => void;
  headerAction?: ReactNode;
  lockedCuenta?: CuentaContable | null;
  onClearLockedCuenta?: () => void;
}) {
  return (
    <section className={`overflow-hidden ${cardClassName}`}>
      <header className="border-b border-outline-variant/20 px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-primary-dark">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
            ) : null}
          </div>
          {headerAction ? <div className="w-full lg:w-auto">{headerAction}</div> : null}
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm text-on-surface">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              Desde
            </span>
            <input
              type="date"
              className={fieldClassName}
              value={filtros.fechaInicio}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))
              }
            />
          </label>

          <label className="text-sm text-on-surface">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              Hasta
            </span>
            <input
              type="date"
              className={fieldClassName}
              value={filtros.fechaFin}
              onChange={(e) => setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))}
            />
          </label>

          <label className="text-sm text-on-surface">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              Tipo
            </span>
            <select
              className={fieldClassName}
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipo: e.target.value as '' | TipoMovimientoContable,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="ingreso">Aportación</option>
              <option value="gasto">Gasto</option>
              <option value="traspaso_entrada">Traspaso entrada</option>
              <option value="traspaso_salida">Traspaso salida</option>
            </select>
          </label>

          {lockedCuenta ? (
            <div className="text-sm text-on-surface">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                Cuenta activa
              </span>
              <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 text-sm text-primary-dark">
                <span className="truncate font-semibold">{accountLabel(lockedCuenta)}</span>
                {onClearLockedCuenta ? (
                  <button
                    type="button"
                    onClick={onClearLockedCuenta}
                    className="shrink-0 text-xs font-bold uppercase tracking-[0.08em] text-primary transition hover:opacity-80"
                  >
                    Ver todas
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <label className="text-sm text-on-surface">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                Cuenta
              </span>
              <select
                className={fieldClassName}
                value={filtros.cuentaId}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, cuentaId: e.target.value }))
                }
              >
                <option value="">Todas</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {accountLabel(cuenta)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-sm text-on-surface">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              Origen
            </span>
            <select
              className={fieldClassName}
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
              className={fieldClassName}
              value={filtros.busqueda}
              onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
              placeholder="Concepto, proveedor, factura..."
            />
          </label>
        </div>

        {loading ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-container-low/70 backdrop-blur-md">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-outline"
                      >
                        <LoadingSkeletonBlock className="h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-outline-variant/10 ${
                        rowIndex % 2 ? 'bg-surface-container-low/25' : ''
                      }`}
                    >
                      <td className="px-4 py-4"><LoadingSkeletonBlock className="h-4 w-24" /></td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <LoadingSkeletonPill className="h-5 w-20" />
                          <LoadingSkeletonPill className="h-5 w-24" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <LoadingSkeletonBlock className="h-4 w-28" />
                        <LoadingSkeletonBlock className="mt-2 h-3 w-16" />
                      </td>
                      <td className="px-4 py-4">
                        <LoadingSkeletonBlock className="h-4 w-4/5" />
                        <LoadingSkeletonBlock className="mt-2 h-3 w-2/3" />
                      </td>
                      <td className="px-4 py-4">
                        <LoadingSkeletonBlock className="h-4 w-32" />
                        <LoadingSkeletonBlock className="mt-2 h-3 w-24" />
                        <LoadingSkeletonBlock className="mt-2 h-3 w-20" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <LoadingSkeletonBlock className="ml-auto h-5 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <LoadingSkeletonPill className="h-8 w-14" />
                          <LoadingSkeletonPill className="h-8 w-14" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <LoadingSkeletonBlock className="h-4 w-40" />
                      <LoadingSkeletonBlock className="h-3 w-28" />
                    </div>
                    <LoadingSkeletonPill className="h-5 w-20" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <LoadingSkeletonPill className="h-5 w-20" />
                    <LoadingSkeletonPill className="h-5 w-16" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <LoadingSkeletonBlock className="h-4 w-4/5" />
                    <LoadingSkeletonBlock className="h-3 w-3/5" />
                    <LoadingSkeletonBlock className="h-3 w-2/5" />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <LoadingSkeletonPill className="h-8 w-16" />
                    <LoadingSkeletonPill className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
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
                  {movimientos.map((movimiento, index) => {
                    const esTraspaso =
                      movimiento.tipo === 'traspaso_entrada' ||
                      movimiento.tipo === 'traspaso_salida';
                    const puedeEditar =
                      isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                    const puedeAbrirPagoSincronizado = Boolean(movimiento.id_pago);

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
                              Empleado: {movimiento.empleado.nombre}{' '}
                              {movimiento.empleado.apellidos}
                            </p>
                          ) : null}
                          {movimiento.comentario ? (
                            <p className="text-xs text-on-surface-variant">
                              {movimiento.comentario}
                            </p>
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
                            Base {formatCurrency(movimiento.base_imponible)} · IVA{' '}
                            {movimiento.iva_pct}%
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
                                onClick={() => onEditGasto(movimiento)}
                                className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                              >
                                Editar
                              </button>
                            ) : null}

                            {puedeEditar && movimiento.tipo === 'ingreso' ? (
                              <button
                                type="button"
                                onClick={() => onEditAportacion(movimiento)}
                                className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                              >
                                Editar
                              </button>
                            ) : null}

                            {puedeEditar && esTraspaso && movimiento.tipo === 'traspaso_salida' ? (
                              <button
                                type="button"
                                onClick={() => onEditTraspaso(movimiento)}
                                className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                              >
                                Editar
                              </button>
                            ) : null}

                            {puedeAbrirPagoSincronizado ? (
                              <button
                                type="button"
                                onClick={() => onAbrirPagoSincronizado(movimiento)}
                                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                              >
                                Ver pago
                              </button>
                            ) : null}

                            {puedeEditar && (!esTraspaso || movimiento.tipo === 'traspaso_salida') ? (
                              <button
                                type="button"
                                onClick={() => onAnular(movimiento)}
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

                  {movimientos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm font-medium text-outline"
                      >
                        No hay movimientos para los filtros actuales.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {movimientos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                  No hay movimientos para los filtros actuales.
                </div>
              ) : (
                movimientos.map((movimiento) => {
                  const esTraspaso =
                    movimiento.tipo === 'traspaso_entrada' ||
                    movimiento.tipo === 'traspaso_salida';
                  const puedeEditar =
                    isManualMovement(movimiento) && movimiento.estado === 'confirmado';
                  const puedeAbrirPagoSincronizado = Boolean(movimiento.id_pago);

                  return (
                    <div
                      key={movimiento.id}
                      className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {movimiento.concepto}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {movimiento.fecha_operacion}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoPillClass(
                            movimiento
                          )}`}
                        >
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
                        <p>Cuenta: {accountLabel(movimiento.cuenta, movimiento.caja)}</p>
                        <p>
                          Método:{' '}
                          {paymentMethodLabel(
                            movimiento.metodo_pago,
                            movimiento.metodo_pago?.codigo || movimiento.metodo || null
                          )}
                        </p>
                        <p>IVA: {movimiento.iva_pct}%</p>
                        <p className={`font-bold ${getAmountTone(movimiento)}`}>
                          {formatCurrency(movimiento.importe_total)}
                        </p>
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
                        {puedeEditar && movimiento.tipo === 'gasto' ? (
                          <button
                            type="button"
                            onClick={() => onEditGasto(movimiento)}
                            className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                          >
                            Editar gasto
                          </button>
                        ) : null}

                        {puedeEditar && movimiento.tipo === 'ingreso' ? (
                          <button
                            type="button"
                            onClick={() => onEditAportacion(movimiento)}
                            className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                          >
                            Editar aportación
                          </button>
                        ) : null}

                        {puedeEditar && esTraspaso && movimiento.tipo === 'traspaso_salida' ? (
                          <button
                            type="button"
                            onClick={() => onEditTraspaso(movimiento)}
                            className="min-h-11 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:text-primary"
                          >
                            Editar traspaso
                          </button>
                        ) : null}

                        {puedeAbrirPagoSincronizado ? (
                          <button
                            type="button"
                            onClick={() => onAbrirPagoSincronizado(movimiento)}
                            className="min-h-11 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                          >
                            Ver pago
                          </button>
                        ) : null}

                        {puedeEditar && (!esTraspaso || movimiento.tipo === 'traspaso_salida') ? (
                          <button
                            type="button"
                            onClick={() => onAnular(movimiento)}
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
          </>
        )}
      </div>
    </section>
  );
}

function BizumPendientesSection({
  pendingBizums,
  onCompletar,
  onCancelar,
}: {
  pendingBizums: PendingBizum[];
  onCompletar: (id: string) => Promise<void>;
  onCancelar: (id: string) => Promise<void>;
}) {
  return (
    <section className={cardClassName}>
      <header className="border-b border-outline-variant/20 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-primary-dark">
              Bizum Alfonso pendiente
            </h2>
            <p className="text-sm text-on-surface-variant">
              Bandeja de bizums pendientes de liquidar en Santander.
            </p>
          </div>
          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-amber-700">
            {pendingBizums.length} pendientes
          </span>
        </div>
      </header>
      <div className="p-4 sm:p-6">
        {pendingBizums.length === 0 ? (
          <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low px-4 py-8 text-center text-sm text-outline">
            No hay Bizums Alfonso pendientes ahora mismo.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
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
                            onClick={() => void onCompletar(bizum.id)}
                            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Completar
                          </button>
                          <button
                            type="button"
                            onClick={() => void onCancelar(bizum.id)}
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

            <div className="space-y-3 md:hidden">
              {pendingBizums.map((bizum) => (
                <div
                  key={bizum.id}
                  className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{bizum.concepto}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {new Date(bizum.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-on-surface">
                      {formatCurrency(bizum.importe)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    {bizum.cliente
                      ? `${bizum.cliente.nombre} ${bizum.cliente.apellidos}`
                      : 'Sin cliente'}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void onCompletar(bizum.id)}
                      className="min-h-11 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Completar
                    </button>
                    <button
                      type="button"
                      onClick={() => void onCancelar(bizum.id)}
                      className="min-h-11 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function ContabilidadPage() {
  const router = useRouter();
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

  const [vistaActual, setVistaActual] = useState<VistaContabilidadTipo>('movimientos');
  const [showPageSkeleton, setShowPageSkeleton] = useState(true);
  const [selectedCuentaId, setSelectedCuentaId] = useState('');
  const [filtros, setFiltros] = useState<FiltrosContabilidadState>({
    fechaInicio: '',
    fechaFin: '',
    tipo: '',
    cuentaId: '',
    origen: 'todos',
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
  const initialSkeletonStartedAtRef = useRef<number | null>(null);
  const initialSkeletonTimerRef = useRef<number | null>(null);
  const transitionSkeletonTimerRef = useRef<number | null>(null);
  const initialSkeletonCompletedRef = useRef(false);

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

  const movimientosFiltrados = useMemo(
    () => buildFilteredMovimientos({ movimientos, filtros }),
    [movimientos, filtros]
  );

  const movimientosCuentaFiltrados = useMemo(
    () =>
      buildFilteredMovimientos({
        movimientos,
        filtros,
        cuentaId: selectedCuentaId || undefined,
      }),
    [movimientos, filtros, selectedCuentaId]
  );

  const aportacionesOperativas = movimientosFiltrados.filter(isOperationalIncome);
  const gastosOperativosLista = movimientosFiltrados.filter(isOperationalExpense);
  const ingresosOperativos = aportacionesOperativas.reduce(
    (total, movimiento) => total + movimiento.importe_total,
    0
  );
  const gastosOperativos = gastosOperativosLista.reduce(
    (total, movimiento) => total + movimiento.importe_total,
    0
  );
  const saldoOperativo = ingresosOperativos - gastosOperativos;
  const resumenCuentas = getResumenCuentas();
  const resumenEFE = getResumenEfeDiario(fechaEFE);
  const movimientosEfeEntrada = resumenEFE.movimientos.filter(
    (movimiento) => movimiento.tipo === 'ingreso' || movimiento.tipo === 'traspaso_entrada'
  );
  const movimientosEfeSalida = resumenEFE.movimientos.filter(
    (movimiento) => movimiento.tipo === 'gasto' || movimiento.tipo === 'traspaso_salida'
  );
  const selectedCuenta = selectedCuentaId
    ? cuentas.find((cuenta) => cuenta.id === selectedCuentaId) || null
    : null;

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

  const abrirNuevaAportacion = () => {
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
      toast.error('Revisa concepto, método, cuenta e importe de la aportación');
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
          ? 'Aportación actualizada'
          : ingresoForm.esDevolucion
            ? 'Devolución registrada'
            : 'Aportación registrada'
      );
      resetIngreso();
      setIsIngresoOpen(false);
    } else {
      toast.error(result.error || 'No se pudo guardar la aportación');
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
        : movimientos.find((item) => item.id === movimiento.id_movimiento_relacionado) ||
          movimiento;

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

  const handleCompletarBizum = async (bizumId: string) => {
    const result = await completarBizumPendiente(bizumId);
    if (result.success) toast.success('Bizum completado');
    else toast.error(result.error || 'No se pudo completar el Bizum');
  };

  const handleCancelarBizum = async (bizumId: string) => {
    const result = await cancelarBizumPendiente(bizumId);
    if (result.success) toast.success('Bizum cancelado');
    else toast.error(result.error || 'No se pudo cancelar el Bizum');
  };

  const abrirPagoSincronizado = useCallback(
    (movimiento: MovimientoContable) => {
      if (!movimiento.id_pago) return;

      router.push(`/pagos?pagoId=${encodeURIComponent(movimiento.id_pago)}`);
    },
    [router]
  );

  useEffect(() => {
    if (initialSkeletonCompletedRef.current) {
      return;
    }

    const MIN_LOADING_MS = 800;

    if (initialSkeletonTimerRef.current !== null) {
      window.clearTimeout(initialSkeletonTimerRef.current);
      initialSkeletonTimerRef.current = null;
    }

    if (loading) {
      if (initialSkeletonStartedAtRef.current === null) {
        initialSkeletonStartedAtRef.current = Date.now();
      }

      setShowPageSkeleton(true);
      return;
    }

    if (initialSkeletonStartedAtRef.current === null) {
      setShowPageSkeleton(false);
      initialSkeletonCompletedRef.current = true;
      return;
    }

    const elapsed = Date.now() - initialSkeletonStartedAtRef.current;
    const remaining = Math.max(MIN_LOADING_MS - elapsed, 0);

    if (remaining > 0) {
      initialSkeletonTimerRef.current = window.setTimeout(() => {
        setShowPageSkeleton(false);
        initialSkeletonCompletedRef.current = true;
        initialSkeletonStartedAtRef.current = null;
        initialSkeletonTimerRef.current = null;
      }, remaining);
    } else {
      setShowPageSkeleton(false);
      initialSkeletonCompletedRef.current = true;
      initialSkeletonStartedAtRef.current = null;
    }

    return () => {
      if (initialSkeletonTimerRef.current !== null) {
        window.clearTimeout(initialSkeletonTimerRef.current);
        initialSkeletonTimerRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    return () => {
      if (transitionSkeletonTimerRef.current !== null) {
        window.clearTimeout(transitionSkeletonTimerRef.current);
        transitionSkeletonTimerRef.current = null;
      }
    };
  }, []);

  const handleVistaChange = useCallback(
    (vista: VistaContabilidadTipo) => {
      if (vista === vistaActual) return;

      if (transitionSkeletonTimerRef.current !== null) {
        window.clearTimeout(transitionSkeletonTimerRef.current);
        transitionSkeletonTimerRef.current = null;
      }

      setVistaActual(vista);
      setShowPageSkeleton(true);

      transitionSkeletonTimerRef.current = window.setTimeout(() => {
        setShowPageSkeleton(false);
        transitionSkeletonTimerRef.current = null;
      }, 800);
    },
    [vistaActual]
  );

  const renderContabilidadSkeleton = () => (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="page-container space-y-6">
        <style jsx global>{`
          @keyframes contabilidad-loading-shimmer {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(220%);
            }
          }

          .contabilidad-loading-shimmer {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.12) 45%,
              rgba(255, 255, 255, 0.24) 50%,
              rgba(255, 255, 255, 0.12) 55%,
              transparent 100%
            );
            animation: contabilidad-loading-shimmer 1.2s ease-in-out infinite;
          }
        `}</style>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">
              Contabilidad
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Libro contable configurable con vistas separadas para movimientos,
              cuentas, EFE, Bizum y configuración.
            </p>
          </div>

          <div className="pointer-events-none flex w-full flex-col gap-3 opacity-70 xl:w-auto xl:items-end">
            <SwitchVistaContabilidad
              vistaActual={vistaActual}
              onVistaChange={() => undefined}
            />
            <div className="w-full sm:w-auto">
              <ContabilidadAccionesMenu
                key={vistaActual}
                disabled
                onNuevaAportacion={() => undefined}
                onNuevoGasto={() => undefined}
                onNuevoTraspaso={() => undefined}
              />
            </div>
          </div>
        </div>

        {vistaActual === 'movimientos' ? (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <LoadingSkeletonBlock className="h-3 w-32" />
                      <LoadingSkeletonBlock className="h-4 w-44" />
                    </div>
                    <LoadingSkeletonPill className="h-11 w-11 rounded-2xl" />
                  </div>
                  <LoadingSkeletonBlock className="mt-5 h-8 w-40" />
                  <LoadingSkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
                </article>
              ))}
            </section>
            <section className={cardClassName}>
              <div className="border-b border-outline-variant/20 px-6 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <LoadingSkeletonBlock className="h-6 w-56" />
                    <LoadingSkeletonBlock className="h-4 w-full max-w-[30rem]" />
                  </div>
                  <LoadingSkeletonPill className="h-11 w-40" />
                </div>
              </div>
              <div className="space-y-5 p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <LoadingSkeletonBlock className="h-3 w-16" />
                      <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <LoadingSkeletonBlock className="h-12 w-full rounded-xl" />
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LoadingSkeletonBlock key={index} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : vistaActual === 'cuentas' ? (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <article key={index} className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
                  <LoadingSkeletonBlock className="h-3 w-28" />
                  <LoadingSkeletonBlock className="mt-3 h-6 w-40" />
                  <LoadingSkeletonBlock className="mt-5 h-8 w-28" />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <LoadingSkeletonBlock className="h-16 rounded-2xl" />
                    <LoadingSkeletonBlock className="h-16 rounded-2xl" />
                  </div>
                </article>
              ))}
            </section>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className={cardClassName}>
                  <div className="border-b border-outline-variant/20 px-6 py-4">
                    <LoadingSkeletonBlock className="h-6 w-32" />
                  </div>
                  <div className="space-y-3 p-6">
                    <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                    <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                    <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                    <LoadingSkeletonBlock className="h-11 w-28 rounded-full" />
                  </div>
                </article>
              ))}
            </section>
          </div>
        ) : vistaActual === 'efe' ? (
          <section className={cardClassName}>
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-2">
                  <LoadingSkeletonBlock className="h-6 w-56" />
                  <LoadingSkeletonBlock className="h-4 w-full max-w-[32rem]" />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <LoadingSkeletonBlock className="h-11 w-40 rounded-xl" />
                  <LoadingSkeletonPill className="h-11 w-56" />
                </div>
              </div>
            </header>
            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <article key={index} className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-card-ambient">
                    <LoadingSkeletonBlock className="h-3 w-28" />
                    <LoadingSkeletonBlock className="mt-4 h-8 w-36" />
                    <LoadingSkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
                  </article>
                ))}
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-2">
                        <LoadingSkeletonBlock className="h-5 w-48" />
                        <div className="flex flex-wrap gap-2">
                          <LoadingSkeletonPill className="h-5 w-24" />
                          <LoadingSkeletonPill className="h-5 w-20" />
                          <LoadingSkeletonPill className="h-5 w-24" />
                        </div>
                      </div>
                      <LoadingSkeletonBlock className="h-11 w-40 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : vistaActual === 'bizum' ? (
          <section className={cardClassName}>
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <LoadingSkeletonBlock className="h-6 w-52" />
                  <LoadingSkeletonBlock className="h-4 w-full max-w-[26rem]" />
                </div>
                <LoadingSkeletonPill className="h-8 w-32" />
              </div>
            </header>
            <div className="space-y-3 p-4 sm:p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <LoadingSkeletonBlock className="h-5 w-44" />
                      <LoadingSkeletonBlock className="h-4 w-28" />
                    </div>
                    <LoadingSkeletonBlock className="h-6 w-20" />
                  </div>
                  <LoadingSkeletonBlock className="mt-4 h-4 w-52" />
                  <div className="mt-4 flex justify-end gap-2">
                    <LoadingSkeletonPill className="h-10 w-24" />
                    <LoadingSkeletonPill className="h-10 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={index} className={cardClassName}>
                <div className="border-b border-outline-variant/20 px-6 py-4">
                  <LoadingSkeletonBlock className="h-6 w-32" />
                </div>
                <div className="space-y-3 p-6">
                  <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                  <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                  <LoadingSkeletonBlock className="h-11 w-full rounded-xl" />
                  <LoadingSkeletonBlock className="h-11 w-28 rounded-full" />
                  <LoadingSkeletonBlock className="h-28 w-full rounded-2xl" />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </ProtectedRoute>
  );

  if (showPageSkeleton) {
    return renderContabilidadSkeleton();
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
        <div className="page-container">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'fl-admin']}>
      <div className="page-container space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">
              Contabilidad
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Libro contable configurable con vistas separadas para movimientos,
              cuentas, EFE, Bizum y configuración.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            <SwitchVistaContabilidad
              vistaActual={vistaActual}
              onVistaChange={handleVistaChange}
            />
            <div className="w-full sm:w-auto">
              <ContabilidadAccionesMenu
                key={vistaActual}
                disabled={saving}
                onNuevaAportacion={abrirNuevaAportacion}
                onNuevoGasto={abrirNuevoGasto}
                onNuevoTraspaso={() => abrirNuevoTraspaso(false)}
              />
            </div>
          </div>
        </div>

        {vistaActual === 'movimientos' ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricCard
                label="Aportaciones operativas"
                value={formatCurrency(ingresosOperativos)}
                tone="positive"
                icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
                description="Entradas confirmadas dentro del filtro actual."
                footer={
                  <span>{aportacionesOperativas.length} entradas confirmadas</span>
                }
              />
              <MetricCard
                label="Gastos operativos"
                value={formatCurrency(gastosOperativos)}
                tone="negative"
                icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
                description="Salidas operativas confirmadas en el periodo."
                footer={<span>{gastosOperativosLista.length} salidas operativas</span>}
              />
              <MetricCard
                label="Saldo operativo"
                value={formatCurrency(saldoOperativo)}
                tone={saldoOperativo >= 0 ? 'positive' : 'negative'}
                icon={<ScaleIcon className="h-5 w-5" />}
                description="Resultado neto de aportaciones menos gastos."
                footer={<span>Resultado del filtro actual</span>}
              />
            </section>

            <MovimientosSection
              title="Movimientos contables"
              description="Consulta, filtra y exporta el libro contable con una vista optimizada para móvil y escritorio."
              loading={loading}
              movimientos={movimientosFiltrados}
              filtros={filtros}
              setFiltros={setFiltros}
              cuentas={cuentas}
              onEditGasto={cargarGastoEnFormulario}
              onEditAportacion={cargarIngresoEnFormulario}
              onEditTraspaso={cargarTraspasoEnFormulario}
              onPrepararDevolucion={prepararDevolucion}
              onAbrirPagoSincronizado={abrirPagoSincronizado}
              onAnular={setMovimientoAAnular}
              headerAction={
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleExportExcel}
                  className="min-h-11 w-full rounded-full border-outline-variant/45 bg-surface-container-low px-3.5 py-2 text-[13px] font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary sm:w-auto"
                  icon={<ArrowDownTrayIcon className="h-3.5 w-3.5" />}
                >
                  Exportar Excel
                </Button>
              }
            />
          </>
        ) : null}

        {vistaActual === 'cuentas' ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {resumenCuentas.map((resumen) => (
                <AccountSummaryCard
                  key={resumen.cuenta_id}
                  resumen={resumen}
                  selected={selectedCuentaId === resumen.cuenta_id}
                  onClick={() =>
                    setSelectedCuentaId((currentCuentaId) =>
                      currentCuentaId === resumen.cuenta_id ? '' : resumen.cuenta_id
                    )
                  }
                />
              ))}
            </section>

            <MovimientosSection
              title={selectedCuenta ? `Movimientos de ${accountLabel(selectedCuenta)}` : 'Movimientos por cuenta'}
              description="Las tarjetas superiores fijan la cuenta activa y el listado se actualiza sin perder el resto de filtros."
              loading={loading}
              movimientos={movimientosCuentaFiltrados}
              filtros={filtros}
              setFiltros={setFiltros}
              cuentas={cuentas}
              onEditGasto={cargarGastoEnFormulario}
              onEditAportacion={cargarIngresoEnFormulario}
              onEditTraspaso={cargarTraspasoEnFormulario}
              onPrepararDevolucion={prepararDevolucion}
              onAbrirPagoSincronizado={abrirPagoSincronizado}
              onAnular={setMovimientoAAnular}
              lockedCuenta={selectedCuenta}
              onClearLockedCuenta={selectedCuenta ? () => setSelectedCuentaId('') : undefined}
            />
          </>
        ) : null}

        {vistaActual === 'efe' ? (
          <section className={cardClassName}>
            <header className="border-b border-outline-variant/20 px-6 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                    Gestión EFE por día
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Saldo inicial automático desde el histórico y ajuste manual por cuenta.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="text-sm text-on-surface">
                    <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                      Fecha
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={fechaEFE}
                      onChange={(e) => {
                        setFechaEFE(e.target.value);
                        setAjustesEfeDraft({});
                      }}
                    />
                  </label>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => abrirNuevoTraspaso(true)}
                    className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-4 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  >
                    Caja efectivo a personal
                  </Button>
                </div>
              </div>
            </header>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MetricCard
                  label="Aportaciones del día"
                  value={formatCurrency(resumenEFE.ingresos)}
                  tone="positive"
                  icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
                  description="Dinero recibido en las cuentas visibles en EFE."
                  footer={<span>{movimientosEfeEntrada.length} movimientos de entrada</span>}
                />
                <MetricCard
                  label="Gastos del día"
                  value={formatCurrency(resumenEFE.gastos)}
                  tone="negative"
                  icon={<ArrowTrendingDownIcon className="h-5 w-5" />}
                  description="Salidas y traspasos de salida del día seleccionado."
                  footer={<span>{movimientosEfeSalida.length} movimientos de salida</span>}
                />
                <MetricCard
                  label="Saldo día"
                  value={formatCurrency(resumenEFE.saldo)}
                  tone={resumenEFE.saldo >= 0 ? 'positive' : 'negative'}
                  icon={<ScaleIcon className="h-5 w-5" />}
                  description="Diferencia diaria entre entradas y salidas EFE."
                  footer={<span>{resumenEFE.cuentas.length} cuentas visibles en EFE</span>}
                />
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
                            <span>
                              Saldo inicial {formatCurrency(resumenCuenta.saldo_inicial)}
                            </span>
                            <span>Aportaciones {formatCurrency(resumenCuenta.ingresos)}</span>
                            <span>Gastos {formatCurrency(resumenCuenta.gastos)}</span>
                            <span>
                              Saldo cierre {formatCurrency(resumenCuenta.saldo_cierre)}
                            </span>
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 lg:max-w-xl lg:grid-cols-[1fr_1.3fr_auto]">
                          <input
                            type="number"
                            step="0.01"
                            className={fieldClassName}
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
                            className={fieldClassName}
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
          </section>
        ) : null}

        {vistaActual === 'bizum' ? (
          <BizumPendientesSection
            pendingBizums={pendingBizums}
            onCompletar={handleCompletarBizum}
            onCancelar={handleCancelarBizum}
          />
        ) : null}

        {vistaActual === 'configuracion' ? (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <article className={cardClassName}>
              <header className="border-b border-outline-variant/20 px-6 py-4">
                <h2 className="font-headline text-xl font-extrabold text-primary-dark">Bancos</h2>
              </header>
              <div className="space-y-4 p-6">
                <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <input
                    type="text"
                    className={fieldClassName}
                    value={bancoForm.nombre}
                    onChange={(e) => setBancoForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre del banco"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      className={fieldClassName}
                      value={bancoForm.codigo}
                      onChange={(e) => setBancoForm((prev) => ({ ...prev, codigo: e.target.value }))}
                      placeholder="Código"
                    />
                    <input
                      type="number"
                      className={fieldClassName}
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
                      onChange={(e) =>
                        setBancoForm((prev) => ({ ...prev, activo: e.target.checked }))
                      }
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

            <article className={cardClassName}>
              <header className="border-b border-outline-variant/20 px-6 py-4">
                <h2 className="font-headline text-xl font-extrabold text-primary-dark">Cuentas</h2>
              </header>
              <div className="space-y-4 p-6">
                <div className="space-y-3 rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      className={fieldClassName}
                      value={cuentaForm.nombre}
                      onChange={(e) =>
                        setCuentaForm((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Nombre de la cuenta"
                    />
                    <input
                      type="text"
                      className={fieldClassName}
                      value={cuentaForm.codigo}
                      onChange={(e) =>
                        setCuentaForm((prev) => ({ ...prev, codigo: e.target.value }))
                      }
                      placeholder="Código"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className={fieldClassName}
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
                      className={fieldClassName}
                      value={cuentaForm.banco_id}
                      onChange={(e) =>
                        setCuentaForm((prev) => ({ ...prev, banco_id: e.target.value }))
                      }
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
                    className={fieldClassName}
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

            <article className={cardClassName}>
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
                      className={fieldClassName}
                      value={metodoForm.nombre}
                      onChange={(e) =>
                        setMetodoForm((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Nombre del método"
                    />
                    <input
                      type="text"
                      className={fieldClassName}
                      value={metodoForm.codigo}
                      onChange={(e) =>
                        setMetodoForm((prev) => ({ ...prev, codigo: e.target.value }))
                      }
                      placeholder="Código"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className={fieldClassName}
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
                      className={fieldClassName}
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
                    className={fieldClassName}
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
                          <p className="font-semibold text-on-surface">
                            {paymentMethodLabel(metodo)}
                          </p>
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
                            const result = await toggleMetodoPagoActivo(
                              metodo.id,
                              !metodo.activo
                            );
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
        ) : null}

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
