import { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClockIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { HorarioEmpleadoDia, HorarioSemanaEmpleado } from '@/hooks/useHorariosEmpleados';
import {
  HORARIO_DIAS_SEMANA,
  calculateDayTotalMinutes,
  calculateWeekTotalMinutes,
  formatMinutesToDecimalHours,
  formatMinutesToHourMinute,
  formatSpanishDecimal,
  isShiftPairComplete,
  isShiftPairEmpty,
  normalizeTimeValue,
  parseSpanishDecimal,
  timeToMinutes,
} from '@/lib/empleadoHorarios';

interface HorarioEmpleadoCardProps {
  empleadoSemana: HorarioSemanaEmpleado;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onDayChange: (payload: {
    semanaEmpleadoId: string;
    diaSemana: number;
    mananaInicio: string | null;
    mananaFin: string | null;
    tardeInicio: string | null;
    tardeFin: string | null;
  }) => Promise<void>;
  onSummaryChange: (payload: {
    semanaEmpleadoId: string;
    aperturas: number;
    cierres: number;
    horasFinSemana: number;
    nota: string | null;
  }) => Promise<void>;
  onRemove: (semanaEmpleadoId: string) => Promise<void>;
  saving?: boolean;
}

type DraftDaysState = Record<number, HorarioEmpleadoDia>;
type Turno = 'manana' | 'tarde';

interface CopyShiftState {
  diaSemanaOrigen: number;
  turno: Turno;
  diasDestino: number[];
}

function buildDraftDays(days: HorarioEmpleadoDia[]): DraftDaysState {
  return days.reduce<DraftDaysState>((accumulator, day) => {
    accumulator[day.dia_semana] = { ...day };
    return accumulator;
  }, {});
}

export default function HorarioEmpleadoCard({
  empleadoSemana,
  isCollapsed,
  onToggleCollapse,
  onDayChange,
  onSummaryChange,
  onRemove,
  saving = false,
}: HorarioEmpleadoCardProps) {
  const [draftDays, setDraftDays] = useState<DraftDaysState>(() => buildDraftDays(empleadoSemana.dias));
  const [dayErrors, setDayErrors] = useState<Record<number, string>>({});
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copyShift, setCopyShift] = useState<CopyShiftState | null>(null);
  const [summaryForm, setSummaryForm] = useState({
    aperturas: empleadoSemana.aperturas,
    cierres: empleadoSemana.cierres,
    horasFinSemana: formatSpanishDecimal(empleadoSemana.horas_fin_semana || 0),
    nota: empleadoSemana.nota || '',
  });

  useEffect(() => {
    setDraftDays(buildDraftDays(empleadoSemana.dias));
    setSummaryForm({
      aperturas: empleadoSemana.aperturas,
      cierres: empleadoSemana.cierres,
      horasFinSemana: formatSpanishDecimal(empleadoSemana.horas_fin_semana || 0),
      nota: empleadoSemana.nota || '',
    });
    setDayErrors({});
    setCopyError(null);
    setCopyShift(null);
  }, [empleadoSemana]);

  const orderedDays = useMemo(
    () => HORARIO_DIAS_SEMANA.map((day) => draftDays[day.value]).filter(Boolean),
    [draftDays],
  );

  const totalSemanalMinutos = useMemo(
    () => calculateWeekTotalMinutes(orderedDays),
    [orderedDays],
  );

  const updateDraftDayField = (diaSemana: number, field: keyof HorarioEmpleadoDia, value: string) => {
    setDraftDays((current) => ({
      ...current,
      [diaSemana]: {
        ...current[diaSemana],
        [field]: normalizeTimeValue(value),
      },
    }));
  };

  const validateDraftDay = (day: HorarioEmpleadoDia) => {
    const mananaInicio = normalizeTimeValue(day.manana_inicio);
    const mananaFin = normalizeTimeValue(day.manana_fin);
    const tardeInicio = normalizeTimeValue(day.tarde_inicio);
    const tardeFin = normalizeTimeValue(day.tarde_fin);

    if (!isShiftPairEmpty(mananaInicio, mananaFin) && !isShiftPairComplete(mananaInicio, mananaFin)) {
      return 'Completa entrada y salida del turno de manana.';
    }

    if (!isShiftPairEmpty(tardeInicio, tardeFin) && !isShiftPairComplete(tardeInicio, tardeFin)) {
      return 'Completa entrada y salida del turno de tarde.';
    }

    if (isShiftPairComplete(mananaInicio, mananaFin) && timeToMinutes(mananaFin)! <= timeToMinutes(mananaInicio)!) {
      return 'La salida de manana debe ser posterior a la entrada.';
    }

    if (isShiftPairComplete(tardeInicio, tardeFin) && timeToMinutes(tardeFin)! <= timeToMinutes(tardeInicio)!) {
      return 'La salida de tarde debe ser posterior a la entrada.';
    }

    return null;
  };

  const commitDay = async (diaSemana: number) => {
    const day = draftDays[diaSemana];
    if (!day) return;

    const validationError = validateDraftDay(day);
    if (validationError) {
      setDayErrors((current) => ({ ...current, [diaSemana]: validationError }));
      return;
    }

    setDayErrors((current) => {
      const next = { ...current };
      delete next[diaSemana];
      return next;
    });

    await onDayChange({
      semanaEmpleadoId: empleadoSemana.id,
      diaSemana,
      mananaInicio: normalizeTimeValue(day.manana_inicio),
      mananaFin: normalizeTimeValue(day.manana_fin),
      tardeInicio: normalizeTimeValue(day.tarde_inicio),
      tardeFin: normalizeTimeValue(day.tarde_fin),
    });
  };

  const commitSummary = async () => {
    const horasFinSemana = parseSpanishDecimal(summaryForm.horasFinSemana);
    await onSummaryChange({
      semanaEmpleadoId: empleadoSemana.id,
      aperturas: Number(summaryForm.aperturas || 0),
      cierres: Number(summaryForm.cierres || 0),
      horasFinSemana,
      nota: summaryForm.nota.trim() || null,
    });
    setSummaryForm((current) => ({ ...current, horasFinSemana: formatSpanishDecimal(horasFinSemana) }));
  };

  const abrirCopiadoTurno = (diaSemanaOrigen: number, turno: Turno) => {
    const diasDestino = HORARIO_DIAS_SEMANA
      .map((day) => day.value)
      .filter((day) => day !== diaSemanaOrigen);

    setCopyError(null);
    setCopyShift({
      diaSemanaOrigen,
      turno,
      diasDestino,
    });
  };

  const toggleDiaDestinoCopiado = (diaSemana: number) => {
    if (!copyShift) return;
    setCopyShift((current) => {
      if (!current) return current;
      return {
        ...current,
        diasDestino: current.diasDestino.includes(diaSemana)
          ? current.diasDestino.filter((day) => day !== diaSemana)
          : [...current.diasDestino, diaSemana].sort((a, b) => a - b),
      };
    });
  };

  const aplicarCopiaTurno = async () => {
    if (!copyShift) return;

    const sourceDay = draftDays[copyShift.diaSemanaOrigen];
    if (!sourceDay) return;

    const inicioKey = `${copyShift.turno}_inicio` as const;
    const finKey = `${copyShift.turno}_fin` as const;
    const sourceInicio = normalizeTimeValue(sourceDay[inicioKey]);
    const sourceFin = normalizeTimeValue(sourceDay[finKey]);

    if (!isShiftPairComplete(sourceInicio, sourceFin)) {
      setCopyError(`El turno de ${copyShift.turno === 'manana' ? 'manana' : 'tarde'} del dia origen debe tener entrada y salida.`);
      return;
    }

    if (!copyShift.diasDestino.length) {
      setCopyError('Selecciona al menos un dia destino.');
      return;
    }

    setCopyError(null);

    setDraftDays((current) => {
      const next = { ...current };
      copyShift.diasDestino.forEach((diaSemana) => {
        const day = next[diaSemana];
        if (!day) return;
        next[diaSemana] = {
          ...day,
          [inicioKey]: sourceInicio,
          [finKey]: sourceFin,
        };
      });
      return next;
    });

    try {
      await Promise.all(copyShift.diasDestino.map(async (diaSemana) => {
        const targetDay = draftDays[diaSemana];
        if (!targetDay) return;

        const patchedDay: HorarioEmpleadoDia = {
          ...targetDay,
          [inicioKey]: sourceInicio,
          [finKey]: sourceFin,
        };

        await onDayChange({
          semanaEmpleadoId: empleadoSemana.id,
          diaSemana,
          mananaInicio: normalizeTimeValue(patchedDay.manana_inicio),
          mananaFin: normalizeTimeValue(patchedDay.manana_fin),
          tardeInicio: normalizeTimeValue(patchedDay.tarde_inicio),
          tardeFin: normalizeTimeValue(patchedDay.tarde_fin),
        });
      }));
      setCopyShift(null);
    } catch (error) {
      console.error('Error copiando turno:', error);
      setCopyError('No se pudo copiar el turno a todos los dias seleccionados.');
    }
  };

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
      <div className="flex flex-col gap-4 border-b border-outline-variant/20 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-outline">Empleado</p>
          <h3 className="mt-1 font-headline text-2xl font-extrabold text-primary-dark">
            {empleadoSemana.empleado.nombre} {empleadoSemana.empleado.apellidos}
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            {empleadoSemana.empleado.email || 'Sin email'} · {empleadoSemana.empleado.movil || 'Sin movil'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Total semanal</p>
            <div className="mt-1 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-primary" />
              <span className="text-xl font-black text-primary-dark">
                {formatMinutesToDecimalHours(totalSemanalMinutos)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high"
          >
            {isCollapsed ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronUpIcon className="h-4 w-4" />}
            {isCollapsed ? 'Desplegar' : 'Plegar'}
          </button>

          <button
            type="button"
            onClick={() => void onRemove(empleadoSemana.id)}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            <TrashIcon className="h-4 w-4" />
            Quitar
          </button>
        </div>
      </div>

      {isCollapsed ? null : (
        <>
          <div className="overflow-x-auto px-4 py-4 sm:px-6">
            <table className="min-w-[900px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/70">
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Dia
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Manana entrada
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Manana salida
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Tarde entrada
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Tarde salida
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Total
                  </th>
                  <th className="border-b border-outline-variant/20 px-4 py-3 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Copiar
                  </th>
                </tr>
              </thead>
              <tbody>
                {HORARIO_DIAS_SEMANA.map((dayLabel, index) => {
                  const day = draftDays[dayLabel.value];
                  if (!day) return null;

                  const dayError = dayErrors[dayLabel.value];
                  const totalDia = calculateDayTotalMinutes(day);
                  const rowClassName = index % 2 ? 'bg-surface-container-low/25' : '';
                  const inputClassName =
                    'h-10 w-full rounded-xl border border-outline-variant/35 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

                  return (
                    <tr key={dayLabel.value} className={`${rowClassName} border-b border-outline-variant/10 align-top`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold capitalize text-on-surface">{dayLabel.label}</div>
                        {dayError ? <div className="mt-1 max-w-[160px] text-xs text-red-600">{dayError}</div> : null}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={day.manana_inicio || ''}
                          onChange={(event) => updateDraftDayField(dayLabel.value, 'manana_inicio', event.target.value)}
                          onBlur={() => void commitDay(dayLabel.value)}
                          className={inputClassName}
                          disabled={saving}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={day.manana_fin || ''}
                          onChange={(event) => updateDraftDayField(dayLabel.value, 'manana_fin', event.target.value)}
                          onBlur={() => void commitDay(dayLabel.value)}
                          className={inputClassName}
                          disabled={saving}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={day.tarde_inicio || ''}
                          onChange={(event) => updateDraftDayField(dayLabel.value, 'tarde_inicio', event.target.value)}
                          onBlur={() => void commitDay(dayLabel.value)}
                          className={inputClassName}
                          disabled={saving}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="time"
                          value={day.tarde_fin || ''}
                          onChange={(event) => updateDraftDayField(dayLabel.value, 'tarde_fin', event.target.value)}
                          onBlur={() => void commitDay(dayLabel.value)}
                          className={inputClassName}
                          disabled={saving}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-on-surface">
                        {formatMinutesToHourMinute(totalDia)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                            onClick={() => abrirCopiadoTurno(dayLabel.value, 'manana')}
                            disabled={saving}
                          >
                            <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                            Copiar mañana
                          </button>
                          <button
                            type="button"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                            onClick={() => abrirCopiadoTurno(dayLabel.value, 'tarde')}
                            disabled={saving}
                          >
                            <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                            Copiar tarde
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {copyShift ? (
            <div className="border-t border-outline-variant/20 px-4 py-4 sm:px-6">
              <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-primary">
                  Copiar turno de {copyShift.turno === 'manana' ? 'manana' : 'tarde'} desde {HORARIO_DIAS_SEMANA.find((day) => day.value === copyShift.diaSemanaOrigen)?.label}
                </h4>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Selecciona los dias destino para aplicar el mismo turno.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {HORARIO_DIAS_SEMANA.filter((day) => day.value !== copyShift.diaSemanaOrigen).map((day) => (
                    <label
                      key={day.value}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
                    >
                      <input
                        type="checkbox"
                        checked={copyShift.diasDestino.includes(day.value)}
                        onChange={() => toggleDiaDestinoCopiado(day.value)}
                        className="h-4 w-4 rounded border-outline-variant/45 text-primary focus:ring-primary/20"
                        disabled={saving}
                      />
                      <span className="capitalize">{day.label}</span>
                    </label>
                  ))}
                </div>

                {copyError ? <p className="mt-3 text-sm text-red-600">{copyError}</p> : null}

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="min-h-10 cursor-pointer rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-low"
                    onClick={() => setCopyShift(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="min-h-10 cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void aplicarCopiaTurno()}
                    disabled={saving}
                  >
                    Aplicar copia
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 border-t border-outline-variant/20 px-4 py-4 sm:px-6 lg:grid-cols-4">
            <div>
              <label htmlFor={`aperturas-${empleadoSemana.id}`} className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                Aperturas
              </label>
              <input
                id={`aperturas-${empleadoSemana.id}`}
                type="number"
                min="0"
                value={summaryForm.aperturas}
                onChange={(event) => setSummaryForm((current) => ({ ...current, aperturas: Number(event.target.value || 0) }))}
                onBlur={() => void commitSummary()}
                className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor={`cierres-${empleadoSemana.id}`} className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                Cierres
              </label>
              <input
                id={`cierres-${empleadoSemana.id}`}
                type="number"
                min="0"
                value={summaryForm.cierres}
                onChange={(event) => setSummaryForm((current) => ({ ...current, cierres: Number(event.target.value || 0) }))}
                onBlur={() => void commitSummary()}
                className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor={`fin-semana-${empleadoSemana.id}`} className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                Horas fin de semana
              </label>
              <input
                id={`fin-semana-${empleadoSemana.id}`}
                type="text"
                inputMode="decimal"
                value={summaryForm.horasFinSemana}
                onChange={(event) => setSummaryForm((current) => ({ ...current, horasFinSemana: event.target.value.replace('.', ',') }))}
                onBlur={() => void commitSummary()}
                className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                disabled={saving}
              />
            </div>

            <div className="lg:col-span-4">
              <label htmlFor={`nota-${empleadoSemana.id}`} className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                Nota
              </label>
              <textarea
                id={`nota-${empleadoSemana.id}`}
                rows={3}
                value={summaryForm.nota}
                onChange={(event) => setSummaryForm((current) => ({ ...current, nota: event.target.value }))}
                onBlur={() => void commitSummary()}
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Anotaciones internas para esta semana..."
                disabled={saving}
              />
            </div>
          </div>
        </>
      )}
    </article>
  );
}
