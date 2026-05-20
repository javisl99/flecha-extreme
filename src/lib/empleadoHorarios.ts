export interface HorarioDiaValores {
  manana_inicio: string | null;
  manana_fin: string | null;
  tarde_inicio: string | null;
  tarde_fin: string | null;
}

export const HORARIO_DIAS_SEMANA = [
  { value: 1, label: 'lunes' },
  { value: 2, label: 'martes' },
  { value: 3, label: 'miercoles' },
  { value: 4, label: 'jueves' },
  { value: 5, label: 'viernes' },
  { value: 6, label: 'sabado' },
  { value: 7, label: 'domingo' },
] as const;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function normalizeTimeValue(value?: string | null) {
  const normalized = value?.trim() ?? '';
  return normalized ? normalized.slice(0, 5) : null;
}

export function getStartOfWeekMonday(input: Date | string) {
  const date = typeof input === 'string' ? parseLocalDate(input) : new Date(input);
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + (days * DAY_IN_MS));
}

export function formatDateInputValue(input: Date | string) {
  const date = typeof input === 'string' ? parseLocalDate(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatWeekRangeLabel(weekStart: string | Date) {
  const start = typeof weekStart === 'string' ? parseLocalDate(weekStart) : weekStart;
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${formatter.format(end)}`;
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export function timeToMinutes(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
}

export function calculateShiftMinutes(start?: string | null, end?: string | null) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null) return 0;
  return Math.max(0, endMinutes - startMinutes);
}

export function calculateDayTotalMinutes(day: HorarioDiaValores) {
  return calculateShiftMinutes(day.manana_inicio, day.manana_fin) + calculateShiftMinutes(day.tarde_inicio, day.tarde_fin);
}

export function calculateWeekTotalMinutes(days: HorarioDiaValores[]) {
  return days.reduce((total, day) => total + calculateDayTotalMinutes(day), 0);
}

export function formatMinutesToHourMinute(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${`${minutes}`.padStart(2, '0')}`;
}

export function formatMinutesToDecimalHours(totalMinutes: number) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalMinutes / 60);
}

export function parseSpanishDecimal(value: string | number | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatSpanishDecimal(value: number, minFractionDigits = 2, maxFractionDigits = 2) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

export function isShiftPairComplete(start?: string | null, end?: string | null) {
  return Boolean(normalizeTimeValue(start) && normalizeTimeValue(end));
}

export function isShiftPairEmpty(start?: string | null, end?: string | null) {
  return !normalizeTimeValue(start) && !normalizeTimeValue(end);
}

export function buildEmptyWeekDays() {
  return HORARIO_DIAS_SEMANA.map((day) => ({
    dia_semana: day.value,
    manana_inicio: null,
    manana_fin: null,
    tarde_inicio: null,
    tarde_fin: null,
  }));
}
