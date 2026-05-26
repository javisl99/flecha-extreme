'use client';

import {
  AccountBalanceCard,
  ActivityProgressCard,
  CashHeroCard,
  ParkingOccupancyCard,
  PendingPaymentsPanel,
  TodayReservationsPanel,
} from '@/components/Dashboard/v2/DashboardPrimitives';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function DashboardPage() {
  const {
    hasManagerAccess,
    accountingUiLoading,
    reservationsUiLoading,
    parkingUiLoading,
    accountingError,
    reservationsError,
    parkingError,
    cashAccount,
    latestCashMovement,
    visibleAccounts,
    todayReservations,
    activityProgress,
    parkingSummary,
    pendingPayments,
  } = useDashboardData();

  const topbarBadge = hasManagerAccess ? 'Vista gerencia' : 'Caja efectivo';

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Dashboard</h1>

        <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#c78a00]">{topbarBadge}</span>
        </div>
      </div>

      <section className="space-y-6 lg:space-y-8">
        {(accountingError || reservationsError) ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {accountingError || reservationsError}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12">
          <CashHeroCard
            account={cashAccount}
            latestMovement={latestCashMovement}
            loading={accountingUiLoading}
            managerAccess={hasManagerAccess}
          />

          <ActivityProgressCard
            completed={activityProgress.completed}
            total={activityProgress.total}
            loading={reservationsUiLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {accountingUiLoading
            ? Array.from({ length: hasManagerAccess ? 4 : 1 }).map((_, index) => (
                <AccountBalanceCard
                  key={`account-skeleton-${index}`}
                  loading
                  compact={!hasManagerAccess}
                />
              ))
            : visibleAccounts.map((account) => (
                <AccountBalanceCard
                  key={account.cuenta_id}
                  account={account}
                  compact={!hasManagerAccess && visibleAccounts.length === 1}
                />
              ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <TodayReservationsPanel reservations={todayReservations} loading={reservationsUiLoading} />

          <div className="space-y-6 xl:col-span-4">
            <ParkingOccupancyCard
              summary={parkingSummary}
              loading={parkingUiLoading}
              error={parkingError}
            />

            {hasManagerAccess ? (
              <PendingPaymentsPanel payments={pendingPayments} loading={accountingUiLoading} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
