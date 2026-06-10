'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ClockIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useActividades, type Reserva, type ReservaServicioItemInput } from '@/hooks/useActividades';

interface ModalPendientesTramosCursoProps {
  isOpen: boolean;
  onClose: () => void;
  reservas: Reserva[];
  onReservaActualizada: () => Promise<void> | void;
}

interface CursoRangeDraft {
  id: string;
  fechaInicio: string;
  horaInicio: string;
  horaFin: string;
}

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeInputValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function createCursoRangeDraft(dateValue = getTodayInputValue(), timeValue = getCurrentTimeInputValue()): CursoRangeDraft {
  return {
    id: `${dateValue}-${timeValue}-${Math.random().toString(36).slice(2, 8)}`,
    fechaInicio: dateValue,
    horaInicio: timeValue,
    horaFin: ''
  };
}

function calculateCourseRangeDuration(range: CursoRangeDraft) {
  if (!range.fechaInicio || !range.horaInicio || !range.horaFin) {
    return 0;
  }

  const inicio = new Date(`${range.fechaInicio}T${range.horaInicio}:00`);
  const fin = new Date(`${range.fechaInicio}T${range.horaFin}:00`);
  const diffMs = fin.getTime() - inicio.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function compareCursoRanges(left: CursoRangeDraft, right: CursoRangeDraft) {
  return new Date(`${left.fechaInicio}T${left.horaInicio}:00`).getTime() - new Date(`${right.fechaInicio}T${right.horaInicio}:00`).getTime();
}

function calculateDurationFromIso(inicio: string, fin: string) {
  const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function formatDurationSummary(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 min';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getAssignmentLabel(estado?: Reserva['estado_asignacion_tramos']) {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente de asignar';
    case 'parcial':
      return 'Asignación parcial';
    case 'completa':
      return 'Horas completas';
    default:
      return 'No aplica';
  }
}

function getAssignmentColor(estado?: Reserva['estado_asignacion_tramos']) {
  switch (estado) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-700';
    case 'parcial':
      return 'bg-sky-100 text-sky-700';
    case 'completa':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}

function buildRangeItems(reserva: Reserva, ranges: CursoRangeDraft[]): ReservaServicioItemInput[] {
  const sortedRanges = [...ranges].sort(compareCursoRanges);
  const totalMinutes = sortedRanges.reduce((sum, range) => sum + calculateCourseRangeDuration(range), 0);
  const expectedSubtotal = reserva.duracion_total_min && reserva.duracion_total_min > 0
    ? Number(((reserva.precio * totalMinutes) / reserva.duracion_total_min).toFixed(2))
    : 0;

  const baseItems = sortedRanges.map((range, index) => {
    const inicio = new Date(`${range.fechaInicio}T${range.horaInicio}:00`).toISOString();
    const fin = new Date(`${range.fechaInicio}T${range.horaFin}:00`).toISOString();
    const duration = calculateCourseRangeDuration(range);
    const rawSubtotal = reserva.duracion_total_min && reserva.duracion_total_min > 0
      ? Number(((reserva.precio * duration) / reserva.duracion_total_min).toFixed(2))
      : 0;

    return {
      index,
      inicio,
      fin,
      cantidad: Math.max(1, reserva.cantidad_reservada),
      subtotal: rawSubtotal
    };
  });

  const subtotalRounded = baseItems.reduce((sum, item) => sum + item.subtotal, 0);
  const adjustment = Number((expectedSubtotal - subtotalRounded).toFixed(2));

  return baseItems.map((item) => ({
    inicio: item.inicio,
    fin: item.fin,
    cantidad: item.cantidad,
    subtotal: Number((item.subtotal + (item.index === baseItems.length - 1 ? adjustment : 0)).toFixed(2)),
    tarifa_id: reserva.tarifa_id ?? null
  }));
}

export default function ModalPendientesTramosCurso({
  isOpen,
  onClose,
  reservas,
  onReservaActualizada
}: ModalPendientesTramosCursoProps) {
  const { asignarTramosReservaCurso, loading } = useActividades();
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);
  const [rangeEditor, setRangeEditor] = useState<CursoRangeDraft[]>([]);
  const [rangeErrors, setRangeErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedReserva = useMemo(
    () => reservas.find((reserva) => reserva.id === selectedReservaId) ?? null,
    [reservas, selectedReservaId]
  );

  const sortedAssignedItems = useMemo(
    () => [...(selectedReserva?.items ?? [])].sort((left, right) => new Date(left.inicio).getTime() - new Date(right.inicio).getTime()),
    [selectedReserva]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedReservaId((current) => current && reservas.some((reserva) => reserva.id === current) ? current : (reservas[0]?.id ?? null));
  }, [isOpen, reservas]);

  useEffect(() => {
    if (!isOpen) {
      setRangeEditor([]);
      setRangeErrors({});
      return;
    }

    const firstDate = sortedAssignedItems[sortedAssignedItems.length - 1]
      ? new Date(sortedAssignedItems[sortedAssignedItems.length - 1].fin)
      : null;
    const nextDate = firstDate
      ? `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}-${String(firstDate.getDate()).padStart(2, '0')}`
      : getTodayInputValue();
    const nextTime = firstDate
      ? `${String(firstDate.getHours()).padStart(2, '0')}:${String(firstDate.getMinutes()).padStart(2, '0')}`
      : getCurrentTimeInputValue();

    setRangeEditor([createCursoRangeDraft(nextDate, nextTime)]);
    setRangeErrors({});
  }, [isOpen, selectedReservaId, sortedAssignedItems]);

  const assignedMinutes = selectedReserva?.duracion_asignada_min ?? 0;
  const remainingMinutes = selectedReserva?.duracion_restante_min ?? 0;
  const totalMinutes = selectedReserva?.duracion_total_min ?? 0;
  const editorAssignedMinutes = useMemo(
    () => rangeEditor.reduce((sum, range) => sum + calculateCourseRangeDuration(range), 0),
    [rangeEditor]
  );

  const updateEditorField = (rangeId: string, field: keyof CursoRangeDraft, value: string) => {
    setRangeEditor((prev) => prev.map((range) => (range.id === rangeId ? { ...range, [field]: value } : range)));
    setRangeErrors((prev) => {
      const next = { ...prev };
      delete next[rangeId];
      delete next.__summary;
      return next;
    });
  };

  const addEditorRow = () => {
    const lastRange = rangeEditor[rangeEditor.length - 1];
    setRangeEditor((prev) => [...prev, createCursoRangeDraft(lastRange?.fechaInicio || getTodayInputValue(), lastRange?.horaFin || getCurrentTimeInputValue())]);
  };

  const removeEditorRow = (rangeId: string) => {
    setRangeEditor((prev) => prev.filter((range) => range.id !== rangeId));
    setRangeErrors((prev) => {
      const next = { ...prev };
      delete next[rangeId];
      delete next.__summary;
      return next;
    });
  };

  const handleAsignarTramos = async () => {
    if (!selectedReserva) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    const sortedRanges = [...rangeEditor].sort(compareCursoRanges);

    if (sortedRanges.length === 0) {
      nextErrors.__summary = 'Añade al menos un tramo.';
    }

    sortedRanges.forEach((range) => {
      if (!range.fechaInicio || !range.horaInicio || !range.horaFin) {
        nextErrors[range.id] = 'Completa fecha y horario del tramo.';
        return;
      }

      if (calculateCourseRangeDuration(range) <= 0) {
        nextErrors[range.id] = 'La hora de fin debe ser posterior a la hora de inicio.';
      }
    });

    for (let index = 1; index < sortedRanges.length; index += 1) {
      const previousEnd = new Date(`${sortedRanges[index - 1].fechaInicio}T${sortedRanges[index - 1].horaFin}:00`).getTime();
      const currentStart = new Date(`${sortedRanges[index].fechaInicio}T${sortedRanges[index].horaInicio}:00`).getTime();
      if (previousEnd > currentStart) {
        nextErrors[sortedRanges[index].id] = 'Este tramo se solapa con el anterior.';
      }
    }

    const requestedMinutes = sortedRanges.reduce((sum, range) => sum + calculateCourseRangeDuration(range), 0);
    if (requestedMinutes > remainingMinutes) {
      nextErrors.__summary = `Los nuevos tramos superan las horas pendientes (${formatDurationSummary(remainingMinutes)}).`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setRangeErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const items = buildRangeItems(selectedReserva, sortedRanges);
      const result = await asignarTramosReservaCurso(selectedReserva.id, items);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success('Tramos asignados correctamente');
      await Promise.resolve(onReservaActualizada());
      setRangeEditor([createCursoRangeDraft()]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl">
                <div className="primary-gradient flex items-center justify-between px-6 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/15 p-2">
                      <ClockIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <Dialog.Title className="font-headline text-2xl font-extrabold tracking-tight">Cursos pendientes de asignar</Dialog.Title>
                      <p className="text-sm text-white/85">Gestiona ventas de cursos multi-tramo sin horario completo asignado.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-white/20 p-2 transition hover:bg-white/10 cursor-pointer"
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <aside className="border-b border-outline-variant/20 bg-surface-container-low lg:border-b-0 lg:border-r">
                    <div className="px-5 py-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-outline">{reservas.length} reservas pendientes</p>
                    </div>
                    <div className="max-h-[65vh] space-y-3 overflow-y-auto px-4 pb-4">
                      {reservas.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-lowest px-4 py-8 text-center text-sm text-on-surface-variant">
                          No quedan cursos pendientes de asignar.
                        </div>
                      ) : (
                        reservas.map((reserva) => (
                          <button
                            key={reserva.id}
                            type="button"
                            onClick={() => setSelectedReservaId(reserva.id)}
                            className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                              selectedReservaId === reserva.id
                                ? 'border-primary/35 bg-primary/5 shadow-md shadow-primary/10'
                                : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/20 hover:bg-surface-container-low'
                            } cursor-pointer`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-on-surface">{reserva.actividad?.nombre || 'Curso'}</p>
                                <p className="mt-1 text-sm text-on-surface-variant">
                                  {reserva.cliente ? `${reserva.cliente.nombre} ${reserva.cliente.apellidos}` : 'Cliente no establecido'}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getAssignmentColor(reserva.estado_asignacion_tramos)}`}>
                                {getAssignmentLabel(reserva.estado_asignacion_tramos)}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-on-surface-variant">
                              <div className="rounded-xl bg-surface-container px-3 py-2">
                                <div className="font-bold text-on-surface">{formatDurationSummary(reserva.duracion_total_min ?? 0)}</div>
                                <div>Total</div>
                              </div>
                              <div className="rounded-xl bg-surface-container px-3 py-2">
                                <div className="font-bold text-on-surface">{formatDurationSummary(reserva.duracion_asignada_min ?? 0)}</div>
                                <div>Asignadas</div>
                              </div>
                              <div className="rounded-xl bg-surface-container px-3 py-2">
                                <div className="font-bold text-on-surface">{formatDurationSummary(reserva.duracion_restante_min ?? 0)}</div>
                                <div>Restantes</div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </aside>

                  <section className="max-h-[65vh] overflow-y-auto px-5 py-5">
                    {selectedReserva ? (
                      <div className="space-y-5">
                        <div className="rounded-[1.5rem] border border-outline-variant/25 bg-surface-container-low p-4">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Reserva seleccionada</p>
                              <h3 className="mt-1 font-headline text-2xl font-extrabold text-on-surface">{selectedReserva.actividad?.nombre || 'Curso'}</h3>
                              <p className="mt-2 text-sm text-on-surface-variant">
                                {selectedReserva.cliente ? `${selectedReserva.cliente.nombre} ${selectedReserva.cliente.apellidos}` : 'Cliente no establecido'}
                              </p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getAssignmentColor(selectedReserva.estado_asignacion_tramos)}`}>
                              {getAssignmentLabel(selectedReserva.estado_asignacion_tramos)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Total</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">{formatDurationSummary(totalMinutes)}</div>
                            </div>
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Asignadas</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">{formatDurationSummary(assignedMinutes)}</div>
                            </div>
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Restantes</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">{formatDurationSummary(remainingMinutes)}</div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-outline-variant/25 bg-surface-container-low p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-headline text-lg font-bold text-on-surface">Nuevos tramos</h4>
                              <p className="text-sm text-on-surface-variant">Puedes asignar una parte o la totalidad de las horas pendientes.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addEditorRow}
                              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 cursor-pointer"
                            >
                              <PlusIcon className="h-4 w-4" />
                              Añadir tramo
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {rangeEditor.map((range, index) => (
                              <div key={range.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-on-surface">Tramo {index + 1}</p>
                                  {rangeEditor.length > 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => removeEditorRow(range.id)}
                                      className="rounded-full border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 cursor-pointer"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  ) : null}
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                  <div>
                                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Fecha</label>
                                    <input
                                      type="date"
                                      value={range.fechaInicio}
                                      onChange={(event) => updateEditorField(range.id, 'fechaInicio', event.target.value)}
                                      min={getTodayInputValue()}
                                      className="activities-date-input w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Inicio</label>
                                    <input
                                      type="time"
                                      value={range.horaInicio}
                                      onChange={(event) => updateEditorField(range.id, 'horaInicio', event.target.value)}
                                      className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Fin</label>
                                    <input
                                      type="time"
                                      value={range.horaFin}
                                      onChange={(event) => updateEditorField(range.id, 'horaFin', event.target.value)}
                                      className="w-full rounded-2xl border border-outline-variant/35 bg-surface-container-low px-3 py-2 text-sm text-on-surface shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/15"
                                    />
                                  </div>
                                </div>

                                <div className="mt-3 text-sm text-on-surface-variant">
                                  Duración: <span className="font-semibold text-on-surface">{formatDurationSummary(calculateCourseRangeDuration(range))}</span>
                                </div>

                                {rangeErrors[range.id] ? (
                                  <p className="mt-2 text-sm text-red-600">{rangeErrors[range.id]}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Nuevas horas</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">{formatDurationSummary(editorAssignedMinutes)}</div>
                            </div>
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Horas restantes</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">{formatDurationSummary(Math.max(remainingMinutes - editorAssignedMinutes, 0))}</div>
                            </div>
                            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                              <div className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Precio reserva</div>
                              <div className="mt-1 text-lg font-bold text-on-surface">
                                {new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(selectedReserva.precio)} €
                              </div>
                            </div>
                          </div>

                          {rangeErrors.__summary ? (
                            <p className="mt-4 text-sm font-semibold text-red-600">{rangeErrors.__summary}</p>
                          ) : null}

                          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={onClose}
                              className="rounded-full border border-outline-variant/35 bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                            >
                              Cerrar
                            </button>
                            <button
                              type="button"
                              onClick={handleAsignarTramos}
                              disabled={submitting || loading}
                              className="primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                              {submitting || loading ? 'Guardando...' : 'Guardar tramos'}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-outline-variant/25 bg-surface-container-low p-4">
                          <h4 className="font-headline text-lg font-bold text-on-surface">Tramos ya asignados</h4>
                          {sortedAssignedItems.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              {sortedAssignedItems.map((item, index) => (
                                <div key={item.id} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="font-semibold text-on-surface">Tramo {index + 1}</p>
                                      <p className="text-sm text-on-surface-variant">
                                        {formatDisplayDate(item.inicio.slice(0, 10))} · {new Date(item.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(item.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    <div className="text-sm font-semibold text-on-surface">{formatDurationSummary(calculateDurationFromIso(item.inicio, item.fin))}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-lowest px-4 py-6 text-sm text-on-surface-variant">
                              Esta reserva todavía no tiene tramos asignados.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
                        Selecciona una reserva pendiente para asignar sus horas.
                      </div>
                    )}
                  </section>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
