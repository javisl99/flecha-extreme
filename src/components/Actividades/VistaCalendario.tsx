'use client';

import { useEffect, useMemo, useState } from 'react';
import ModalDetalleReserva from './ModalDetalleReserva';

type CalendarView = 'month' | 'week' | 'day';

interface Reserva {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  cliente?: {
    nombre: string;
    apellidos: string;
  };
  actividad?: {
    nombre: string;
  };
  empresa?: {
    nombre: string;
  };
  estado: string;
  precio: number;
  cantidad_reservada: number;
  nota?: string;
}

interface VistaCalendarioProps {
  reservas: Reserva[];
  onActualizarEstado?: (reserva: Reserva, nuevoEstado: string) => void;
}

interface EventoCalendario {
  id: string;
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  resource: Reserva;
  estado: Reserva['estado'];
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' });
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit' });
const DAY_TITLE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const isSameMonth = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();

const toMondayBasedWeekStart = (date: Date) => {
  const next = startOfDay(date);
  const currentWeekday = (next.getDay() + 6) % 7; // Lunes=0
  next.setDate(next.getDate() - currentWeekday);
  return next;
};

const toWeekRange = (date: Date) => {
  const start = toMondayBasedWeekStart(date);
  const end = addDays(start, 6);
  return { start, end };
};

const getEstadoClasses = (estado: string) => {
  switch (estado) {
    case 'confirmada':
      return {
        chip: 'bg-green-100 text-green-700',
        event: 'border-green-200 bg-green-50 text-green-900',
        dot: 'bg-green-500',
      };
    case 'pendiente':
      return {
        chip: 'bg-amber-100 text-amber-700',
        event: 'border-amber-200 bg-amber-50 text-amber-900',
        dot: 'bg-amber-500',
      };
    case 'cancelada':
      return {
        chip: 'bg-red-100 text-red-700',
        event: 'border-red-200 bg-red-50 text-red-900',
        dot: 'bg-red-500',
      };
    case 'completada':
      return {
        chip: 'bg-blue-100 text-blue-700',
        event: 'border-blue-200 bg-blue-50 text-blue-900',
        dot: 'bg-blue-500',
      };
    default:
      return {
        chip: 'bg-surface-container-high text-on-surface-variant',
        event: 'border-outline-variant/45 bg-surface-container-low text-on-surface',
        dot: 'bg-outline',
      };
  }
};

const buildViewTitle = (view: CalendarView, date: Date) => {
  if (view === 'month') {
    const monthText = MONTH_FORMATTER.format(date);
    return monthText.charAt(0).toUpperCase() + monthText.slice(1);
  }

  if (view === 'week') {
    const { start, end } = toWeekRange(date);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const month = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(start);
      return `${start.getDate()} - ${end.getDate()} ${month}`;
    }
    return `${SHORT_DATE_FORMATTER.format(start)} - ${SHORT_DATE_FORMATTER.format(end)}`;
  }

  const dayText = DAY_TITLE_FORMATTER.format(date);
  return dayText.charAt(0).toUpperCase() + dayText.slice(1);
};

