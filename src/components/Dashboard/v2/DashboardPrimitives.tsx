import Link from 'next/link';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type {
  DashboardAccount,
  DashboardParkingSummary,
  DashboardPendingPayment,
  DashboardReservation,
} from '@/hooks/useDashboardData';
import { accountingTypeLabel, formatCurrency } from '@/lib/contabilidad';
import type { MovimientoContable } from '@/shared/types';

interface CashHeroCardProps {
  account: DashboardAccount | null;
  latestMovement: MovimientoContable | null;
  loading: boolean;
  managerAccess: boolean;
}

interface AccountBalanceCardProps {
  account?: DashboardAccount | null;
  compact?: boolean;
  loading?: boolean;
}

interface TodayReservationsPanelProps {
  reservations: DashboardReservation[];
  loading: boolean;
}

interface ActivityProgressCardProps {
  completed: number;
  total: number;
  loading: boolean;
}

interface ParkingOccupancyCardProps {
  summary: DashboardParkingSummary;
  loading: boolean;
  error?: string | null;
}

interface PendingPaymentsPanelProps {
  payments: DashboardPendingPayment[];
  loading: boolean;
}

const safePercent = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes('confirm') || normalized === 'activa') {
    return 'bg-secondary-container/20 text-primary';
  }

  if (normalized.includes('pend')) {
    return 'bg-accent/20 text-[#9b6b00]';
  }

  if (normalized.includes('complet') || normalized === 'cerrado') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized.includes('cancel')) {
    return 'bg-rose-100 text-rose-700';
  }

  return 'bg-surface-container-high text-outline';
};

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low/45 px-4 py-8 text-center text-sm font-semibold text-outline">
    {children}
  </div>
);

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <span className={`block animate-pulse rounded-xl bg-surface-container-high ${className}`} />
);

function MovementSummary({ movement }: { movement: MovimientoContable | null }) {
  if (!movement) {
    return (
      <span className="text-sm font-semibold text-on-surface-variant">
        Sin movimientos registrados hoy
      </span>
    );
  }

  return (
    <span className="line-clamp-1 text-sm font-semibold text-on-surface-variant">
      {accountingTypeLabel(movement.tipo)} · {movement.concepto}
    </span>
  );
}

