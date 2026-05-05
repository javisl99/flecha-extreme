'use client';

import { useState } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { reservasMock } from '@/components/Actividades/data';
import {
  DataTableV2,
  KpiHeroCardV2,
  MetricCardV2,
  WindConditionCardV2,
} from '@/components/Dashboard/v2/DashboardPrimitives';
import TopbarV2 from '@/components/Layout/v2/TopbarV2';
import { useContabilidad } from '@/hooks/useContabilidad';
import { formatCurrency } from '@/lib/contabilidad';

const getCurrentDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const clampProgress = (value: number) => Math.max(0, Math.min(100, value));

export default function DashboardPage() {
  const { loading: contabilidadLoading, getResumenEfeDiario } = useContabilidad();
  const [fecha] = useState(getCurrentDate());

  const reservasHoy = reservasMock.filter((reserva) => reserva.fecha === fecha);
  const reservasPendientes = reservasHoy.filter((reserva) => reserva.estado === 'Pendiente').length;
  const reservasConfirmadas = reservasHoy.filter((reserva) => reserva.estado === 'Confirmada').length;

  const resumenContable = getResumenEfeDiario(fecha);
  const ingresos = resumenContable.ingresos;
  const objetivoOperativo = 1000;
  const progresoObjetivo = objetivoOperativo > 0 ? clampProgress((ingresos / objetivoOperativo) * 100) : 0;

  const heroValue = contabilidadLoading ? '...' : formatCurrency(ingresos);
  const trendValue = ingresos > 0 ? '+ Operativo activo' : 'Sin ingresos registrados';

  return (
    <div className="min-h-screen-safe bg-surface text-on-surface">
      <TopbarV2 title="Dashboard" badge="Base Tarifa Live" ctaLabel="Nuevo registro" ctaHref="/actividades" />

      <section className="page-container-narrow space-y-6 lg:space-y-8">
        <div className="grid gap-6 lg:h-[420px] lg:grid-cols-12">
          <KpiHeroCardV2
            title="Ingresos del día"
            value={heroValue}
            trend={trendValue}
            progressLabel="Objetivo operativo"
            progressValue={progresoObjetivo}
          />
          <WindConditionCardV2 />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          <MetricCardV2
            title="Alquileres activos"
            value={String(reservasConfirmadas)}
            icon={<CalendarDaysIcon className="h-6 w-6" />}
            barProgress={clampProgress(reservasConfirmadas * 10)}
          />

          <MetricCardV2
            title="Plazas parking"
            value="142/150"
            icon={<MapPinIcon className="h-6 w-6" />}
            barColorClass="bg-red-500"
            barProgress={94}
          />

          <MetricCardV2
            title="Clases hoy"
            value={String(reservasHoy.length)}
            icon={<UsersIcon className="h-6 w-6" />}
            barProgress={clampProgress(reservasHoy.length * 10)}
          />

          <MetricCardV2
            title="Pedidos tienda"
            value="8"
            icon={<CubeIcon className="h-6 w-6" />}
            subtitle="4 pendientes de envío"
          />
        </div>

        <DataTableV2 reservas={reservasHoy} />

        {reservasPendientes > 0 ? (
          <p className="rounded-xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
            Tienes {reservasPendientes} reservas pendientes por confirmar hoy.
          </p>
        ) : null}
      </section>
    </div>
  );
}