export default function VistaCalendario({ reservas, onActualizarEstado }: VistaCalendarioProps) {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setView('day');
    }
  }, []);

  const eventos = useMemo(
    () =>
      reservas
        .map((reserva): EventoCalendario => {
          const start = new Date(reserva.fecha_inicio);
          const end = new Date(reserva.fecha_fin);
          const actividad = reserva.actividad?.nombre || 'Actividad no encontrada';
          const cliente = reserva.cliente
            ? `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`
            : 'Cliente no establecido';
          const empresa = reserva.empresa?.nombre || 'Empresa no establecida';

          return {
            id: reserva.id,
            title: actividad,
            subtitle: `${cliente} · ${empresa}`,
            start,
            end,
            resource: reserva,
            estado: reserva.estado,
          };
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [reservas]
  );

  const eventosDelDia = (day: Date) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return eventos.filter((evento) => evento.start <= dayEnd && evento.end >= dayStart);
  };

  const monthDays = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const gridStart = toMondayBasedWeekStart(monthStart);
    const gridEnd = addDays(toMondayBasedWeekStart(monthEnd), 6);

    const days: Date[] = [];
    for (let day = new Date(gridStart); day <= gridEnd; day = addDays(day, 1)) {
      days.push(new Date(day));
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const { start } = toWeekRange(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [currentDate]);

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const amount = direction === 'prev' ? -1 : 1;
    if (view === 'month') {
      setCurrentDate((prev) => addMonths(prev, amount));
      return;
    }

    if (view === 'week') {
      setCurrentDate((prev) => addDays(prev, amount * 7));
      return;
    }

    setCurrentDate((prev) => addDays(prev, amount));
  };

  const handleDayFocus = (day: Date) => {
    setCurrentDate(day);
    setView('day');
  };

  const handleActualizarEstadoReserva = (reserva: Reserva, nuevoEstado: string) => {
    onActualizarEstado?.(reserva, nuevoEstado);
    setReservaSeleccionada(null);
  };

  const today = new Date();
  const title = buildViewTitle(view, currentDate);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-3 py-2">
          <button
            type="button"
            onClick={() => handleNavigate('prev')}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('today')}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('next')}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
          >
            Siguiente
          </button>
        </div>

        <h2 className="font-headline text-xl font-extrabold text-primary-dark sm:text-2xl">{title}</h2>

        <div className="inline-flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container-low p-1">
          {[
            { key: 'day', label: 'Día' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mes' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setView(option.key as CalendarView)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                view === option.key
                  ? 'primary-gradient text-white shadow-md shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-lowest hover:text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {[
          { key: 'confirmada', label: 'Confirmada' },
          { key: 'pendiente', label: 'Pendiente' },
          { key: 'cancelada', label: 'Cancelada' },
          { key: 'completada', label: 'Completada' },
        ].map((estado) => (
          <div key={estado.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${getEstadoClasses(estado.key).dot}`} />
            <span className="text-sm font-medium text-on-surface-variant">{estado.label}</span>
          </div>
        ))}
      </div>

      {view === 'month' ? (
        <div className="overflow-x-auto rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <div className="min-w-[48rem]">
            <div className="grid grid-cols-7 border-b border-outline-variant/20 bg-surface-container-low">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="px-3 py-3 text-center text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dailyEvents = eventosDelDia(day);
                const inCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleDayFocus(day)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleDayFocus(day);
                      }
                    }}
                    className={`min-h-36 border-b border-r border-outline-variant/20 p-2 transition ${
                      inCurrentMonth ? 'bg-surface-container-lowest' : 'bg-surface-container-low/55'
                    } hover:bg-surface-container-low cursor-pointer`}
                  >
                    <div className="mb-2 flex justify-end">
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${
                          isToday ? 'bg-primary text-white' : 'text-on-surface-variant'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {dailyEvents.slice(0, 3).map((evento) => {
                        const estadoStyles = getEstadoClasses(evento.estado);
                        return (
                          <button
                            key={evento.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReservaSeleccionada(evento.resource);
                            }}
                            className={`w-full rounded-lg border px-2 py-1 text-left transition hover:scale-[1.01] ${estadoStyles.event}`}
                          >
                            <p className="truncate text-[10px] font-black uppercase tracking-[0.08em]">
                              {TIME_FORMATTER.format(evento.start)}
                            </p>
                            <p className="truncate text-xs font-semibold">{evento.title}</p>
                          </button>
                        );
                      })}
                      {dailyEvents.length > 3 ? (
                        <p className="px-1 text-[11px] font-semibold text-primary">+{dailyEvents.length - 3} más</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="overflow-x-auto rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-card-ambient">
          <div className="grid min-w-[48rem] grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dailyEvents = eventosDelDia(day);
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-low"
                >
                  <button
                    type="button"
                    onClick={() => handleDayFocus(day)}
                    className={`w-full border-b border-outline-variant/20 px-3 py-2 text-left text-sm font-bold transition ${
                      isToday ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface'
                    }`}
                  >
                    {DAY_LABEL_FORMATTER.format(day)}
                  </button>

                  <div className="space-y-2 p-2">
                    {dailyEvents.length === 0 ? (
                      <p className="rounded-lg bg-surface-container-lowest px-2 py-2 text-xs text-outline">Sin reservas</p>
                    ) : (
                      dailyEvents.map((evento) => {
                        const estadoStyles = getEstadoClasses(evento.estado);
                        return (
                          <button
                            key={evento.id}
                            type="button"
                            onClick={() => setReservaSeleccionada(evento.resource)}
                            className={`w-full rounded-lg border p-2 text-left transition hover:scale-[1.01] ${estadoStyles.event}`}
                          >
                            <p className="text-[11px] font-black uppercase tracking-[0.08em]">
                              {TIME_FORMATTER.format(evento.start)} - {TIME_FORMATTER.format(evento.end)}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold">{evento.title}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {view === 'day' ? (
        <div className="rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card-ambient">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline text-xl font-extrabold text-primary-dark">
              Agenda del día
            </h3>
            <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-outline">
              {DAY_LABEL_FORMATTER.format(currentDate)}
            </span>
          </div>

          <div className="space-y-3">
            {eventosDelDia(currentDate).length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                No hay actividades para este día.
              </div>
            ) : (
              eventosDelDia(currentDate).map((evento) => {
                const estadoStyles = getEstadoClasses(evento.estado);
                return (
                  <button
                    key={evento.id}
                    type="button"
                    onClick={() => setReservaSeleccionada(evento.resource)}
                    className={`w-full rounded-xl border p-4 text-left transition hover:scale-[1.005] ${estadoStyles.event}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.08em]">
                          {TIME_FORMATTER.format(evento.start)} - {TIME_FORMATTER.format(evento.end)}
                        </p>
                        <p className="mt-1 text-base font-bold">{evento.title}</p>
                        <p className="mt-1 text-sm opacity-80">{evento.subtitle}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${estadoStyles.chip}`}>
                        {evento.estado}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      <ModalDetalleReserva
        isOpen={!!reservaSeleccionada}
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
        onActualizarEstado={handleActualizarEstadoReserva}
      />
    </section>
  );
}