export function CashHeroCard({
  account,
  latestMovement,
  loading,
  managerAccess,
}: CashHeroCardProps) {
  const saldo = account?.saldo_cierre ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card-ambient sm:p-6 lg:col-span-8 lg:p-8">
      <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between gap-8">
        {loading ? (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-4">
                <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-14 w-56 rounded-2xl" />
              </div>
              <SkeletonBlock className="h-7 w-28 rounded-full" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="mt-3 h-6 w-20" />
              </div>
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <SkeletonBlock className="h-4 w-20" />
                <SkeletonBlock className="mt-3 h-6 w-20" />
              </div>
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="mt-3 h-5 w-full" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/25 text-primary">
                  <BanknotesIcon className="h-8 w-8" />
                </div>
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-outline">Caja efectivo</p>
                <h2 className="mt-2 font-headline text-5xl font-black leading-none text-primary-dark sm:text-6xl">
                  {formatCurrency(saldo)}
                </h2>
              </div>

              <span className="inline-flex w-fit items-center rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-primary">
                {managerAccess ? 'Vista gerencia' : 'Vista empleado'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.08em]">Ingresos</span>
                </div>
                <p className="mt-2 font-headline text-xl font-black text-on-surface">
                  {formatCurrency(account?.ingresos ?? 0)}
                </p>
              </div>

              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.08em]">Gastos</span>
                </div>
                <p className="mt-2 font-headline text-xl font-black text-on-surface">
                  {formatCurrency(account?.gastos ?? 0)}
                </p>
              </div>

              <div className="rounded-xl bg-surface-container-low px-4 py-3">
                <div className="flex items-center gap-2 text-primary">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.08em]">Último</span>
                </div>
                <div className="mt-2">
                  <MovementSummary movement={latestMovement} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function AccountBalanceCard({ account, compact = false, loading = false }: AccountBalanceCardProps) {
  if (loading) {
    return (
      <article className="rounded-xl bg-surface-container-low p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-11 w-11 rounded-xl" />
            <div className="min-w-0 space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-14 rounded-full" />
        </div>

        <SkeletonBlock className="mt-5 h-10 w-32" />

        {!compact ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-9 w-full rounded-lg" />
            <SkeletonBlock className="h-9 w-full rounded-lg" />
          </div>
        ) : null}
      </article>
    );
  }

  if (!account) {
    return null;
  }

  const isCash = account.cuenta.tipo === 'caja';

  return (
    <article className="rounded-xl bg-surface-container-low p-5 transition hover:bg-surface-container-high">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm">
            {isCash ? <BanknotesIcon className="h-6 w-6" /> : <CreditCardIcon className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-on-surface">{account.cuenta.nombre}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-outline">
              {isCash ? 'Caja' : 'Banco'}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
          EFE
        </span>
      </div>

      <p className="mt-5 font-headline text-3xl font-black leading-none text-primary-dark">
        {formatCurrency(account.saldo_cierre)}
      </p>

      {!compact ? (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold">
          <div className="rounded-lg bg-surface-container-lowest px-3 py-2 text-emerald-700">
            + {formatCurrency(account.ingresos)}
          </div>
          <div className="rounded-lg bg-surface-container-lowest px-3 py-2 text-rose-700">
            - {formatCurrency(account.gastos)}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ActivityProgressCard({ completed, total, loading }: ActivityProgressCardProps) {
  const progress = safePercent(completed, total);

  return (
    <section className="rounded-[1.5rem] bg-primary-container p-5 text-white shadow-card-ambient sm:p-6 lg:col-span-4 lg:p-7">
      <div className="flex h-full min-h-[300px] flex-col justify-between gap-8">
        {loading ? (
          <>
            <div>
              <SkeletonBlock className="h-12 w-12 rounded-2xl bg-white/15" />
              <SkeletonBlock className="mt-5 h-3 w-48 bg-white/20" />
              <SkeletonBlock className="mt-3 h-12 w-28 bg-white/20" />
              <SkeletonBlock className="mt-3 h-4 w-40 bg-white/20" />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.08em] text-white/70">
                <span>Progreso</span>
                <span>...</span>
              </div>
              <SkeletonBlock className="h-3 w-full rounded-full bg-white/15" />
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-accent">
                <CheckCircleIcon className="h-7 w-7" />
              </div>
              <p className="mt-5 text-[12px] font-black uppercase tracking-[0.18em] text-white/70">
                Actividades completadas
              </p>
              <p className="mt-2 font-headline text-5xl font-black leading-none">
                {completed}/{total}
              </p>
              <p className="mt-3 text-sm font-semibold text-white/75">
                {total > 0 ? `${progress}% del día cerrado` : 'Todavía no hay actividades para hoy'}
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.08em] text-white/70">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function TodayReservationsPanel({ reservations, loading }: TodayReservationsPanelProps) {
  const visibleReservations = reservations.slice(0, 7);
  const hiddenCount = Math.max(0, reservations.length - visibleReservations.length);

  return (
    <section className="rounded-[1.5rem] bg-surface-container-lowest shadow-card-ambient xl:col-span-8">
      <div className="flex flex-col gap-4 border-b border-outline-variant/15 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h3 className="font-headline text-2xl font-extrabold text-primary-dark">Reservas restantes de hoy</h3>
          <p className="text-xs font-semibold text-outline">Ordenadas por la próxima hora de salida</p>
        </div>
        <Link
          href="/actividades"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-surface-container-low px-4 text-sm font-bold text-primary transition hover:bg-surface-container-high"
        >
          Actividades
        </Link>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={index} className="grid gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 sm:grid-cols-[7rem_1fr_auto]">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-11 w-11 rounded-xl" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-5 w-14" />
                    <SkeletonBlock className="h-3 w-10" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <SkeletonBlock className="h-6 w-24 rounded-full" />
                    <SkeletonBlock className="h-6 w-20 rounded-full" />
                  </div>
                  <SkeletonBlock className="h-4 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
                <div className="flex items-center justify-end">
                  <SkeletonBlock className="h-5 w-8" />
                </div>
              </article>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <EmptyState>No quedan reservas pendientes para el resto del día.</EmptyState>
        ) : (
          <div className="space-y-3">
            {visibleReservations.map((reservation) => (
              <article
                key={`${reservation.id}-${reservation.start.toISOString()}`}
                className="grid gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-4 transition hover:border-primary/20 hover:bg-surface-container sm:grid-cols-[7rem_1fr_auto]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-lowest text-primary shadow-sm">
                    <CalendarDaysIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-headline text-lg font-black leading-none text-primary-dark">
                      {reservation.startTime}
                    </p>
                    <p className="mt-1 text-xs font-bold text-outline">{reservation.endTime}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary-container/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                      {reservation.activityType}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-black text-on-surface">{reservation.activityName}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-on-surface-variant">
                    {reservation.clientName}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-black text-primary sm:justify-end">
                  <UsersIcon className="h-5 w-5" />
                  <span>{reservation.people}</span>
                </div>
              </article>
            ))}

            {hiddenCount > 0 ? (
              <p className="pt-2 text-center text-xs font-bold text-outline">
                Hay {hiddenCount} reservas más para hoy.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

export function ParkingOccupancyCard({ summary, loading, error }: ParkingOccupancyCardProps) {
  const progress = safePercent(summary.occupied, summary.total);

  return (
    <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card-ambient sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline text-xl font-extrabold text-primary-dark">Parking</h3>
          <p className="text-xs font-semibold text-outline">Ocupación actual</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-primary">
          <MapPinIcon className="h-6 w-6" />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-4">
          <SkeletonBlock className="h-9 w-32" />
          <SkeletonBlock className="h-3 w-full rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      ) : (
        <>
          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="font-headline text-4xl font-black leading-none text-primary-dark">
              {summary.occupied}/{summary.total}
            </p>
            <p className="text-right text-sm font-bold text-on-surface-variant">
              {summary.free} libres
            </p>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full rounded-full bg-secondary-container" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-5 space-y-3">
            {summary.byType.map((item) => (
              <div key={item.tipo} className="flex items-center justify-between text-sm font-bold">
                <span className="text-on-surface">{item.label}</span>
                <span className="text-outline">
                  {item.occupied}/{item.total}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function PendingPaymentsPanel({ payments, loading }: PendingPaymentsPanelProps) {
  const total = payments.reduce((sum, payment) => sum + payment.importe, 0);
  const visiblePayments = payments.slice(0, 4);

  return (
    <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card-ambient sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline text-xl font-extrabold text-primary-dark">Cobros pendientes</h3>
          <p className="text-xs font-semibold text-outline">{formatCurrency(total)} por conciliar</p>
        </div>
        <Link
          href="/contabilidad"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary transition hover:bg-surface-container-high"
          title="Ir a contabilidad"
        >
          <CreditCardIcon className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={index} className="rounded-xl bg-surface-container-low px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <SkeletonBlock className="h-4 w-44" />
                    <SkeletonBlock className="h-3 w-28" />
                  </div>
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              </article>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState>No hay cobros pendientes.</EmptyState>
        ) : (
          <div className="space-y-3">
            {visiblePayments.map((payment) => {
              const clientName = `${payment.cliente?.nombre ?? ''} ${payment.cliente?.apellidos ?? ''}`.trim();

              return (
                <article key={payment.id} className="rounded-xl bg-surface-container-low px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-on-surface">{payment.concepto}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-outline">
                        {clientName || 'Cliente sin asignar'}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-primary">{formatCurrency(payment.importe)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
