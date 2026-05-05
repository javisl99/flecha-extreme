import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { Reserva } from '@/shared/types';

interface KpiHeroCardV2Props {
  title: string;
  value: string;
  trend: string;
  progressLabel: string;
  progressValue: number;
  actionLabel?: string;
}

interface MetricCardV2Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  barColorClass?: string;
  barProgress?: number;
}

interface DataTableV2Props {
  reservas: Reserva[];
}

const safeProgress = (value: number) => Math.max(0, Math.min(100, value));

export function KpiHeroCardV2({
  title,
  value,
  trend,
  progressLabel,
  progressValue,
  actionLabel = 'Detalles',
}: KpiHeroCardV2Props) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-card-ambient sm:p-6 lg:col-span-8 lg:p-8">
      <div className="pointer-events-none absolute right-8 top-6 text-primary/10">
        <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 16C20 0 40 32 60 16C80 0 100 32 120 16" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path d="M0 40C20 24 40 56 60 40C80 24 100 56 120 40" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path d="M0 64C20 48 40 80 60 64C80 48 100 80 120 64" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-outline">{title}</p>
          <h2 className="mt-2 font-headline text-4xl font-black leading-none text-primary-dark sm:text-5xl">{value}</h2>
          <span className="mt-4 inline-flex items-center rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-[#b67a00]">
            {trend}
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="w-full space-y-3 sm:w-2/3">
            <div className="flex items-center justify-between text-xs font-semibold text-outline">
              <span>{progressLabel}</span>
              <span>{safeProgress(progressValue)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
              <div className="primary-gradient h-full rounded-full" style={{ width: `${safeProgress(progressValue)}%` }} />
            </div>
          </div>

          <button
            type="button"
            className="rounded-xl bg-surface-container-low px-4 py-2 text-sm font-bold text-primary transition hover:bg-surface-container-high"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WindConditionCardV2() {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-primary-container p-5 text-white shadow-card-ambient sm:p-6 lg:col-span-4 lg:p-8">
      <div className="absolute inset-0 opacity-25" style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), radial-gradient(circle at 40% 20%, rgba(255,255,255,0.35), transparent 55%)',
      }} />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <div className="flex items-start justify-between">
            <span className="text-3xl leading-none text-accent">〰</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">Live Tarifa</span>
          </div>
          <p className="mt-3 font-headline text-4xl font-black sm:text-5xl">18</p>
          <p className="font-headline text-2xl font-black sm:text-3xl">Knots</p>
          <p className="mt-1 text-xs font-medium text-white/75">Poniente · Constante</p>
        </div>

        <div className="space-y-2 text-xs font-bold">
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <span>Mareas</span>
            <span>Baja 14:32</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span>Temperatura</span>
            <span>24°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricCardV2({
  title,
  value,
  subtitle,
  icon,
  barColorClass = 'bg-secondary-container',
  barProgress = 0,
}: MetricCardV2Props) {
  return (
    <div className="rounded-xl bg-surface-container-low p-5 transition hover:bg-surface-container-high sm:p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-lowest text-primary shadow-sm">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-outline">{title}</p>
          <p className="font-headline text-2xl font-black leading-none text-on-surface sm:text-3xl">{value}</p>
        </div>
      </div>

      {subtitle ? (
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-secondary">{subtitle}</p>
      ) : (
        <div className="h-1 overflow-hidden rounded-full bg-surface-container-highest">
          <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${safeProgress(barProgress)}%` }} />
        </div>
      )}
    </div>
  );
}

export function StatusChipV2({ estado }: { estado: Reserva['estado'] }) {
  const statusClass = {
    Confirmada: 'bg-accent/20 text-[#b67a00]',
    Pendiente: 'bg-surface-container-high text-outline',
    Cancelada: 'bg-red-100 text-red-700',
    Completada: 'bg-secondary-container/15 text-secondary',
  }[estado];

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass}`}>
      {estado}
    </span>
  );
}

const initials = (nombre: string) => {
  const chunks = nombre.split(' ').filter(Boolean);
  if (!chunks.length) return 'CL';
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
};

const buildName = (reserva: Reserva) => {
  const nombre = reserva.cliente?.nombre || '';
  const apellidos = reserva.cliente?.apellidos || '';
  const fullName = `${nombre} ${apellidos}`.trim();
  return fullName || 'Cliente sin nombre';
};

export function DataTableV2({ reservas }: DataTableV2Props) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-surface-container-lowest shadow-card-ambient">
      <div className="flex flex-col gap-4 border-b border-outline-variant/15 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-6">
        <div>
          <h3 className="font-headline text-2xl font-extrabold text-primary-dark">Próximas actividades</h3>
          <p className="text-xs font-medium text-outline">Programación para las próximas 24 horas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-surface-container-low px-4 py-2 text-xs font-bold text-primary transition hover:bg-surface-container-high"
          >
            Filtrar
          </button>
          <button
            type="button"
            className="rounded-lg bg-surface-container-low px-4 py-2 text-xs font-bold text-primary transition hover:bg-surface-container-high"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="sticky top-0 bg-surface-container-low/70 backdrop-blur-md">
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Cliente</th>
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Actividad</th>
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Instructor</th>
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Horario</th>
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Estado</th>
              <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.16em] text-outline sm:px-6 lg:px-8">Acción</th>
            </tr>
          </thead>

          <tbody>
            {reservas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm font-medium text-outline sm:px-6 lg:px-8">
                  No hay actividades para mostrar en este momento.
                </td>
              </tr>
            ) : (
              reservas.map((reserva, index) => {
                const cliente = buildName(reserva);

                return (
                  <tr
                    key={reserva.id}
                    className={`transition-colors hover:bg-surface-container-low ${index % 2 ? 'bg-surface-container-low/20' : ''}`}
                  >
                    <td className="px-5 py-5 sm:px-6 lg:px-8">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-[10px] font-bold text-white">
                          {initials(cliente)}
                        </div>
                        <span className="text-xs font-bold text-on-surface">{cliente}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-xs font-medium text-on-surface sm:px-6 lg:px-8">{reserva.actividad}</td>
                    <td className="px-5 py-5 text-xs font-medium text-on-surface-variant sm:px-6 lg:px-8">—</td>
                    <td className="px-5 py-5 text-xs font-bold text-primary sm:px-6 lg:px-8">
                      {reserva.horaInicio} - {reserva.horaFin}
                    </td>
                    <td className="px-5 py-5 sm:px-6 lg:px-8">
                      <StatusChipV2 estado={reserva.estado} />
                    </td>
                    <td className="px-5 py-5 sm:px-6 lg:px-8">
                      <button type="button" className="text-primary transition-transform hover:scale-110">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
