export interface ServicioHorarioRegla {
  id: string;
  servicio_id?: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo_desde?: string | null;
  activo_hasta?: string | null;
  capacidad_override?: number | null;
  intervalo_min?: number | null;
}

export interface CampamentoMetadata {
  tipo: 'campamento_recurrente';
  fecha_inicio: string;
  fecha_fin: string;
  dias_semana: number[];
  hora_inicio: string;
  hora_fin: string;
  turno_codigo?: string | null;
  turno_label?: string | null;
}

export interface CampamentoPrograma {
  id: string;
  servicio_id: string;
  servicio_codigo?: string | null;
  servicio_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_semana: number[];
  hora_inicio: string;
  hora_fin: string;
  turno_codigo?: string | null;
  turno_label?: string | null;
  estado: string;
  notas?: string | null;
  total_inscripciones?: number;
  total_participantes?: number;
  total_facturado?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampamentoParticipante {
  id: string;
  reserva_id: string;
  participante_id?: string | null;
  nombre: string;
  dni?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampamentoParticipanteCatalogo {
  id: string;
  nombre: string;
  dni?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampamentoInscripcion {
  id: string;
  campamento_programa_id: string;
  cliente_id?: string | null;
  cliente?: {
    id?: string;
    nombre: string;
    apellidos: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  tarifa_id?: string | null;
  tarifa_codigo?: string | null;
  tarifa_nombre?: string | null;
  cantidad_participantes: number;
  precio_unitario: number;
  precio_total: number;
  estado: string;
  nota?: string | null;
  participantes: CampamentoParticipante[];
  created_at?: string;
  updated_at?: string;
}

export interface ReservaServicioItemMetadata {
  numero_personas?: number;
  campamento?: CampamentoMetadata;
  [key: string]: unknown;
}

export interface CampamentoTurnoOption {
  key: string;
  codigo: string;
  label: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: number[];
}

export interface CampamentoOccurrence {
  date: string;
  start: Date;
  end: Date;
  horaInicio: string;
  horaFin: string;
  diaSemana: number;
}

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mie',
  4: 'Jue',
  5: 'Vie',
  6: 'Sab',
  7: 'Dom'
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function normalizeTimeValue(value: string) {
  return value.slice(0, 5);
}

export function parseLocalDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateInputForDisplay(value: string) {
  const date = parseLocalDateInput(value);
  if (!date) return value;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getWeekdayNumber(date: Date) {
  return ((date.getDay() + 6) % 7) + 1;
}

export function isCampamentoMetadata(value: unknown): value is CampamentoMetadata {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<CampamentoMetadata>;
  return (
    candidate.tipo === 'campamento_recurrente' &&
    typeof candidate.fecha_inicio === 'string' &&
    typeof candidate.fecha_fin === 'string' &&
    Array.isArray(candidate.dias_semana) &&
    typeof candidate.hora_inicio === 'string' &&
    typeof candidate.hora_fin === 'string'
  );
}

export function getCampamentoMetadata(metadata?: ReservaServicioItemMetadata | null) {
  if (!metadata || !isCampamentoMetadata(metadata.campamento)) {
    return null;
  }

  return {
    ...metadata.campamento,
    hora_inicio: normalizeTimeValue(metadata.campamento.hora_inicio),
    hora_fin: normalizeTimeValue(metadata.campamento.hora_fin),
    dias_semana: [...metadata.campamento.dias_semana].sort((a, b) => a - b)
  };
}

export function buildCampamentoTurnoOptions(reglas: ServicioHorarioRegla[]) {
  const grouped = new Map<string, CampamentoTurnoOption>();

  reglas.forEach((regla) => {
    const horaInicio = normalizeTimeValue(regla.hora_inicio);
    const horaFin = normalizeTimeValue(regla.hora_fin);
    const key = `${horaInicio}-${horaFin}`;
    const current = grouped.get(key);

    if (current) {
      if (!current.diasSemana.includes(regla.dia_semana)) {
        current.diasSemana.push(regla.dia_semana);
        current.diasSemana.sort((a, b) => a - b);
      }
      return;
    }

    grouped.set(key, {
      key,
      codigo: key.replace(':', '').replace('-', '_').replace(':', ''),
      label: `${horaInicio} - ${horaFin}`,
      horaInicio,
      horaFin,
      diasSemana: [regla.dia_semana]
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

export function buildCampamentoDaysLabel(diasSemana: number[]) {
  const dias = [...diasSemana].sort((a, b) => a - b);

  if (dias.length === 5 && dias.every((dia, index) => dia === index + 1)) {
    return 'L-V';
  }

  if (dias.length === 7 && dias.every((dia, index) => dia === index + 1)) {
    return 'L-D';
  }

  return dias.map((dia) => WEEKDAY_LABELS[dia] ?? String(dia)).join(', ');
}

export function buildCampamentoHorarioSummary(campamento: CampamentoMetadata) {
  return `${buildCampamentoDaysLabel(campamento.dias_semana)} · ${normalizeTimeValue(campamento.hora_inicio)} - ${normalizeTimeValue(campamento.hora_fin)}`;
}

export function buildCampamentoDateRangeLabel(campamento: CampamentoMetadata) {
  const inicio = formatDateInputForDisplay(campamento.fecha_inicio);
  const fin = formatDateInputForDisplay(campamento.fecha_fin);
  return campamento.fecha_inicio === campamento.fecha_fin ? inicio : `${inicio} - ${fin}`;
}

export function buildCampamentoProgramaMetadata(programa: Pick<
  CampamentoPrograma,
  'fecha_inicio' | 'fecha_fin' | 'dias_semana' | 'hora_inicio' | 'hora_fin' | 'turno_codigo' | 'turno_label'
>): CampamentoMetadata {
  return {
    tipo: 'campamento_recurrente',
    fecha_inicio: programa.fecha_inicio,
    fecha_fin: programa.fecha_fin,
    dias_semana: [...programa.dias_semana].sort((a, b) => a - b),
    hora_inicio: normalizeTimeValue(programa.hora_inicio),
    hora_fin: normalizeTimeValue(programa.hora_fin),
    turno_codigo: programa.turno_codigo ?? null,
    turno_label: programa.turno_label ?? null
  };
}

export function generateCampamentoOccurrences(input: Pick<CampamentoMetadata, 'fecha_inicio' | 'fecha_fin' | 'dias_semana' | 'hora_inicio' | 'hora_fin'>) {
  const startDate = parseLocalDateInput(input.fecha_inicio);
  const endDate = parseLocalDateInput(input.fecha_fin);

  if (!startDate || !endDate || endDate < startDate) {
    return [] as CampamentoOccurrence[];
  }

  const horaInicio = normalizeTimeValue(input.hora_inicio);
  const horaFin = normalizeTimeValue(input.hora_fin);
  const [startHour, startMinute] = horaInicio.split(':').map(Number);
  const [endHour, endMinute] = horaFin.split(':').map(Number);

  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return [] as CampamentoOccurrence[];
  }

  const diasSemana = new Set(input.dias_semana);
  const occurrences: CampamentoOccurrence[] = [];

  for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    const currentDate = new Date(cursor);
    const diaSemana = getWeekdayNumber(currentDate);
    if (!diasSemana.has(diaSemana)) {
      continue;
    }

    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      startHour,
      startMinute,
      0,
      0
    );
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      endHour,
      endMinute,
      0,
      0
    );

    occurrences.push({
      date: formatDateInputValue(currentDate),
      start,
      end,
      horaInicio,
      horaFin,
      diaSemana
    });
  }

  return occurrences;
}
