import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useActividades, ActividadDB, TarifaActividad } from '@/hooks/useActividades';
import {
  buildCampamentoDateRangeLabel,
  buildCampamentoHorarioSummary,
  buildCampamentoTurnoOptions,
  formatDateInputForDisplay,
  generateCampamentoOccurrences,
  type CampamentoPrograma,
  type CampamentoMetadata,
  type CampamentoTurnoOption,
  type ServicioHorarioRegla
} from '@/lib/campamento';
import PagoReservaModal from './PagoReservaModal';
import ModalNuevaReservaCampamentoInscripcion from './ModalNuevaReservaCampamentoInscripcion';

interface ModalNuevaReservaProps {
  isOpen: boolean;
  onClose: () => void;
  campamentoProgramaContext?: CampamentoPrograma | null;
  onSubmit: (data: {
    empresa: 'Flecha Extreme' | 'Rober';
    tipoActividad: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
    actividad: string;
    cantidadReservada: number;
    numeroPersonas: number;
    precio: number;
    tarifaId?: string;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    nota?: string;
    rangos?: Array<{
      id: string;
      fechaInicio: string;
      fechaFin: string;
      horaInicio: string;
      horaFin: string;
      duracionMin: number;
    }>;
    campamentoMetadata?: CampamentoMetadata;
    reservaFechaInicio?: string;
    reservaFechaFin?: string;
    asignarTramosDespues?: boolean;
    duracionTotalMin?: number;
  }) => void;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

type WizardStep = 1 | 2;
type CourseAssignmentMode = 'now' | 'later';
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';
type RentalDurationMode = 'preset' | 'custom';

interface RentalSuggestion {
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
}

interface RentalAvailabilityState {
  status: AvailabilityStatus;
  message?: string;
  stockDisponible?: number;
  stockTotal?: number;
  reservadas?: number;
  checkedDurationMin?: number;
  suggestion?: RentalSuggestion;
}

interface CursoRangeDraft {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
}

const EMPTY_RENTAL_AVAILABILITY: RentalAvailabilityState = {
  status: 'idle'
};

const CUSTOM_RENTAL_DURATION_OPTION = '__custom__';

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

function createDefaultReservaFormData() {
  return {
    empresa: 'Flecha Extreme' as 'Flecha Extreme' | 'Rober',
    tipoActividad: 'alquiler' as 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros',
    actividad: '',
    duracion: '',
    cantidadReservada: 1,
    numeroPersonas: 1,
    precio: 0,
    fechaInicio: getTodayInputValue(),
    fechaFin: '',
    horaInicio: getCurrentTimeInputValue(),
    horaFin: '',
    nota: ''
  };
}

function buildDurationValue(amount: number, unit: string) {
  return `${amount}-${unit}`;
}

function buildTarifaDurationValue(tarifa: TarifaActividad) {
  return buildDurationValue(tarifa.duracion_valor, tarifa.duracion_unidad);
}

function getDurationMinutes(value: string) {
  const [rawAmount, rawUnit] = value.split('-');
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (rawUnit === 'hora' || rawUnit === 'horas') {
    return amount * 60;
  }

  if (rawUnit === 'minuto' || rawUnit === 'minutos') {
    return amount;
  }

  return null;
}

function minutesFromTime(hora: string) {
  const [hours, minutes] = hora.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function calculateGenericHoraFin(horaInicio: string, duracion: string) {
  if (!horaInicio || !duracion) return '';

  const minutosInicio = minutesFromTime(horaInicio);
  if (!minutosInicio && minutosInicio !== 0) return '';

  const duracionMinutos = getDurationMinutes(duracion);
  if (duracionMinutos === null) {
    return '';
  }

  return formatMinutesAsTime(minutosInicio + duracionMinutos);
}

function calculateGenericFechaFin(fechaInicio: string, duracion: string) {
  if (!fechaInicio || !duracion) return '';

  const [duracionValor, duracionUnidad] = duracion.split('-');
  const valor = parseInt(duracionValor, 10);
  const fechaInicioObj = new Date(fechaInicio);

  if (duracionUnidad === 'dia' || duracionUnidad === 'dias') {
    fechaInicioObj.setDate(fechaInicioObj.getDate() + valor);
  } else if (duracionUnidad === 'semana' || duracionUnidad === 'semanas') {
    fechaInicioObj.setDate(fechaInicioObj.getDate() + (valor * 7));
  } else if (duracionUnidad === 'mes' || duracionUnidad === 'meses') {
    fechaInicioObj.setMonth(fechaInicioObj.getMonth() + valor);
  } else if (duracionUnidad === 'año' || duracionUnidad === 'años') {
    fechaInicioObj.setFullYear(fechaInicioObj.getFullYear() + valor);
  }

  return fechaInicioObj.toISOString().split('T')[0];
}

function calculateRentalRange(fechaInicio: string, horaInicio: string, duracionMin: number) {
  if (!fechaInicio || !horaInicio || !Number.isFinite(duracionMin) || duracionMin <= 0) {
    return null;
  }

  const minutosInicio = minutesFromTime(horaInicio);
  if (minutosInicio === null) {
    return null;
  }

  const minutosFin = minutosInicio + duracionMin;
  const crossesDay = minutosFin > 1439;

  return {
    fechaFin: fechaInicio,
    horaFin: crossesDay ? '' : formatMinutesAsTime(minutosFin),
    duracionMin,
    crossesDay
  };
}

function toLocalFormFields(isoValue: string) {
  const date = new Date(isoValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hours}:${minutes}`
  };
}

function formatDisplayDate(fecha: string) {
  if (!fecha) return '';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

const spanishNumberFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const spanishPriceFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatSpanishNumber(value: number, options?: { fixedDecimals?: boolean }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return options?.fixedDecimals ? spanishPriceFormatter.format(safeValue) : spanishNumberFormatter.format(safeValue);
}

function formatDurationLabel(value: string) {
  if (!value) return '';

  const [rawAmount, rawUnit] = value.split('-');
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return value;
  }

  if (rawUnit === 'minuto' || rawUnit === 'minutos') {
    if (amount < 60) {
      return `${formatSpanishNumber(amount)} ${amount === 1 ? 'minuto' : 'minutos'}`;
    }

    const hours = Math.floor(amount / 60);
    const minutes = amount % 60;
    if (minutes === 0) {
      return `${formatSpanishNumber(hours)} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    return `${formatSpanishNumber(hours)} ${hours === 1 ? 'hora' : 'horas'} y ${formatSpanishNumber(minutes)} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (rawUnit === 'hora' || rawUnit === 'horas') {
    return `${formatSpanishNumber(amount)} ${amount === 1 ? 'hora' : 'horas'}`;
  }

  if (rawUnit === 'dia' || rawUnit === 'dias') {
    return `${formatSpanishNumber(amount)} ${amount === 1 ? 'día' : 'días'}`;
  }

  if (rawUnit === 'semana' || rawUnit === 'semanas') {
    return `${formatSpanishNumber(amount)} ${amount === 1 ? 'semana' : 'semanas'}`;
  }

  if (rawUnit === 'mes' || rawUnit === 'meses') {
    return `${formatSpanishNumber(amount)} ${amount === 1 ? 'mes' : 'meses'}`;
  }

  if (rawUnit === 'año' || rawUnit === 'años') {
    return `${formatSpanishNumber(amount)} ${amount === 1 ? 'año' : 'años'}`;
  }

  return value;
}

function getTarifaNombreLabel(tarifa: TarifaActividad) {
  const metadataLabel = typeof tarifa.metadata?.nombre_comercial === 'string' ? tarifa.metadata.nombre_comercial : '';
  return metadataLabel || tarifa.nombre_tarifa || formatDurationLabel(buildTarifaDurationValue(tarifa));
}

function tarifaPermiteMultiTramo(tarifa: TarifaActividad | null) {
  return tarifa?.metadata?.permite_multi_tramo === true;
}

function createCursoRangeDraft(dateValue = getTodayInputValue(), timeValue = getCurrentTimeInputValue()): CursoRangeDraft {
  return {
    id: `${dateValue}-${timeValue}-${Math.random().toString(36).slice(2, 8)}`,
    fechaInicio: dateValue,
    fechaFin: dateValue,
    horaInicio: timeValue,
    horaFin: ''
  };
}

function calculateCourseRangeDuration(range: CursoRangeDraft) {
  if (!range.fechaInicio || !range.fechaFin || !range.horaInicio || !range.horaFin) {
    return 0;
  }

  const inicio = new Date(`${range.fechaInicio}T${range.horaInicio}:00`);
  const fin = new Date(`${range.fechaFin}T${range.horaFin}:00`);
  const diffMs = fin.getTime() - inicio.getTime();

  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function compareCursoRanges(left: CursoRangeDraft, right: CursoRangeDraft) {
  return new Date(`${left.fechaInicio}T${left.horaInicio}:00`).getTime() - new Date(`${right.fechaInicio}T${right.horaInicio}:00`).getTime();
}

function formatMinutesSummary(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 minutos';
  }

  return formatDurationLabel(buildDurationValue(totalMinutes, 'minuto'));
}

function splitDurationMinutes(totalMinutes: number | null) {
  if (!totalMinutes || totalMinutes <= 0) {
    return { hours: '', minutes: '' };
  }

  return {
    hours: String(Math.floor(totalMinutes / 60)),
    minutes: String(totalMinutes % 60)
  };
}

function buildCustomRentalDurationValue(hoursValue: string, minutesValue: string) {
  const parsedHours = hoursValue === '' ? 0 : Number(hoursValue);
  const parsedMinutes = minutesValue === '' ? 0 : Number(minutesValue);

  if (
    !Number.isFinite(parsedHours) ||
    !Number.isFinite(parsedMinutes) ||
    parsedHours < 0 ||
    parsedMinutes < 0
  ) {
    return '';
  }

  const totalMinutes = Math.trunc(parsedHours) * 60 + Math.trunc(parsedMinutes);
  return totalMinutes > 0 ? buildDurationValue(totalMinutes, 'minuto') : '';
}

function sanitizePriceInput(value: string) {
  let result = '';
  let hasSeparator = false;

  for (const char of value) {
    if (/\d/.test(char)) {
      result += char;
      continue;
    }

    if ((char === ',' || char === '.') && !hasSeparator) {
      result += char;
      hasSeparator = true;
    }
  }

  return result;
}

function parsePriceInput(value: string) {
  const sanitized = sanitizePriceInput(value);
  if (!sanitized || sanitized === ',' || sanitized === '.') {
    return 0;
  }

  const parsed = Number(sanitized.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPriceInputValue(value: number, options?: { editing?: boolean; allowEmptyZero?: boolean }) {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (options?.editing) {
    if (options.allowEmptyZero && safeValue === 0) {
      return '';
    }

    return Number.isInteger(safeValue)
      ? String(safeValue)
      : String(safeValue).replace('.', ',');
  }

  if (options?.allowEmptyZero && safeValue === 0) {
    return '';
  }

  return formatSpanishNumber(safeValue, { fixedDecimals: true });
}

function requiresManualPrice(tarifa: TarifaActividad | null) {
  if (!tarifa) {
    return true;
  }

  return tarifa.precio === 0 || tarifa.metadata?.precio_manual === true;
}

function getRouteMaterialLabels(poolCode?: string | null) {
  const normalized = (poolCode ?? '').toLowerCase();

  if (normalized === 'kayak') {
    return { pluralDisplay: 'Kayaks', pluralText: 'kayaks' };
  }

  if (normalized === 'paddlesup') {
    return { pluralDisplay: 'PaddleSUPs', pluralText: 'paddleSUPs' };
  }

  return { pluralDisplay: 'Unidades', pluralText: 'unidades' };
}

export default function ModalNuevaReserva({
  isOpen,
  onClose,
  campamentoProgramaContext,
  onSubmit,
  onToast
}: ModalNuevaReservaProps) {
  const {
    obtenerActividadesPorTipo,
    obtenerTarifasActividad,
    obtenerHorariosActividad,
    crearProgramaCampamento,
    consultarStockDisponible,
    buscarSiguienteDisponibilidadServicio,
    loadingActividades,
    error: errorActividades
  } = useActividades();

  const [formData, setFormData] = useState(createDefaultReservaFormData);
  const [actividadesExistentes, setActividadesExistentes] = useState<ActividadDB[]>([]);
  const [tipoCargado, setTipoCargado] = useState('');
  const [tarifasActividad, setTarifasActividad] = useState<TarifaActividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadDB | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModalPago, setShowModalPago] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [closingCampamentoFlow, setClosingCampamentoFlow] = useState(false);
  const [stockInfo, setStockInfo] = useState<{
    stockDisponible: number;
    stockTotal: number;
    reservadas: number;
  } | null>(null);
  const [consultandoStock, setConsultandoStock] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [rentalAvailability, setRentalAvailability] = useState<RentalAvailabilityState>(EMPTY_RENTAL_AVAILABILITY);
  const [campHorarioReglas, setCampHorarioReglas] = useState<ServicioHorarioRegla[]>([]);
  const [campTurnoSeleccionado, setCampTurnoSeleccionado] = useState('');
  const [showCourseRangesModal, setShowCourseRangesModal] = useState(false);
  const [courseRanges, setCourseRanges] = useState<CursoRangeDraft[]>([]);
  const [courseRangeEditor, setCourseRangeEditor] = useState<CursoRangeDraft[]>([]);
  const [courseRangeErrors, setCourseRangeErrors] = useState<Record<string, string>>({});
  const [isValidatingCourseRanges, setIsValidatingCourseRanges] = useState(false);
  const [courseRangesValidationMessage, setCourseRangesValidationMessage] = useState('');
  const [courseAssignmentMode, setCourseAssignmentMode] = useState<CourseAssignmentMode>('now');
  const [rentalDurationMode, setRentalDurationMode] = useState<RentalDurationMode>('preset');
  const [customRentalHours, setCustomRentalHours] = useState('');
  const [customRentalMinutes, setCustomRentalMinutes] = useState('');
  const [priceInputValue, setPriceInputValue] = useState(() => formatPriceInputValue(0, { allowEmptyZero: true }));
  const [isEditingPriceInput, setIsEditingPriceInput] = useState(false);

  const isRental = formData.tipoActividad === 'alquiler';
  const isCourse = formData.tipoActividad === 'curso';
  const isRoute = formData.tipoActividad === 'ruta';
  const isCamp = formData.tipoActividad === 'campamento';
  const isSport = formData.tipoActividad === 'sport';
  const isBanana = isSport && (
    actividadSeleccionada?.codigo === 'BANANA' ||
    actividadSeleccionada?.nombre.toLowerCase() === 'banana'
  );
  const today = getTodayInputValue();

  const tarifaSeleccionada = useMemo(() => {
    if (!formData.duracion) return null;

    return tarifasActividad.find(
      (tarifa) => buildTarifaDurationValue(tarifa) === formData.duracion
    ) ?? null;
  }, [formData.duracion, tarifasActividad]);
  const bananaBaseTariff = useMemo(() => {
    if (!isBanana) return null;
    return tarifasActividad[0] ?? null;
  }, [isBanana, tarifasActividad]);
  const campBaseTariff = useMemo(() => tarifasActividad[0] ?? null, [tarifasActividad]);
  const rentalSelectedTariff = useMemo(
    () => (isRental ? tarifaSeleccionada : null),
    [isRental, tarifaSeleccionada]
  );
  const isCustomRentalDuration = useMemo(
    () => isRental && rentalDurationMode === 'custom',
    [isRental, rentalDurationMode]
  );
  const courseSelectedTariff = useMemo(
    () => (isCourse ? tarifaSeleccionada : null),
    [isCourse, tarifaSeleccionada]
  );
  const courseDurationSelectedMin = useMemo(
    () => (isCourse ? getDurationMinutes(formData.duracion) : null),
    [formData.duracion, isCourse]
  );
  const isCourseMultiRangeTariff = useMemo(
    () => tarifaPermiteMultiTramo(courseSelectedTariff),
    [courseSelectedTariff]
  );
  const isCoursePendingAssignmentMode = isCourseMultiRangeTariff && courseAssignmentMode === 'later';
  const rentalDurationSelectedMin = useMemo(
    () => (isRental ? getDurationMinutes(formData.duracion) : null),
    [formData.duracion, isRental]
  );
  const routeHasFixedDuration = useMemo(() => {
    if (!isRoute || tarifasActividad.length !== 1) {
      return false;
    }

    const durationMin = getDurationMinutes(buildTarifaDurationValue(tarifasActividad[0]));
    return durationMin !== null && durationMin > 0;
  }, [isRoute, tarifasActividad]);
  const routeMaterialLabels = useMemo(
    () => getRouteMaterialLabels(actividadSeleccionada?.pool_inventario_codigo),
    [actividadSeleccionada?.pool_inventario_codigo]
  );
  const usesPerPersonPricing = useMemo(
    () => !isRental && (actividadSeleccionada?.modo_precio === 'por_persona' || isCourse),
    [actividadSeleccionada, isCourse, isRental]
  );
  const syncReservedQuantityWithPeople = useMemo(
    () => usesPerPersonPricing && !isBanana,
    [isBanana, usesPerPersonPricing]
  );
  const effectiveReservedQuantity = useMemo(
    () => (syncReservedQuantityWithPeople ? formData.numeroPersonas : formData.cantidadReservada),
    [formData.cantidadReservada, formData.numeroPersonas, syncReservedQuantityWithPeople]
  );
  const effectiveInventoryQuantity = useMemo(() => {
    if (isBanana) {
      return Math.max(1, formData.cantidadReservada);
    }

    if (!usesPerPersonPricing) {
      return formData.cantidadReservada;
    }

    if (
      actividadSeleccionada?.usa_pool_inventario &&
      actividadSeleccionada.numero_personas &&
      actividadSeleccionada.numero_personas > 0
    ) {
      return Math.max(1, Math.ceil(formData.numeroPersonas / actividadSeleccionada.numero_personas));
    }

    return effectiveReservedQuantity;
  }, [actividadSeleccionada, effectiveReservedQuantity, formData.cantidadReservada, formData.numeroPersonas, isBanana, usesPerPersonPricing]);
  useEffect(() => {
    if (!isRoute || !formData.fechaInicio || formData.fechaFin) {
      return;
    }

    setFormData((prev) => {
      if (prev.tipoActividad !== 'ruta' || !prev.fechaInicio || prev.fechaFin) {
        return prev;
      }

      return {
        ...prev,
        fechaFin: prev.fechaInicio
      };
    });
  }, [formData.fechaFin, formData.fechaInicio, isRoute]);
  const bananaPoolTotal = useMemo(
    () => (actividadSeleccionada?.pool_inventario_total && actividadSeleccionada.pool_inventario_total > 0 ? actividadSeleccionada.pool_inventario_total : 1),
    [actividadSeleccionada]
  );
  const showBananaQuantitySelector = isBanana && bananaPoolTotal > 1;
  const maxNumeroPersonas = useMemo(() => {
    if (actividadSeleccionada?.numero_personas && actividadSeleccionada.numero_personas > 0) {
      return actividadSeleccionada.numero_personas;
    }

    if (isCamp || isBanana) {
      return 999;
    }

    return 15;
  }, [actividadSeleccionada, isBanana, isCamp]);
  const usesGroupedInventory = useMemo(
    () => usesPerPersonPricing && !!actividadSeleccionada?.usa_pool_inventario && !!actividadSeleccionada?.numero_personas,
    [actividadSeleccionada, usesPerPersonPricing]
  );
  const timeInputStepSeconds = useMemo(() => {
    if (actividadSeleccionada?.intervalo_reserva_min && actividadSeleccionada.intervalo_reserva_min > 0) {
      return actividadSeleccionada.intervalo_reserva_min * 60;
    }

    return 60;
  }, [actividadSeleccionada]);

  const precioManualPendiente = useMemo(() => {
    if (isRental) {
      if (tarifasActividad.length === 0) return true;
      if (isCustomRentalDuration) return true;
      if (!rentalSelectedTariff) return false;
      return requiresManualPrice(rentalSelectedTariff);
    }

    if (isCamp) {
      return requiresManualPrice(campBaseTariff);
    }

    if (isBanana) {
      return requiresManualPrice(bananaBaseTariff);
    }

    if (!tarifaSeleccionada && tarifasActividad.length === 0) {
      return true;
    }

    if (!tarifaSeleccionada) return false;

    return tarifaSeleccionada.precio === 0 && tarifaSeleccionada.metadata?.precio_manual === true;
  }, [bananaBaseTariff, campBaseTariff, isBanana, isCamp, isCustomRentalDuration, isRental, rentalSelectedTariff, tarifaSeleccionada, tarifasActividad.length]);

  const campTurnoOptions = useMemo<CampamentoTurnoOption[]>(
    () => buildCampamentoTurnoOptions(campHorarioReglas),
    [campHorarioReglas]
  );
  const campTurnoActivo = useMemo(
    () => campTurnoOptions.find((option) => option.key === campTurnoSeleccionado) ?? null,
    [campTurnoOptions, campTurnoSeleccionado]
  );
  const campamentoMetadata = useMemo<CampamentoMetadata | null>(() => {
    if (!isCamp || !formData.fechaInicio || !formData.fechaFin || !campTurnoActivo) {
      return null;
    }

    return {
      tipo: 'campamento_recurrente',
      fecha_inicio: formData.fechaInicio,
      fecha_fin: formData.fechaFin,
      dias_semana: campTurnoActivo.diasSemana,
      hora_inicio: campTurnoActivo.horaInicio,
      hora_fin: campTurnoActivo.horaFin,
      turno_codigo: campTurnoActivo.codigo,
      turno_label: campTurnoActivo.label
    };
  }, [campTurnoActivo, formData.fechaFin, formData.fechaInicio, isCamp]);
  const campOccurrences = useMemo(
    () => (campamentoMetadata ? generateCampamentoOccurrences(campamentoMetadata) : []),
    [campamentoMetadata]
  );
  const campFirstOccurrence = campOccurrences[0] ?? null;
  const campLastOccurrence = campOccurrences[campOccurrences.length - 1] ?? null;
  const campHorarioResumen = useMemo(
    () => (campamentoMetadata ? buildCampamentoHorarioSummary(campamentoMetadata) : ''),
    [campamentoMetadata]
  );
  const campRangoResumen = useMemo(
    () => (campamentoMetadata ? buildCampamentoDateRangeLabel(campamentoMetadata) : ''),
    [campamentoMetadata]
  );
  const sortedCourseRanges = useMemo(
    () => [...courseRanges].sort(compareCursoRanges),
    [courseRanges]
  );
  const courseAssignedMinutes = useMemo(
    () => sortedCourseRanges.reduce((total, range) => total + calculateCourseRangeDuration(range), 0),
    [sortedCourseRanges]
  );
  const courseRemainingMinutes = useMemo(() => {
    if (!courseDurationSelectedMin) {
      return 0;
    }

    return courseDurationSelectedMin - courseAssignedMinutes;
  }, [courseAssignedMinutes, courseDurationSelectedMin]);
  const courseRangeAggregate = useMemo(() => {
    if (sortedCourseRanges.length === 0) {
      return null;
    }

    const first = sortedCourseRanges[0];
    const last = sortedCourseRanges[sortedCourseRanges.length - 1];
    return {
      fechaInicio: first.fechaInicio,
      fechaFin: last.fechaFin,
      horaInicio: first.horaInicio,
      horaFin: last.horaFin
    };
  }, [sortedCourseRanges]);

  const rentalDurationOptions = useMemo(() => {
    if (!isRental) return [];

    const minutosInicio = minutesFromTime(formData.horaInicio);
    return tarifasActividad
      .filter((tarifa) => {
        const duracionMin = getDurationMinutes(buildTarifaDurationValue(tarifa));
        if (duracionMin === null) {
          return false;
        }

        if (minutosInicio === null) {
          return true;
        }

        return minutosInicio + duracionMin <= 1439;
      })
      .sort((left, right) => {
        const leftDuration = getDurationMinutes(buildTarifaDurationValue(left)) ?? 0;
        const rightDuration = getDurationMinutes(buildTarifaDurationValue(right)) ?? 0;

        if (leftDuration !== rightDuration) {
          return leftDuration - rightDuration;
        }

        return left.precio - right.precio;
      });
  }, [formData.horaInicio, isRental, tarifasActividad]);

  const rentalDurationSelectValue = useMemo(() => {
    if (!isRental) {
      return formData.duracion;
    }

    return isCustomRentalDuration ? CUSTOM_RENTAL_DURATION_OPTION : formData.duracion;
  }, [formData.duracion, isCustomRentalDuration, isRental]);

  useEffect(() => {
    if (!isRental || !formData.duracion || isCustomRentalDuration) {
      return;
    }

    const hasSelectedDuration = rentalDurationOptions.some(
      (tarifa) => buildTarifaDurationValue(tarifa) === formData.duracion
    );

    if (hasSelectedDuration) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      duracion: '',
      fechaFin: '',
      horaFin: '',
      precio: 0
    }));
  }, [formData.duracion, isCustomRentalDuration, isRental, rentalDurationOptions]);

  useEffect(() => {
    if (!isCamp) {
      return;
    }

    const horaInicio = campTurnoActivo?.horaInicio ?? '';
    const horaFin = campTurnoActivo?.horaFin ?? '';

    setFormData((prev) => {
      if (prev.horaInicio === horaInicio && prev.horaFin === horaFin) {
        return prev;
      }

      return {
        ...prev,
        horaInicio,
        horaFin
      };
    });
  }, [campTurnoActivo, isCamp]);

  useEffect(() => {
    if (!isCamp) {
      return;
    }

    if (precioManualPendiente || !campBaseTariff) {
      return;
    }

    const nextPrice = Number((campBaseTariff.precio * Math.max(formData.numeroPersonas, 1)).toFixed(2));
    setFormData((prev) => (prev.precio === nextPrice ? prev : { ...prev, precio: nextPrice }));
  }, [campBaseTariff, formData.numeroPersonas, isCamp, precioManualPendiente]);

  useEffect(() => {
    if (!isBanana || showBananaQuantitySelector) {
      return;
    }

    setFormData((prev) => (prev.cantidadReservada === 1 ? prev : { ...prev, cantidadReservada: 1 }));
  }, [isBanana, showBananaQuantitySelector]);

  useEffect(() => {
    if (!isBanana || precioManualPendiente || !bananaBaseTariff) {
      return;
    }

    const nextPrice = Number((bananaBaseTariff.precio * Math.max(formData.numeroPersonas, 1)).toFixed(2));
    setFormData((prev) => (prev.precio === nextPrice ? prev : { ...prev, precio: nextPrice }));
  }, [bananaBaseTariff, formData.numeroPersonas, isBanana, precioManualPendiente]);

  useEffect(() => {
    if (isEditingPriceInput && precioManualPendiente) {
      return;
    }

    setPriceInputValue(
      formatPriceInputValue(Number(formData.precio ?? 0), {
        allowEmptyZero: precioManualPendiente
      })
    );
  }, [formData.precio, isEditingPriceInput, precioManualPendiente]);

  const resetModalState = () => {
    setFormData(createDefaultReservaFormData());
    setActividadesExistentes([]);
    setTipoCargado('');
    setTarifasActividad([]);
    setActividadSeleccionada(null);
    setShowModalPago(false);
    setPaymentCompleted(false);
    setStockInfo(null);
    setConsultandoStock(false);
    setCurrentStep(1);
    setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
    setCampHorarioReglas([]);
    setCampTurnoSeleccionado('');
    setShowCourseRangesModal(false);
    setCourseRanges([]);
    setCourseRangeEditor([]);
    setCourseRangeErrors({});
    setIsValidatingCourseRanges(false);
    setCourseRangesValidationMessage('');
    setCourseAssignmentMode('now');
    setRentalDurationMode('preset');
    setCustomRentalHours('');
    setCustomRentalMinutes('');
    setPriceInputValue(formatPriceInputValue(0, { allowEmptyZero: true }));
    setIsEditingPriceInput(false);
    setErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      setClosingCampamentoFlow(false);
      resetModalState();
      return;
    }

    setClosingCampamentoFlow(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isCourseMultiRangeTariff) {
      if (courseAssignmentMode !== 'now') {
        setCourseAssignmentMode('now');
      }
      if (courseRanges.length > 0) {
        setCourseRanges([]);
      }
      if (courseRangeEditor.length > 0) {
        setCourseRangeEditor([]);
      }
      if (courseRangesValidationMessage) {
        setCourseRangesValidationMessage('');
      }
      return;
    }

    if (isCoursePendingAssignmentMode) {
      return;
    }

    setFormData((prev) => {
      const nextFechaInicio = courseRangeAggregate?.fechaInicio ?? '';
      const nextFechaFin = courseRangeAggregate?.fechaFin ?? '';
      const nextHoraInicio = courseRangeAggregate?.horaInicio ?? '';
      const nextHoraFin = courseRangeAggregate?.horaFin ?? '';

      if (
        prev.fechaInicio === nextFechaInicio &&
        prev.fechaFin === nextFechaFin &&
        prev.horaInicio === nextHoraInicio &&
        prev.horaFin === nextHoraFin
      ) {
        return prev;
      }

      return {
        ...prev,
        fechaInicio: nextFechaInicio,
        fechaFin: nextFechaFin,
        horaInicio: nextHoraInicio,
        horaFin: nextHoraFin
      };
    });
  }, [courseAssignmentMode, courseRangeAggregate, courseRangeEditor.length, courseRanges, courseRangesValidationMessage, isCourseMultiRangeTariff, isCoursePendingAssignmentMode]);

  const consultarStock = async (
    actividadId: string,
    fecha: string,
    horaInicio?: string,
    horaFin?: string,
    cantidad = 1
  ) => {
    if (!actividadId || !fecha) {
      setStockInfo(null);
      return;
    }

    try {
      setConsultandoStock(true);
      const resultado = await consultarStockDisponible(actividadId, fecha, horaInicio, horaFin, cantidad);

      if (resultado.success && resultado.stockDisponible !== undefined) {
        setStockInfo({
          stockDisponible: resultado.stockDisponible,
          stockTotal: resultado.stockTotal || 0,
          reservadas: resultado.reservadas || 0
        });
      } else {
        setStockInfo(null);
      }
    } catch (error) {
      console.error('Error al consultar stock:', error);
      setStockInfo(null);
    } finally {
      setConsultandoStock(false);
    }
  };

  const generarDatosActividad = () => ({
    id: actividadSeleccionada?.id || formData.actividad || 'actividad-sin-id',
    nombre: formData.actividad,
    precio: formData.precio,
    cantidad: effectiveInventoryQuantity,
    duracion: isCamp ? `${campOccurrences.length} sesiones` : formatDurationLabel(formData.duracion),
    empresa: formData.empresa,
    numeroPersonas: formData.numeroPersonas,
    fechaInicio: formData.fechaInicio,
    fechaFin: formData.fechaFin,
    horaInicio: formData.horaInicio,
    horaFin: formData.horaFin,
    nota: formData.nota,
    campamentoMetadata: campamentoMetadata ?? undefined,
    tarifaId: tarifaSeleccionada?.id,
    rangos: isCourseMultiRangeTariff
      ? isCoursePendingAssignmentMode
        ? undefined
        : sortedCourseRanges.map((range) => ({
            id: range.id,
            fechaInicio: range.fechaInicio,
            fechaFin: range.fechaFin,
            horaInicio: range.horaInicio,
            horaFin: range.horaFin,
            duracionMin: calculateCourseRangeDuration(range)
          }))
      : undefined,
    asignarTramosDespues: isCoursePendingAssignmentMode,
    duracionTotalMin: isCourse ? courseDurationSelectedMin ?? undefined : undefined,
    reservaFechaInicio: campFirstOccurrence?.date ?? formData.fechaInicio,
    reservaFechaFin: campLastOccurrence?.date ?? formData.fechaFin,
    resumenHorario: isCamp ? campHorarioResumen : undefined,
    resumenFechas: isCamp ? campRangoResumen : undefined,
    precioReserva: actividadSeleccionada?.precio_reserva || 0,
    modoPrecio: actividadSeleccionada?.modo_precio ?? 'fijo',
    depositoPermitido: actividadSeleccionada?.deposito_permitido ?? false,
    depositoObligatorio: actividadSeleccionada?.deposito_obligatorio ?? false
  });

  useEffect(() => {
    const cargarActividades = async () => {
      if (!formData.tipoActividad || !isOpen || formData.tipoActividad === tipoCargado) {
        return;
      }

      try {
        const actividades = await obtenerActividadesPorTipo(formData.tipoActividad);
        setActividadesExistentes(actividades);
        setTipoCargado(formData.tipoActividad);
      } catch {
        setActividadesExistentes([]);
      }
    };

    cargarActividades();
  }, [formData.tipoActividad, isOpen, obtenerActividadesPorTipo, tipoCargado]);

  useEffect(() => {
    let cancelled = false;

    const runAvailabilityCheck = async () => {
      if (!isOpen || !isRental || currentStep !== 2) {
        if (!cancelled) {
          setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
        }
        return;
      }

      if (
        !actividadSeleccionada ||
        !formData.fechaInicio ||
        !formData.horaInicio ||
        !formData.duracion ||
        formData.cantidadReservada < 1
      ) {
        if (!cancelled) {
          setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
        }
        return;
      }

      const range = rentalDurationSelectedMin
        ? calculateRentalRange(formData.fechaInicio, formData.horaInicio, rentalDurationSelectedMin)
        : null;
      if (!range) {
        if (!cancelled) {
          setRentalAvailability({
            status: 'error',
            message: 'Selecciona una duración y una hora de inicio válidas.'
          });
        }
        return;
      }

      if (range.crossesDay) {
        if (!cancelled) {
          setRentalAvailability({
            status: 'error',
            message: 'La duración seleccionada supera las 23:59 del mismo día.'
          });
        }
        return;
      }

      setRentalAvailability((prev) => ({
        ...prev,
        status: 'checking',
        message: 'Comprobando disponibilidad...'
      }));

      const disponibilidad = await consultarStockDisponible(
        actividadSeleccionada.id,
        formData.fechaInicio,
        formData.horaInicio,
        range.horaFin,
        formData.cantidadReservada
      );

      if (cancelled) return;

      if (disponibilidad.success && disponibilidad.disponible) {
        setRentalAvailability({
          status: 'available',
          message: 'Disponible para toda la duración seleccionada.',
          stockDisponible: disponibilidad.stockDisponible,
          stockTotal: disponibilidad.stockTotal,
          reservadas: disponibilidad.reservadas,
          checkedDurationMin: range.duracionMin
        });
        return;
      }

      if (!disponibilidad.success) {
        setRentalAvailability({
          status: 'error',
          message: disponibilidad.message
        });
        return;
      }

      const siguienteHueco = await buscarSiguienteDisponibilidadServicio(
        actividadSeleccionada.id,
        formData.fechaInicio,
        formData.horaInicio,
        range.duracionMin,
        formData.cantidadReservada
      );

      if (cancelled) return;

      let suggestion: RentalSuggestion | undefined;
      if (siguienteHueco.success && siguienteHueco.encontrado && siguienteHueco.inicioSugerido && siguienteHueco.finSugerido) {
        const inicio = toLocalFormFields(siguienteHueco.inicioSugerido);
        const fin = toLocalFormFields(siguienteHueco.finSugerido);
        suggestion = {
          fechaInicio: inicio.fecha,
          horaInicio: inicio.hora,
          fechaFin: fin.fecha,
          horaFin: fin.hora
        };
      }

      setRentalAvailability({
        status: 'unavailable',
        message: suggestion
          ? 'No hay stock para esa franja. Te mostramos el primer hueco disponible.'
          : 'No hay disponibilidad en el horizonte consultado.',
        stockDisponible: disponibilidad.stockDisponible,
        stockTotal: disponibilidad.stockTotal,
        reservadas: disponibilidad.reservadas,
        checkedDurationMin: range.duracionMin,
        suggestion
      });
    };

    runAvailabilityCheck();

    return () => {
      cancelled = true;
    };
  }, [
    actividadSeleccionada,
    buscarSiguienteDisponibilidadServicio,
    consultarStockDisponible,
    currentStep,
    formData.cantidadReservada,
    formData.duracion,
    formData.fechaInicio,
    formData.horaInicio,
    isOpen,
    isRental,
    rentalDurationSelectedMin
  ]);

  const handleInputChange = async (field: string, value: string | number | boolean) => {
    const nextIsRental = field === 'tipoActividad' ? value === 'alquiler' : isRental;
    const nextIsCourse = field === 'tipoActividad' ? value === 'curso' : isCourse;
    const nextIsCamp = field === 'tipoActividad' ? value === 'campamento' : isCamp;
    const nextIsBanana = field === 'tipoActividad'
      ? false
      : formData.tipoActividad === 'sport' && (
          actividadSeleccionada?.codigo === 'BANANA' ||
          (field === 'actividad' && String(value).toLowerCase() === 'banana') ||
          formData.actividad.toLowerCase() === 'banana'
        );
    const nextIsRoute = field === 'tipoActividad' ? value === 'ruta' : isRoute;
    const nextRouteFixedDuration =
      nextIsRoute &&
      tarifasActividad.length === 1 &&
      (() => {
        const durationMin = getDurationMinutes(buildTarifaDurationValue(tarifasActividad[0]));
        return durationMin !== null && durationMin > 0;
      })();

    if (field === 'horaFin' && nextRouteFixedDuration) {
      return;
    }

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === 'tipoActividad') {
        const defaults = createDefaultReservaFormData();
        return {
          ...newData,
          actividad: '',
          duracion: '',
          cantidadReservada: 1,
          numeroPersonas: 1,
          precio: 0,
          fechaInicio: defaults.fechaInicio,
          fechaFin: '',
          horaInicio: defaults.horaInicio,
          horaFin: '',
          nota: ''
        };
      }

      if (nextIsCamp) {
        if (field === 'numeroPersonas' && typeof value === 'number') {
          newData.cantidadReservada = Math.max(1, value);
        }

        return newData;
      }

      if (nextIsBanana) {
        if (field === 'fechaInicio' && value) {
          newData.fechaFin = String(value);
        } else if (field === 'fechaInicio' && !value) {
          newData.fechaFin = '';
          newData.horaInicio = '';
          newData.horaFin = '';
        }

        if ((field === 'horaInicio' || field === 'duracion' || field === 'fechaInicio') && newData.duracion && newData.horaInicio) {
          newData.horaFin = calculateGenericHoraFin(newData.horaInicio, newData.duracion);
        } else if (field === 'horaInicio' && !newData.horaInicio) {
          newData.horaFin = '';
        }

        if (!showBananaQuantitySelector || field === 'numeroPersonas') {
          newData.cantidadReservada = Math.max(1, typeof newData.cantidadReservada === 'number' ? newData.cantidadReservada : 1);
          if (!showBananaQuantitySelector) {
            newData.cantidadReservada = 1;
          }
        }

        if (field === 'numeroPersonas' && typeof value === 'number' && bananaBaseTariff && !precioManualPendiente) {
          newData.precio = Number((bananaBaseTariff.precio * value).toFixed(2));
        }

        return newData;
      }

      if (field === 'fechaInicio' && value) {
        newData.horaInicio = getCurrentTimeInputValue();
        if (nextIsRoute) {
          newData.fechaFin = String(value);
        }
      } else if (field === 'fechaInicio' && !value) {
        newData.horaInicio = '';
        if (nextIsRoute) {
          newData.fechaFin = '';
        }
      }

      if (!nextIsRental) {
        if (syncReservedQuantityWithPeople && field === 'numeroPersonas' && typeof value === 'number') {
          newData.cantidadReservada = value;
        }

        if ((field === 'duracion' || field === 'horaInicio') && newData.duracion && newData.horaInicio) {
          newData.horaFin = calculateGenericHoraFin(newData.horaInicio, newData.duracion);
        } else if (field === 'duracion' && !newData.duracion) {
          newData.horaFin = '';
        }

        if (field === 'duracion' && newData.duracion && newData.fechaInicio) {
          newData.fechaFin = calculateGenericFechaFin(newData.fechaInicio, newData.duracion);
        } else if (field === 'duracion' && !newData.duracion) {
          newData.fechaFin = '';
        }

        if (field === 'duracion' && newData.duracion) {
          const selectedTarifa = tarifasActividad.find(
            (tarifa) => buildTarifaDurationValue(tarifa) === newData.duracion
          );
          if (selectedTarifa) {
            const requiresManualPrice = selectedTarifa.precio === 0 && selectedTarifa.metadata?.precio_manual === true;
            if (!requiresManualPrice) {
              newData.precio = usesPerPersonPricing
                ? selectedTarifa.precio * newData.numeroPersonas
                : selectedTarifa.precio;
            }
          }
        } else if (field === 'duracion' && !newData.duracion) {
          newData.precio = 0;
        }

        if (field === 'fechaInicio' && value && newData.duracion) {
          newData.horaFin = calculateGenericHoraFin(newData.horaInicio, newData.duracion);
          newData.fechaFin = calculateGenericFechaFin(String(value), newData.duracion);
        }
      } else {
        if (newData.duracion && newData.fechaInicio && newData.horaInicio) {
          const rentalDurationMin = getDurationMinutes(newData.duracion);
          if (rentalDurationMin) {
            const range = calculateRentalRange(newData.fechaInicio, newData.horaInicio, rentalDurationMin);
            newData.fechaFin = range?.fechaFin ?? '';
            newData.horaFin = range && !range.crossesDay ? range.horaFin : '';
          }
        } else if (field === 'duracion' && !newData.duracion) {
          newData.fechaFin = '';
          newData.horaFin = '';
        }

        const selectedRentalTarifa = tarifasActividad.find(
          (tarifa) => buildTarifaDurationValue(tarifa) === newData.duracion
        ) ?? null;
        const hasCustomRentalDuration = !!newData.duracion && !selectedRentalTarifa;
        const shouldUseCustomRentalPricing = rentalDurationMode === 'custom' || hasCustomRentalDuration;

        if (
          (field === 'duracion' || field === 'cantidadReservada' || field === 'actividad') &&
          !shouldUseCustomRentalPricing &&
          requiresManualPrice(selectedRentalTarifa)
        ) {
          newData.precio = 0;
        }

        if (selectedRentalTarifa && !shouldUseCustomRentalPricing && !requiresManualPrice(selectedRentalTarifa)) {
          newData.precio = Number((selectedRentalTarifa.precio * newData.cantidadReservada).toFixed(2));
        } else if (field === 'duracion' && !newData.duracion) {
          newData.precio = 0;
        }
      }

      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    if (nextIsCourse && ['actividad', 'duracion', 'numeroPersonas'].includes(field)) {
      setCourseRanges([]);
      setCourseRangeEditor([]);
      setCourseRangeErrors({});
      setCourseRangesValidationMessage('');
    }

    if (field === 'tipoActividad') {
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
      setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
      setCampHorarioReglas([]);
      setCampTurnoSeleccionado('');
      setCurrentStep(1);
      setRentalDurationMode('preset');
      setCustomRentalHours('');
      setCustomRentalMinutes('');
      return;
    }

    if (field === 'actividad' && value) {
      const actividad = actividadesExistentes.find((item) => item.nombre === value);
      if (!actividad) return;

      setActividadSeleccionada(actividad);
      const tarifas = await obtenerTarifasActividad(actividad.id);
      setTarifasActividad(tarifas);
      const horarios = nextIsCamp ? await obtenerHorariosActividad(actividad.id) : [];
      setCampHorarioReglas(horarios);
      const actividadMaxPersonas = actividad.numero_personas && actividad.numero_personas > 0
        ? actividad.numero_personas
        : nextIsCamp || actividad.codigo === 'BANANA'
          ? 999
          : 15;
      const numeroPersonasAjustado = Math.min(formData.numeroPersonas, actividadMaxPersonas);

      if (nextIsCamp) {
        const turnos = buildCampamentoTurnoOptions(horarios);
        const campTarifa = tarifas[0] ?? null;
        const requiresManualPrice =
          !campTarifa ||
          campTarifa.precio === 0 ||
          campTarifa.metadata?.precio_manual === true;
        const preservedTurno =
          turnos.find((turno) => turno.key === campTurnoSeleccionado)?.key ??
          (turnos.length === 1 ? turnos[0].key : '');
        const selectedTurno = turnos.find((turno) => turno.key === preservedTurno) ?? null;

        setCampTurnoSeleccionado(preservedTurno);
        setFormData((prev) => ({
          ...prev,
          duracion: '',
          numeroPersonas: numeroPersonasAjustado,
          cantidadReservada: numeroPersonasAjustado,
          horaInicio: selectedTurno?.horaInicio ?? '',
          horaFin: selectedTurno?.horaFin ?? '',
          precio: requiresManualPrice || !campTarifa
            ? 0
            : Number((campTarifa.precio * numeroPersonasAjustado).toFixed(2))
        }));
        setCurrentStep(1);
        setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
        setStockInfo(null);
        return;
      }

      if (actividad.codigo === 'BANANA') {
        const bananaTarifa = tarifas[0] ?? null;
        const bananaDuration = bananaTarifa
          ? buildTarifaDurationValue(bananaTarifa)
          : '';
        const requiresManualPrice =
          !bananaTarifa ||
          bananaTarifa.precio === 0 ||
          bananaTarifa.metadata?.precio_manual === true;

        setFormData((prev) => {
          const nextData = {
            ...prev,
            duracion: bananaDuration,
            numeroPersonas: numeroPersonasAjustado,
            cantidadReservada: actividad.pool_inventario_total && actividad.pool_inventario_total > 1
              ? prev.cantidadReservada
              : 1,
            precio: requiresManualPrice || !bananaTarifa
              ? 0
              : Number((bananaTarifa.precio * numeroPersonasAjustado).toFixed(2))
          };

          if (nextData.fechaInicio) {
            nextData.fechaFin = nextData.fechaInicio;
          }

          if (nextData.horaInicio && bananaDuration) {
            nextData.horaFin = calculateGenericHoraFin(nextData.horaInicio, bananaDuration);
          }

          return nextData;
        });
        setCurrentStep(1);
        setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
        setStockInfo(null);
        return;
      }

      if (!nextIsRental) {
        if (nextIsRoute && tarifas.length === 1) {
          const duracion = buildTarifaDurationValue(tarifas[0]);
          const requiresManualPrice = tarifas[0].precio === 0 && tarifas[0].metadata?.precio_manual === true;
          const precioCalculado = requiresManualPrice
            ? 0
            : actividad.modo_precio === 'por_persona'
              ? tarifas[0].precio * numeroPersonasAjustado
              : tarifas[0].precio;

          setFormData((prev) => {
            const nextData = {
              ...prev,
              duracion,
              precio: precioCalculado,
              numeroPersonas: numeroPersonasAjustado,
              cantidadReservada: actividad.modo_precio === 'por_persona' ? numeroPersonasAjustado : prev.cantidadReservada
            };
            if (nextData.horaInicio) {
              nextData.horaFin = calculateGenericHoraFin(nextData.horaInicio, duracion);
            }
            return nextData;
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            duracion: '',
            fechaFin: nextIsRoute ? prev.fechaFin : '',
            horaFin: '',
            precio: 0,
            numeroPersonas: Math.min(prev.numeroPersonas, actividadMaxPersonas),
            cantidadReservada: actividad.modo_precio === 'por_persona' ? Math.min(prev.numeroPersonas, actividadMaxPersonas) : prev.cantidadReservada
          }));
        }

        if (formData.fechaInicio && formData.horaInicio && formData.duracion) {
          const horaFinCalculada = calculateGenericHoraFin(formData.horaInicio, formData.duracion);
          if (horaFinCalculada) {
            await consultarStock(
              actividad.id,
              formData.fechaInicio,
              formData.horaInicio,
              horaFinCalculada,
              actividad.modo_precio === 'por_persona'
                ? actividad.usa_pool_inventario && actividad.numero_personas
                  ? Math.max(1, Math.ceil(numeroPersonasAjustado / actividad.numero_personas))
                  : numeroPersonasAjustado
                : formData.cantidadReservada
            );
          }
        } else if (actividad.tipo === 'ruta' && formData.fechaInicio && formData.fechaFin && formData.horaInicio && formData.horaFin) {
          await consultarStock(
            actividad.id,
            formData.fechaInicio,
            formData.horaInicio,
            formData.horaFin,
            formData.cantidadReservada
          );
        }
      } else {
        const availableRentalTariffs = tarifas
          .filter((tarifa) => getDurationMinutes(buildTarifaDurationValue(tarifa)) !== null)
          .sort((left, right) => {
            const leftDuration = getDurationMinutes(buildTarifaDurationValue(left)) ?? 0;
            const rightDuration = getDurationMinutes(buildTarifaDurationValue(right)) ?? 0;
            return leftDuration - rightDuration;
          });

        setFormData((prev) => {
          return {
            ...prev,
            numeroPersonas: Math.min(prev.numeroPersonas, actividadMaxPersonas),
            duracion: '',
            fechaFin: '',
            horaFin: '',
            precio: 0
          };
        });
        setRentalDurationMode('preset');
        setCustomRentalHours('');
        setCustomRentalMinutes('');
        setCurrentStep(1);
        setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
      }

      return;
    }

    if (field === 'actividad' && !value) {
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
      setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
      setCampHorarioReglas([]);
      setCampTurnoSeleccionado('');
      setCurrentStep(1);
      setRentalDurationMode('preset');
      setCustomRentalHours('');
      setCustomRentalMinutes('');
      setFormData((prev) => ({
        ...prev,
        duracion: '',
        horaFin: '',
        fechaFin: '',
        precio: 0
      }));
      return;
    }

    if (nextIsRental) {
      return;
    }

    if (nextIsCamp) {
      return;
    }

    if (nextIsBanana) {
      if (field === 'fechaInicio' && !value) {
        setStockInfo(null);
      }

      if (
        actividadSeleccionada &&
        ['fechaInicio', 'horaInicio', 'cantidadReservada'].includes(field)
      ) {
        const nextFechaInicio = field === 'fechaInicio' ? String(value || '') : formData.fechaInicio;
        const nextHoraInicio = field === 'horaInicio' ? String(value || '') : formData.horaInicio;
        const nextCantidad = field === 'cantidadReservada'
          ? Number(value || 1)
          : (showBananaQuantitySelector ? formData.cantidadReservada : 1);
        const durationToUse = formData.duracion || (bananaBaseTariff ? buildTarifaDurationValue(bananaBaseTariff) : '');

        if (nextFechaInicio && nextHoraInicio && durationToUse) {
          const nuevaHoraFin = calculateGenericHoraFin(nextHoraInicio, durationToUse);
          if (nuevaHoraFin) {
            await consultarStock(actividadSeleccionada.id, nextFechaInicio, nextHoraInicio, nuevaHoraFin, Math.max(1, nextCantidad));
          }
        }
      }

      if (field === 'numeroPersonas' && bananaBaseTariff && !precioManualPendiente && typeof value === 'number') {
        setFormData((prev) => ({ ...prev, precio: Number((bananaBaseTariff.precio * value).toFixed(2)) }));
      }

      return;
    }

    if (field === 'fechaInicio' && !value) {
      setStockInfo(null);
    }

    if (
      nextIsRoute &&
      actividadSeleccionada &&
      ['fechaInicio', 'fechaFin', 'horaInicio', 'horaFin', 'cantidadReservada'].includes(field)
    ) {
      const nextFechaInicio = field === 'fechaInicio' ? String(value || '') : formData.fechaInicio;
      const nextFechaFin = field === 'fechaFin' ? String(value || '') : formData.fechaFin;
      const nextHoraInicio = field === 'horaInicio' ? String(value || '') : formData.horaInicio;
      const nextHoraFin = field === 'horaFin' ? String(value || '') : formData.horaFin;
      const nextCantidad = field === 'cantidadReservada' ? Number(value || 0) : formData.cantidadReservada;

      if (nextFechaInicio && nextFechaFin && nextHoraInicio && nextHoraFin && nextCantidad > 0) {
        await consultarStock(actividadSeleccionada.id, nextFechaInicio, nextHoraInicio, nextHoraFin, nextCantidad);
      }
    }

    if (field === 'fechaInicio' && value && actividadSeleccionada && formData.duracion) {
      const horaActual = getCurrentTimeInputValue();
      const horaFinCalculada = calculateGenericHoraFin(horaActual, formData.duracion);
      if (horaFinCalculada) {
        await consultarStock(actividadSeleccionada.id, String(value), horaActual, horaFinCalculada, effectiveInventoryQuantity);
      }
    }

    if (field === 'horaInicio' && value && actividadSeleccionada && formData.fechaInicio && formData.duracion) {
      const nuevaHoraFin = calculateGenericHoraFin(String(value), formData.duracion);
      if (nuevaHoraFin) {
        await consultarStock(actividadSeleccionada.id, formData.fechaInicio, String(value), nuevaHoraFin, effectiveInventoryQuantity);
      }
    }

    if (field === 'horaFin' && value && actividadSeleccionada && formData.fechaInicio && formData.duracion && formData.horaInicio) {
      await consultarStock(actividadSeleccionada.id, formData.fechaInicio, formData.horaInicio, String(value), effectiveInventoryQuantity);
    }

    if (field === 'duracion' && value && actividadSeleccionada && formData.fechaInicio && formData.horaInicio) {
      const nuevaHoraFin = calculateGenericHoraFin(formData.horaInicio, String(value));
      if (nuevaHoraFin) {
        await consultarStock(actividadSeleccionada.id, formData.fechaInicio, formData.horaInicio, nuevaHoraFin, effectiveInventoryQuantity);
      }
    } else if (field === 'duracion' && !value) {
      setStockInfo(null);
    }

    if (field === 'numeroPersonas' && formData.duracion) {
      const selectedTarifa = tarifasActividad.find(
        (tarifa) => buildTarifaDurationValue(tarifa) === formData.duracion
      );
      const requiresManualPrice = selectedTarifa?.precio === 0 && selectedTarifa.metadata?.precio_manual === true;
      if (selectedTarifa && typeof value === 'number' && !requiresManualPrice) {
        const precioCalculado = usesPerPersonPricing ? selectedTarifa.precio * value : selectedTarifa.precio;
        setFormData((prev) => ({ ...prev, precio: precioCalculado }));
      }

      if (syncReservedQuantityWithPeople && actividadSeleccionada && formData.fechaInicio && formData.horaInicio) {
        const horaFinCalculada = calculateGenericHoraFin(formData.horaInicio, formData.duracion);
        if (horaFinCalculada) {
          const cantidadInventario = actividadSeleccionada.usa_pool_inventario && actividadSeleccionada.numero_personas
            ? Math.max(1, Math.ceil((value as number) / actividadSeleccionada.numero_personas))
            : (value as number);
          await consultarStock(actividadSeleccionada.id, formData.fechaInicio, formData.horaInicio, horaFinCalculada, cantidadInventario);
        }
      }
    }
  };

  const handleRentalDurationSelection = async (value: string) => {
    if (value === CUSTOM_RENTAL_DURATION_OPTION) {
      const currentDurationMin = getDurationMinutes(formData.duracion);
      const nextParts = splitDurationMinutes(currentDurationMin);
      const nextDuration = currentDurationMin ? buildDurationValue(currentDurationMin, 'minuto') : '';

      setRentalDurationMode('custom');
      setCustomRentalHours(nextParts.hours);
      setCustomRentalMinutes(nextParts.minutes);
      await handleInputChange('duracion', nextDuration);
      return;
    }

    setRentalDurationMode('preset');
    await handleInputChange('duracion', value);
  };

  const handleCustomRentalDurationChange = async (part: 'hours' | 'minutes', rawValue: string) => {
    const numericValue = rawValue.replace(/\D/g, '');
    const normalizedValue = part === 'minutes' && numericValue !== ''
      ? String(Math.min(Number(numericValue), 59))
      : numericValue;
    const nextHours = part === 'hours' ? normalizedValue : customRentalHours;
    const nextMinutes = part === 'minutes' ? normalizedValue : customRentalMinutes;

    if (part === 'hours') {
      setCustomRentalHours(normalizedValue);
    } else {
      setCustomRentalMinutes(normalizedValue);
    }

    await handleInputChange('duracion', buildCustomRentalDurationValue(nextHours, nextMinutes));
  };

  const handlePriceInputFocus = () => {
    if (!precioManualPendiente) {
      return;
    }

    setIsEditingPriceInput(true);
    setPriceInputValue(
      formatPriceInputValue(Number(formData.precio ?? 0), {
        editing: true,
        allowEmptyZero: true
      })
    );
  };

  const handlePriceInputChange = (rawValue: string) => {
    const sanitizedValue = sanitizePriceInput(rawValue);
    setPriceInputValue(sanitizedValue);
    void handleInputChange('precio', parsePriceInput(sanitizedValue));
  };

  const handlePriceInputBlur = () => {
    setIsEditingPriceInput(false);
    setPriceInputValue(
      formatPriceInputValue(Number(formData.precio ?? 0), {
        allowEmptyZero: precioManualPendiente
      })
    );
  };

  const updateCourseRangeEditorField = (rangeId: string, field: keyof CursoRangeDraft, value: string) => {
    setCourseRangeEditor((prev) =>
      prev.map((range) => {
        if (range.id !== rangeId) {
          return range;
        }

        if (field === 'fechaInicio') {
          return {
            ...range,
            fechaInicio: value,
            fechaFin: value
          };
        }

        return {
          ...range,
          [field]: value
        };
      })
    );
    setCourseRangeErrors((prev) => {
      const next = { ...prev };
      delete next[rangeId];
      delete next.__summary;
      return next;
    });
  };

  const addCourseRangeEditorRow = () => {
    const lastRange = courseRangeEditor[courseRangeEditor.length - 1];
    setCourseRangeEditor((prev) => [
      ...prev,
      createCursoRangeDraft(lastRange?.fechaInicio || getTodayInputValue(), lastRange?.horaFin || lastRange?.horaInicio || getCurrentTimeInputValue())
    ]);
  };

  const removeCourseRangeEditorRow = (rangeId: string) => {
    setCourseRangeEditor((prev) => prev.filter((range) => range.id !== rangeId));
    setCourseRangeErrors((prev) => {
      const next = { ...prev };
      delete next[rangeId];
      delete next.__summary;
      return next;
    });
  };

  const validateAndSaveCourseRanges = async () => {
    if (!actividadSeleccionada || !courseSelectedTariff || !courseDurationSelectedMin) {
      return;
    }

    const nextErrors: Record<string, string> = {};
    const normalizedRanges = [...courseRangeEditor];

    if (normalizedRanges.length === 0) {
      nextErrors.__summary = 'Añade al menos un tramo.';
    }

    normalizedRanges.forEach((range) => {
      if (!range.fechaInicio || !range.horaInicio || !range.horaFin) {
        nextErrors[range.id] = 'Completa fecha y horario del tramo.';
        return;
      }

      if (range.fechaFin !== range.fechaInicio) {
        nextErrors[range.id] = 'Cada tramo debe empezar y terminar el mismo día.';
        return;
      }

      if (range.fechaInicio === today && range.horaInicio < getCurrentTimeInputValue()) {
        nextErrors[range.id] = 'No puedes usar una hora de inicio anterior a la actual.';
        return;
      }

      if (calculateCourseRangeDuration(range) <= 0) {
        nextErrors[range.id] = 'La hora de fin debe ser posterior a la hora de inicio.';
      }
    });

    const sortedRanges = normalizedRanges.sort(compareCursoRanges);
    for (let index = 1; index < sortedRanges.length; index += 1) {
      const prev = sortedRanges[index - 1];
      const current = sortedRanges[index];
      const prevEnd = new Date(`${prev.fechaFin}T${prev.horaFin}:00`).getTime();
      const currentStart = new Date(`${current.fechaInicio}T${current.horaInicio}:00`).getTime();
      if (prevEnd > currentStart) {
        nextErrors[current.id] = 'Este tramo se solapa con el anterior.';
      }
    }

    const assignedMinutes = sortedRanges.reduce((total, range) => total + calculateCourseRangeDuration(range), 0);
    if (assignedMinutes > courseDurationSelectedMin) {
      nextErrors.__summary = `La suma de tramos no puede superar ${formatMinutesSummary(courseDurationSelectedMin)}.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setCourseRangeErrors(nextErrors);
      return;
    }

    setIsValidatingCourseRanges(true);
    try {
      for (const range of sortedRanges) {
        const availability = await consultarStockDisponible(
          actividadSeleccionada.id,
          range.fechaInicio,
          range.horaInicio,
          range.horaFin,
          effectiveInventoryQuantity
        );

        if (!availability.success) {
          nextErrors[range.id] = availability.message || 'No se pudo validar la disponibilidad de este tramo.';
          continue;
        }

        if (!availability.disponible || (availability.stockDisponible ?? 0) < effectiveInventoryQuantity) {
          nextErrors[range.id] = availability.message || 'No hay disponibilidad suficiente para este tramo.';
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setCourseRangeErrors(nextErrors);
        return;
      }

      const hasPartialAssignment = assignedMinutes < courseDurationSelectedMin;
      setCourseRanges(sortedRanges.map((range) => ({ ...range })));
      setCourseRangeErrors({});
      setCourseRangesValidationMessage(
        hasPartialAssignment
          ? `Tramos guardados y validados correctamente. Quedan ${formatMinutesSummary(courseDurationSelectedMin - assignedMinutes)} pendientes por asignar.`
          : 'Tramos guardados y validados correctamente.'
      );
      setErrors((prev) => ({ ...prev, rangosCurso: '' }));
      setShowCourseRangesModal(false);
    } finally {
      setIsValidatingCourseRanges(false);
    }
  };

  const handleCampTurnoChange = (turnoKey: string) => {
    setCampTurnoSeleccionado(turnoKey);
    setErrors((prev) => ({
      ...prev,
      campTurno: '',
      fechaFin: ''
    }));
  };

  const validateRentalStepOne = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCourseStepOne = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRouteStepOne = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBananaStepOne = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCampStepOne = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStandardForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.empresa) {
      newErrors.empresa = 'La empresa es obligatoria';
    }

    if (!formData.tipoActividad) {
      newErrors.tipoActividad = 'El tipo de actividad es obligatorio';
    }

    if (!formData.actividad.trim()) {
      newErrors.actividad = 'La actividad es obligatoria';
    }

    if (tarifasActividad.length >= 1 && !formData.duracion) {
      newErrors.duracion = 'La duración es obligatoria';
    }

    if (!effectiveReservedQuantity || effectiveReservedQuantity < 1) {
      if (usesPerPersonPricing) {
        newErrors.numeroPersonas = 'Debes indicar al menos 1 persona';
      } else {
        newErrors.cantidadReservada = 'La cantidad debe ser al menos 1';
      }
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'El número de personas debe ser al menos 1';
    }

    if (formData.numeroPersonas > maxNumeroPersonas) {
      newErrors.numeroPersonas =
        actividadSeleccionada?.numero_personas && actividadSeleccionada.numero_personas > 0
          ? `El número máximo de personas para esta actividad es ${maxNumeroPersonas}`
          : `El número máximo de personas es ${maxNumeroPersonas}`;
    }

    if (!isCourseMultiRangeTariff && stockInfo && stockInfo.stockDisponible < effectiveInventoryQuantity) {
      if (usesGroupedInventory) {
        newErrors.numeroPersonas = `No hay material suficiente para ${formData.numeroPersonas} personas en esa franja.`;
      } else if (usesPerPersonPricing) {
        newErrors.numeroPersonas = `Solo hay ${stockInfo.stockDisponible} plazas disponibles. Total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
      } else {
        newErrors.cantidadReservada = `Solo hay ${stockInfo.stockDisponible} unidades disponibles. Stock total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
      }
    }

    if (!isCourseMultiRangeTariff && stockInfo && stockInfo.stockDisponible === 0) {
      newErrors.actividad = usesGroupedInventory
        ? 'No hay material disponible para esta actividad en la fecha seleccionada'
        : usesPerPersonPricing
        ? 'No hay plazas disponibles para esta actividad en la fecha seleccionada'
        : 'No hay stock disponible para esta actividad en la fecha seleccionada';
    }

    if (precioManualPendiente && formData.precio <= 0) {
      newErrors.precio = 'Debes indicar un precio manual mayor que 0';
    }

    if (isCourseMultiRangeTariff) {
      if (!isCoursePendingAssignmentMode) {
        if (courseRanges.length === 0) {
          newErrors.rangosCurso = 'Debes configurar al menos un tramo para repartir las horas del curso.';
        }

        if (!courseDurationSelectedMin) {
          newErrors.rangosCurso = `No se ha podido calcular la duración del curso.`;
        } else if (courseAssignedMinutes > courseDurationSelectedMin) {
          newErrors.rangosCurso = `La suma de tramos no puede superar ${formatDurationLabel(formData.duracion)}.`;
        }
      }
    } else {
      if (!formData.fechaInicio) {
        newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
      }

      if (!formData.fechaFin) {
        newErrors.fechaFin = 'La fecha de fin es obligatoria';
      }

      if (!formData.horaInicio) {
        newErrors.horaInicio = 'La hora de inicio es obligatoria';
      } else if (formData.fechaInicio === today && formData.horaInicio < getCurrentTimeInputValue()) {
        newErrors.horaInicio = 'No se puede seleccionar una hora anterior a la hora actual';
      }

      if (formData.fechaInicio && formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
        newErrors.fechaFin = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRentalStepTwo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    } else if (formData.fechaInicio === today && formData.horaInicio < getCurrentTimeInputValue()) {
      newErrors.horaInicio = 'No se puede seleccionar una hora anterior a la hora actual';
    }

    if (!formData.cantidadReservada || formData.cantidadReservada < 1) {
      newErrors.cantidadReservada = 'La cantidad debe ser al menos 1';
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'El numero de personas debe ser al menos 1';
    }

    if (formData.numeroPersonas > maxNumeroPersonas) {
      newErrors.numeroPersonas =
        actividadSeleccionada?.numero_personas && actividadSeleccionada.numero_personas > 0
          ? `El numero maximo de personas para esta actividad es ${maxNumeroPersonas}`
          : `El numero maximo de personas es ${maxNumeroPersonas}`;
    }

    if (!formData.duracion) {
      newErrors.duracion = 'La duracion es obligatoria';
    }

    if (!isCustomRentalDuration && rentalDurationOptions.length === 0) {
      newErrors.horaInicio = 'No hay margen horario suficiente para una reserva dentro del mismo dia.';
    }

    const durationMin = rentalDurationSelectedMin;
    if (durationMin) {
      const range = calculateRentalRange(formData.fechaInicio, formData.horaInicio, durationMin);
      if (!range || range.crossesDay) {
        newErrors.duracion = 'La duración seleccionada supera las 23:59 del mismo día.';
      }
    }

    if (precioManualPendiente && formData.precio <= 0) {
      newErrors.precio = 'Debes indicar un precio manual mayor que 0';
    }

    if (rentalAvailability.status === 'unavailable') {
      newErrors.cantidadReservada = rentalAvailability.message || 'No hay disponibilidad para esa franja.';
    }

    if (rentalAvailability.status === 'error') {
      newErrors.duracion = rentalAvailability.message || 'No se pudo comprobar la disponibilidad.';
    }

    if (rentalAvailability.status !== 'available' && rentalAvailability.status !== 'checking' && formData.fechaInicio && formData.horaInicio && formData.cantidadReservada > 0) {
      newErrors.cantidadReservada = newErrors.cantidadReservada || 'Completa los datos para comprobar la disponibilidad.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRouteStepTwo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    } else if (formData.fechaInicio === today && formData.horaInicio < getCurrentTimeInputValue()) {
      newErrors.horaInicio = 'No se puede seleccionar una hora anterior a la hora actual';
    }

    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es obligatoria';
    }

    if (formData.fechaInicio && formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
      newErrors.fechaFin = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
    }

    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.horaInicio &&
      formData.horaFin &&
      new Date(`${formData.fechaFin}T${formData.horaFin}:00`) <= new Date(`${formData.fechaInicio}T${formData.horaInicio}:00`)
    ) {
      newErrors.horaFin = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    if (!formData.cantidadReservada || formData.cantidadReservada < 1) {
      newErrors.cantidadReservada = 'La cantidad debe ser al menos 1';
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'El número de personas debe ser al menos 1';
    }

    if (precioManualPendiente && formData.precio <= 0) {
      newErrors.precio = 'Debes indicar un precio manual mayor que 0';
    }

    if (stockInfo && stockInfo.stockDisponible < effectiveInventoryQuantity) {
      newErrors.cantidadReservada = `Solo hay ${stockInfo.stockDisponible} unidades disponibles. Stock total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
    }

    if (stockInfo && stockInfo.stockDisponible === 0) {
      newErrors.actividad = 'No hay stock disponible para esta ruta en la franja seleccionada';
    }

    if (
      !stockInfo &&
      formData.fechaInicio &&
      formData.fechaFin &&
      formData.horaInicio &&
      formData.horaFin &&
      formData.cantidadReservada > 0
    ) {
      newErrors.cantidadReservada = 'Completa los datos para comprobar la disponibilidad.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCampStepTwo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (formData.fechaInicio && formData.fechaFin && formData.fechaFin < formData.fechaInicio) {
      newErrors.fechaFin = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
    }

    if (campTurnoOptions.length === 0) {
      newErrors.actividad = 'Este campamento no tiene horarios recurrentes configurados.';
    } else if (campTurnoOptions.length > 1 && !campTurnoSeleccionado) {
      newErrors.campTurno = 'Debes seleccionar un turno para el campamento.';
    }

    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      campTurnoOptions.length > 0 &&
      campOccurrences.length === 0
    ) {
      newErrors.fechaFin = 'El rango seleccionado no genera ninguna sesión de campamento.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBananaStepTwo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es obligatoria';
    } else if (formData.fechaInicio === today && formData.horaInicio < getCurrentTimeInputValue()) {
      newErrors.horaInicio = 'No se puede seleccionar una hora anterior a la hora actual';
    }

    if (!formData.duracion) {
      newErrors.duracion = 'La duración es obligatoria';
    }

    if (!formData.numeroPersonas || formData.numeroPersonas < 1) {
      newErrors.numeroPersonas = 'Debes indicar al menos 1 persona';
    }

    if (formData.numeroPersonas > maxNumeroPersonas) {
      newErrors.numeroPersonas =
        actividadSeleccionada?.numero_personas && actividadSeleccionada.numero_personas > 0
          ? `El número máximo de personas para esta actividad es ${maxNumeroPersonas}`
          : `El número máximo de personas es ${maxNumeroPersonas}`;
    }

    if (showBananaQuantitySelector && (!formData.cantidadReservada || formData.cantidadReservada < 1)) {
      newErrors.cantidadReservada = 'Debes reservar al menos 1 banana';
    }

    if (precioManualPendiente && formData.precio <= 0) {
      newErrors.precio = 'Debes indicar un precio manual mayor que 0';
    }

    if (stockInfo && stockInfo.stockDisponible < effectiveInventoryQuantity) {
      const stockError = `Solo hay ${stockInfo.stockDisponible} bananas disponibles. Stock total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
      if (showBananaQuantitySelector) {
        newErrors.cantidadReservada = stockError;
      } else {
        newErrors.horaInicio = stockError;
      }
    }

    if (stockInfo && stockInfo.stockDisponible === 0) {
      newErrors.horaInicio = 'No hay bananas disponibles para esa franja';
    }

    if (
      !stockInfo &&
      formData.fechaInicio &&
      formData.horaInicio &&
      effectiveInventoryQuantity > 0
    ) {
      newErrors.horaInicio = 'Espera a que se compruebe la disponibilidad antes de continuar.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRental && currentStep === 1) {
      if (validateRentalStepOne()) {
        setCurrentStep(2);
      }
      return;
    }

    if (isCourse && currentStep === 1) {
      if (validateCourseStepOne()) {
        setCurrentStep(2);
      }
      return;
    }

    if (isRoute && currentStep === 1) {
      if (validateRouteStepOne()) {
        setCurrentStep(2);
      }
      return;
    }

    if (isCamp && currentStep === 1) {
      if (validateCampStepOne()) {
        setCurrentStep(2);
      }
      return;
    }

    if (isSport && currentStep === 1) {
      if (validateBananaStepOne()) {
        setCurrentStep(2);
      }
      return;
    }

    const isValid = isRental
      ? validateRentalStepTwo()
      : isRoute
        ? validateRouteStepTwo()
        : isCamp
          ? validateCampStepTwo()
          : isBanana
            ? validateBananaStepTwo()
        : validateStandardForm();
    if (!isValid || rentalAvailability.status === 'checking') {
      return;
    }

    if (isCamp) {
      if (!actividadSeleccionada || !campamentoMetadata) {
        setErrors((prev) => ({
          ...prev,
          actividad: prev.actividad || 'No se ha podido preparar el programa de campamento.'
        }));
        return;
      }

      const result = await crearProgramaCampamento({
        servicioId: actividadSeleccionada.id,
        fechaInicio: campamentoMetadata.fecha_inicio,
        fechaFin: campamentoMetadata.fecha_fin,
        diasSemana: campamentoMetadata.dias_semana,
        horaInicio: campamentoMetadata.hora_inicio,
        horaFin: campamentoMetadata.hora_fin,
        turnoCodigo: campamentoMetadata.turno_codigo ?? null,
        turnoLabel: campamentoMetadata.turno_label ?? null,
        notas: formData.nota || ''
      });

      if (!result.success) {
        onToast({
          visible: true,
          message: result.message,
          type: 'error'
        });
        return;
      }

      onToast({
        visible: true,
        message: 'Programa de campamento creado correctamente',
        type: 'success'
      });

      await onSubmit({
        empresa: formData.empresa,
        tipoActividad: 'campamento',
        actividad: formData.actividad,
        cantidadReservada: 0,
        numeroPersonas: 0,
        precio: 0,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        nota: formData.nota || undefined,
        campamentoMetadata
      });

      handleClose();
      return;
    }

    setShowModalPago(true);
    setPaymentCompleted(false);
  };

  const handlePagoSubmit = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onToast({
        visible: true,
        message: 'Reserva y pago creados exitosamente',
        type: 'success'
      });

      onSubmit({
        empresa: formData.empresa,
        tipoActividad: formData.tipoActividad,
        actividad: formData.actividad,
        cantidadReservada: effectiveInventoryQuantity,
        numeroPersonas: formData.numeroPersonas,
        precio: formData.precio,
        tarifaId: tarifaSeleccionada?.id,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        nota: formData.nota || undefined,
        rangos: isCourseMultiRangeTariff
          ? isCoursePendingAssignmentMode
            ? undefined
            : sortedCourseRanges.map((range) => ({
                id: range.id,
                fechaInicio: range.fechaInicio,
                fechaFin: range.fechaFin,
                horaInicio: range.horaInicio,
                horaFin: range.horaFin,
                duracionMin: calculateCourseRangeDuration(range)
              }))
          : undefined,
        campamentoMetadata: campamentoMetadata ?? undefined,
        reservaFechaInicio: campFirstOccurrence?.date ?? undefined,
        reservaFechaFin: campLastOccurrence?.date ?? undefined,
        asignarTramosDespues: isCoursePendingAssignmentMode,
        duracionTotalMin: isCourse ? courseDurationSelectedMin ?? undefined : undefined
      });

      setPaymentCompleted(true);
    } catch (error) {
      console.error('Error al procesar el pago:', error);
    }
  };

  const handlePagoModalClose = () => {
    if (paymentCompleted) {
      handleClose();
      return;
    }

    setShowModalPago(false);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleCloseCampamentoInscripcion = () => {
    setClosingCampamentoFlow(true);
    handleClose();
  };

  const handleUseSuggestedSlot = () => {
    if (!rentalAvailability.suggestion) return;

    const suggestion = rentalAvailability.suggestion;
    setFormData((prev) => ({
      ...prev,
      fechaInicio: suggestion.fechaInicio,
      horaInicio: suggestion.horaInicio,
      fechaFin: suggestion.fechaFin,
      horaFin: suggestion.horaFin
    }));
    setErrors((prev) => ({
      ...prev,
      fechaInicio: '',
      horaInicio: '',
      cantidadReservada: '',
      duracion: ''
    }));
  };

  const renderRentalAvailabilityCard = () => {
    if (currentStep !== 2) return null;

    if (rentalAvailability.status === 'idle') {
      return (
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          Selecciona fecha, hora, unidades y duración. Cuando estén completos, comprobaremos la disponibilidad real de esa tarifa.
        </div>
      );
    }

    if (rentalAvailability.status === 'checking') {
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary-dark">
          Comprobando disponibilidad para {rentalAvailability.checkedDurationMin ? formatDurationLabel(buildDurationValue(rentalAvailability.checkedDurationMin, 'minuto')) : 'la duración seleccionada'}...
        </div>
      );
    }

    if (rentalAvailability.status === 'available') {
      return (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 dark:border-green-900/40 dark:bg-green-900/10">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">{rentalAvailability.message}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-green-700 dark:text-green-300">
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{rentalAvailability.stockDisponible ?? 0}</div>
                  <div>Disponibles</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{rentalAvailability.stockTotal ?? 0}</div>
                  <div>Stock total</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{rentalAvailability.reservadas ?? 0}</div>
                  <div>Reservadas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (rentalAvailability.status === 'unavailable') {
      const suggestion = rentalAvailability.suggestion;
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/40 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">{rentalAvailability.message}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-red-700 dark:text-red-300">
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{rentalAvailability.stockDisponible ?? 0}</div>
                  <div>Disponibles</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{rentalAvailability.stockTotal ?? 0}</div>
                  <div>Stock total</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{rentalAvailability.reservadas ?? 0}</div>
                  <div>Reservadas</div>
                </div>
              </div>
              {suggestion && (
                <div className="mt-4 rounded-xl border border-red-200/70 bg-white/80 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500 dark:text-red-300">
                    Primer hueco sugerido
                  </p>
                  <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-200">
                    {formatDisplayDate(suggestion.fechaInicio)} · {suggestion.horaInicio} - {suggestion.horaFin}
                  </p>
                  <button
                    type="button"
                    onClick={handleUseSuggestedSlot}
                    className="mt-3 inline-flex items-center rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/30 cursor-pointer"
                  >
                    Usar este hueco
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
        {rentalAvailability.message}
      </div>
    );
  };

  const renderCourseAvailabilityCard = () => {
    if (currentStep !== 2) return null;

    if (isCourseMultiRangeTariff) {
      const objetivoLabel = formData.duracion ? formatDurationLabel(formData.duracion) : 'la duración seleccionada';
      return (
        <div className="rounded-2xl border border-outline-variant/35 bg-surface-container-low px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 self-start rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-1.5">
              <button
                type="button"
                onClick={() => setCourseAssignmentMode('now')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  !isCoursePendingAssignmentMode
                    ? 'primary-gradient text-white shadow-md shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                } cursor-pointer`}
              >
                Asignar ahora
              </button>
              <button
                type="button"
                onClick={() => {
                  setCourseAssignmentMode('later');
                  setErrors((prev) => ({ ...prev, rangosCurso: '' }));
                  setCourseRangesValidationMessage('');
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isCoursePendingAssignmentMode
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                } cursor-pointer`}
              >
                Asignar después
              </button>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">Distribución horaria del curso</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {isCoursePendingAssignmentMode
                    ? `Guardaremos la venta del curso y sus ${objetivoLabel} quedarán pendientes de asignar más adelante.`
                    : `Reparte las ${objetivoLabel} del curso en tantos tramos como necesites. Validaremos cada tramo antes de continuar.`}
                </p>
              </div>
              {!isCoursePendingAssignmentMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setCourseRangeEditor(courseRanges.length > 0 ? courseRanges.map((range) => ({ ...range })) : [createCursoRangeDraft()]);
                    setCourseRangeErrors({});
                    setShowCourseRangesModal(true);
                  }}
                  className="inline-flex shrink-0 items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15 cursor-pointer"
                >
                  Configurar rangos
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-white/70 px-3 py-2 text-on-surface-variant">
              <div className="font-bold text-on-surface">{isCoursePendingAssignmentMode ? 0 : sortedCourseRanges.length}</div>
              <div>{isCoursePendingAssignmentMode ? 'Pendientes' : 'Tramos'}</div>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2 text-on-surface-variant">
              <div className="font-bold text-on-surface">{formatMinutesSummary(isCoursePendingAssignmentMode ? 0 : courseAssignedMinutes)}</div>
              <div>Asignadas</div>
            </div>
            <div className="rounded-xl bg-white/70 px-3 py-2 text-on-surface-variant">
              <div className={`font-bold ${isCoursePendingAssignmentMode || courseRemainingMinutes > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {formatMinutesSummary(isCoursePendingAssignmentMode ? (courseDurationSelectedMin ?? 0) : Math.abs(courseRemainingMinutes))}
              </div>
              <div>{isCoursePendingAssignmentMode ? 'Pendientes' : courseRemainingMinutes === 0 ? 'Completado' : courseRemainingMinutes > 0 ? 'Restantes' : 'Exceso'}</div>
            </div>
          </div>

          {!isCoursePendingAssignmentMode && sortedCourseRanges.length > 0 ? (
            <div className="mt-4 space-y-2">
              {sortedCourseRanges.map((range, index) => (
                <div key={range.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
                  <span className="font-semibold">Tramo {index + 1}</span>
                  <span className="ml-2 text-on-surface-variant">
                    {formatDisplayDate(range.fechaInicio)} · {range.horaInicio} - {range.horaFin}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-outline-variant/50 px-3 py-3 text-sm text-on-surface-variant">
              {isCoursePendingAssignmentMode
                ? 'La reserva se creará sin tramos. Podrás asignarlos más adelante desde el botón Pendientes.'
                : 'Aún no has configurado los rangos del curso.'}
            </div>
          )}

          {courseRangesValidationMessage ? (
            <p className="mt-3 text-sm text-green-700">{courseRangesValidationMessage}</p>
          ) : null}
          {errors.rangosCurso ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{errors.rangosCurso}</p>
          ) : null}
        </div>
      );
    }

    if (!actividadSeleccionada || !formData.fechaInicio || !formData.horaInicio || !formData.duracion || effectiveReservedQuantity < 1) {
      return (
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          Selecciona fecha, hora, duracion y plazas. En cuanto tengamos esos datos, comprobaremos si el curso tiene hueco.
        </div>
      );
    }

    if (consultandoStock) {
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary-dark">
          Comprobando si el curso tiene hueco en esa franja...
        </div>
      );
    }

    if (!stockInfo) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
          No se pudo comprobar la disponibilidad del curso para esa franja.
        </div>
      );
    }

    const hasAvailability = stockInfo.stockDisponible >= effectiveInventoryQuantity && stockInfo.stockDisponible > 0;

    if (hasAvailability) {
      return (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4 dark:border-green-900/40 dark:bg-green-900/10">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                Hay hueco para este curso en la franja seleccionada.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-green-700 dark:text-green-300">
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{stockInfo.stockDisponible}</div>
                  <div>{usesGroupedInventory ? 'Unidades libres' : 'Plazas libres'}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{stockInfo.stockTotal}</div>
                  <div>{usesGroupedInventory ? 'Stock total' : 'Capacidad'}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-green-950/20">
                  <div className="font-bold">{stockInfo.reservadas}</div>
                  <div>{usesGroupedInventory ? 'Uni. reservadas' : 'Reservadas'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900/40 dark:bg-red-900/10">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {usesGroupedInventory
                  ? 'No hay material suficiente para este curso en la franja seleccionada.'
                  : 'No hay hueco suficiente para este curso en la franja seleccionada.'}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs text-red-700 dark:text-red-300">
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{stockInfo.stockDisponible}</div>
                  <div>{usesGroupedInventory ? 'Unidades libres' : 'Plazas libres'}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{stockInfo.stockTotal}</div>
                  <div>{usesGroupedInventory ? 'Stock total' : 'Capacidad'}</div>
                </div>
                <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-red-950/20">
                  <div className="font-bold">{stockInfo.reservadas}</div>
                  <div>{usesGroupedInventory ? 'Uni. reservadas' : 'Reservadas'}</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    );
  };

  const renderRouteAvailabilityCard = () => {
    if (currentStep !== 2) return null;

    if (!actividadSeleccionada || !formData.fechaInicio || !formData.horaInicio || !formData.horaFin || formData.cantidadReservada < 1) {
      return (
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          Selecciona fecha, hora de inicio, hora de fin y cantidad. En cuanto tengamos esos datos, comprobaremos si la ruta tiene material disponible.
        </div>
      );
    }

    if (consultandoStock) {
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary-dark">
          Comprobando disponibilidad de material para la ruta...
        </div>
      );
    }

    if (!stockInfo) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
          No se pudo comprobar la disponibilidad de la ruta para esa franja.
        </div>
      );
    }

    const hasAvailability = stockInfo.stockDisponible >= formData.cantidadReservada && stockInfo.stockDisponible > 0;

    return (
      <div className={`rounded-2xl px-4 py-4 ${hasAvailability
        ? 'border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
        : 'border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
      }`}>
        <div className="flex items-start gap-3">
          {hasAvailability
            ? <CheckCircleIcon className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
            : <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${hasAvailability ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {hasAvailability
                ? `Hay ${routeMaterialLabels.pluralText} disponibles para esta ruta en la franja seleccionada.`
                : `No hay ${routeMaterialLabels.pluralText} suficientes para esta ruta en la franja seleccionada.`}
            </p>
            <div className={`mt-2 grid grid-cols-3 gap-3 text-xs ${hasAvailability ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.stockDisponible}</div>
                <div>Disponibles</div>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.stockTotal}</div>
                <div>Stock total</div>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.reservadas}</div>
                <div>Reservadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBananaAvailabilityCard = () => {
    if (currentStep !== 2) return null;

    if (!actividadSeleccionada || !formData.fechaInicio || !formData.horaInicio || effectiveInventoryQuantity < 1) {
      return (
        <div className="rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          Selecciona fecha, hora y personas. En cuanto tengamos esos datos, comprobaremos si hay banana disponible para esa franja.
        </div>
      );
    }

    if (consultandoStock) {
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary-dark">
          Comprobando disponibilidad de banana para esa franja...
        </div>
      );
    }

    if (!stockInfo) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
          No se pudo comprobar la disponibilidad de banana para esa franja.
        </div>
      );
    }

    const hasAvailability = stockInfo.stockDisponible >= effectiveInventoryQuantity && stockInfo.stockDisponible > 0;

    return (
      <div className={`rounded-2xl px-4 py-4 ${hasAvailability
        ? 'border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
        : 'border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10'
      }`}>
        <div className="flex items-start gap-3">
          {hasAvailability
            ? <CheckCircleIcon className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
            : <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${hasAvailability ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {hasAvailability
                ? 'Hay banana disponible para esta franja.'
                : 'No hay suficiente banana disponible para esta franja.'}
            </p>
            <div className={`mt-2 grid grid-cols-3 gap-3 text-xs ${hasAvailability ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.stockDisponible}</div>
                <div>Disponibles</div>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.stockTotal}</div>
                <div>Stock total</div>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2 dark:bg-slate-950/20">
                <div className="font-bold">{stockInfo.reservadas}</div>
                <div>Reservadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBananaStepOne = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 1/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Selecciona la actividad sport</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary/25" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-black text-on-surface-variant">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="empresa-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa-banana"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad-banana"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="actividad-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Actividad *
        </label>
        <select
          id="actividad-banana"
          value={formData.actividad}
          onChange={(e) => handleInputChange('actividad', e.target.value)}
          disabled={loadingActividades}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">
            {loadingActividades
              ? 'Cargando actividades...'
              : actividadesExistentes.length === 0
                ? 'No hay actividades de este tipo'
                : 'Selecciona una actividad'}
          </option>
          {actividadesExistentes.map((actividad) => (
            <option key={actividad.id} value={actividad.nombre}>
              {actividad.nombre}
            </option>
          ))}
        </select>
        {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
        {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Continuar
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderBananaStepTwo = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 2/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Configura horario, personas y material</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-sm font-black text-primary">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fechaInicio-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio-banana"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={today}
                className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
            </div>

            <div>
              <label htmlFor="fechaFin-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Fin
              </label>
              <input
                type="text"
                id="fechaFin-banana"
                value={formData.fechaFin ? formatDisplayDate(formData.fechaFin) : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Se usa el mismo día"
              />
              {errors.fechaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="horaInicio-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio *
              </label>
              <input
                type="time"
                id="horaInicio-banana"
                value={formData.horaInicio}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                disabled={!formData.fechaInicio}
                min={formData.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
                step={timeInputStepSeconds}
                className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  !formData.fechaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${
                  errors.horaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.horaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>}
            </div>

            <div>
              <label htmlFor="duracion-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración
              </label>
              <input
                type="text"
                id="duracion-banana"
                value={formData.duracion ? formatDurationLabel(formData.duracion) : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="20 minutos"
              />
              {errors.duracion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>}
            </div>

            <div>
              <label htmlFor="horaFin-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Fin
              </label>
              <input
                type="text"
                id="horaFin-banana"
                value={formData.horaFin || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Se calculará automáticamente"
              />
            </div>
          </div>

          <div className={`grid gap-6 ${showBananaQuantitySelector ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div>
              <label htmlFor="numeroPersonas-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personas *
              </label>
              <input
                type="number"
                id="numeroPersonas-banana"
                min="1"
                max={maxNumeroPersonas}
                value={formData.numeroPersonas}
                onChange={(e) => handleInputChange('numeroPersonas', Math.min(parseInt(e.target.value, 10) || 1, maxNumeroPersonas))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.numeroPersonas ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.numeroPersonas && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>}
              <p className="mt-1 text-xs text-on-surface-variant">
                Las personas afectan al precio total.
              </p>
            </div>

            {showBananaQuantitySelector ? (
              <div>
                <label htmlFor="cantidadReservada-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bananas reservadas *
                </label>
                <input
                  type="number"
                  id="cantidadReservada-banana"
                  min="1"
                  value={formData.cantidadReservada}
                  onChange={(e) => handleInputChange('cantidadReservada', parseInt(e.target.value, 10) || 1)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.cantidadReservada ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="1"
                />
                {errors.cantidadReservada && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidadReservada}</p>}
                <p className="mt-1 text-xs text-on-surface-variant">
                  La cantidad reservada solo afecta al material y a la disponibilidad.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Material reservado
                </label>
                <div className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                  1 banana reservada automáticamente
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  El pool actual solo tiene 1 banana y se reserva automáticamente como material.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="precio-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio Total (€)
              </label>
              <div className="relative">
              <input
                type="text"
                id="precio-banana"
                inputMode="decimal"
                value={priceInputValue}
                onChange={(e) => handlePriceInputChange(e.target.value)}
                onFocus={handlePriceInputFocus}
                onBlur={handlePriceInputBlur}
                disabled={!precioManualPendiente}
                className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } ${
                  precioManualPendiente
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                placeholder="0,00"
              />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                </div>
              </div>
              {precioManualPendiente ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Esta banana no tiene un precio automático válido y debe indicarse manualmente.
                </p>
              ) : (
                <p className="mt-1 text-xs text-on-surface-variant">
                  Precio calculado por persona{bananaBaseTariff ? ` (${formatSpanishNumber(Number(bananaBaseTariff.precio), { fixedDecimals: true })} € por persona)` : ''}.
                </p>
              )}
              {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="nota-banana" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota
            </label>
            <textarea
              id="nota-banana"
              rows={3}
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Notas adicionales sobre la reserva de banana..."
              style={{ height: '88px', minHeight: '88px', maxHeight: '88px' }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resumen</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-2xl bg-surface-container px-4 py-3">
                <p className="font-semibold text-on-surface">{formData.actividad || 'Banana pendiente'}</p>
                <p className="mt-1 text-on-surface-variant">{formData.empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Fecha</div>
                  <div className="mt-1 font-semibold text-on-surface">{formData.fechaInicio ? formatDisplayDate(formData.fechaInicio) : '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Horario</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.horaInicio && formData.horaFin ? `${formData.horaInicio} - ${formData.horaFin}` : '--'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Duración</div>
                  <div className="mt-1 font-semibold text-on-surface">{formData.duracion ? formatDurationLabel(formData.duracion) : '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Precio</div>
                  <div className="mt-1 font-semibold text-on-surface">{formatSpanishNumber(Number(formData.precio || 0), { fixedDecimals: true })} €</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Personas</div>
                  <div className="mt-1 font-semibold text-on-surface">{formData.numeroPersonas}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Material</div>
                  <div className="mt-1 font-semibold text-on-surface">{effectiveInventoryQuantity} banana{effectiveInventoryQuantity === 1 ? '' : 's'}</div>
                </div>
              </div>
              {bananaBaseTariff ? (
                <div className="rounded-2xl bg-surface-container px-4 py-3 text-on-surface-variant">
                  <div className="text-xs uppercase tracking-[0.14em]">Tarifa base</div>
                  <p className="mt-1 font-semibold text-on-surface">
                    {formatSpanishNumber(Number(bananaBaseTariff.precio), { fixedDecimals: true })} € por persona · {formatDurationLabel(buildTarifaDurationValue(bananaBaseTariff))}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {renderBananaAvailabilityCard()}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Atras
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingActividades}
            className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Continuar al pago
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const renderRentalStepOne = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 1/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Selecciona el alquiler</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary/25" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-black text-on-surface-variant">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="actividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Actividad *
        </label>
        <select
          id="actividad"
          value={formData.actividad}
          onChange={(e) => handleInputChange('actividad', e.target.value)}
          disabled={loadingActividades}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">
            {loadingActividades
              ? 'Cargando actividades...'
              : actividadesExistentes.length === 0
                ? 'No hay actividades de este tipo'
                : 'Selecciona una actividad'}
          </option>
          {actividadesExistentes.map((actividad) => (
            <option key={actividad.id} value={actividad.nombre}>
              {actividad.nombre}
            </option>
          ))}
        </select>
        {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
        {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Continuar
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderCourseStepOne = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 1/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Selecciona el curso</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary/25" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-black text-on-surface-variant">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="empresa-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa-curso"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad-curso"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="actividad-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Actividad *
        </label>
        <select
          id="actividad-curso"
          value={formData.actividad}
          onChange={(e) => handleInputChange('actividad', e.target.value)}
          disabled={loadingActividades}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">
            {loadingActividades
              ? 'Cargando actividades...'
              : actividadesExistentes.length === 0
                ? 'No hay actividades de este tipo'
                : 'Selecciona una actividad'}
          </option>
          {actividadesExistentes.map((actividad) => (
            <option key={actividad.id} value={actividad.nombre}>
              {actividad.nombre}
            </option>
          ))}
        </select>
        {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
        {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Continuar
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderRentalStepTwo = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 2/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Configura fecha, hora y disponibilidad</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-sm font-black text-primary">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={today}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
            </div>

            <div>
              <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio *
              </label>
              <input
                type="time"
                id="horaInicio"
                value={formData.horaInicio}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                disabled={!formData.fechaInicio}
                min={formData.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
                step={timeInputStepSeconds}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.horaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {errors.horaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="duracionAlquiler" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración *
              </label>
              <select
                id="duracionAlquiler"
                value={rentalDurationSelectValue}
                onChange={(e) => void handleRentalDurationSelection(e.target.value)}
                disabled={!formData.fechaInicio || !formData.horaInicio}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.duracion ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Selecciona una duración</option>
                {rentalDurationOptions.map((tarifa) => {
                  const durationValue = buildTarifaDurationValue(tarifa);
                  return (
                    <option key={tarifa.id} value={durationValue}>
                      {formatDurationLabel(durationValue)}
                    </option>
                  );
                })}
                <option value={CUSTOM_RENTAL_DURATION_OPTION}>Personalizado</option>
              </select>
              {isCustomRentalDuration ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="duracionAlquilerHoras" className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Horas
                    </label>
                    <input
                      type="number"
                      id="duracionAlquilerHoras"
                      min="0"
                      inputMode="numeric"
                      value={customRentalHours}
                      onChange={(e) => void handleCustomRentalDurationChange('hours', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="duracionAlquilerMinutos" className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Minutos
                    </label>
                    <input
                      type="number"
                      id="duracionAlquilerMinutos"
                      min="0"
                      max="59"
                      inputMode="numeric"
                      value={customRentalMinutes}
                      onChange={(e) => void handleCustomRentalDurationChange('minutes', e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="00"
                    />
                  </div>
                </div>
              ) : null}
              {isCustomRentalDuration ? (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Define una duración libre en horas y minutos. El sistema seguirá comprobando disponibilidad con ese tramo exacto.
                </p>
              ) : null}
              {errors.duracion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>}
            </div>

            <div>
              <label htmlFor="cantidadReservada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unid. Reservadas *
              </label>
              <input
                type="number"
                id="cantidadReservada"
                min="1"
                value={formData.cantidadReservada}
                onChange={(e) => handleInputChange('cantidadReservada', parseInt(e.target.value, 10) || 1)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.cantidadReservada ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.cantidadReservada && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidadReservada}</p>
              )}
            </div>

            <div>
              <label htmlFor="numeroPersonas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personas
              </label>
              <input
                type="number"
                id="numeroPersonas"
                min="1"
                max={maxNumeroPersonas}
                value={formData.numeroPersonas}
                onChange={(e) => handleInputChange('numeroPersonas', Math.min(parseInt(e.target.value, 10) || 1, maxNumeroPersonas))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.numeroPersonas ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.numeroPersonas && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>}
              {actividadSeleccionada?.numero_personas ? (
                <p className="mt-1 text-xs text-on-surface-variant">Máximo {actividadSeleccionada.numero_personas} personas para esta actividad.</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Finalización
              </label>
              <input
                type="text"
                id="fechaFin"
                value={formData.fechaFin ? formatDisplayDate(formData.fechaFin) : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Se calculará automáticamente"
              />
            </div>

            <div>
              <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Finalización
              </label>
              <input
                type="text"
                id="horaFin"
                value={formData.horaFin}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Se calculará automáticamente"
              />
            </div>
          </div>

          <div>
            <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Precio Total (€)
            </label>
            <div className="relative">
              <input
                type="text"
                id="precio"
                inputMode="decimal"
                value={priceInputValue}
                onChange={(e) => handlePriceInputChange(e.target.value)}
                onFocus={handlePriceInputFocus}
                onBlur={handlePriceInputBlur}
                disabled={!precioManualPendiente}
                className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } ${
                  precioManualPendiente
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                placeholder="0,00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
              </div>
            </div>
            {precioManualPendiente ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {isCustomRentalDuration
                  ? 'En modo personalizado puedes ajustar libremente el precio total de la reserva.'
                  : 'Introduce el precio total manualmente porque la tarifa seleccionada sigue marcada como manual.'}
              </p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">
                Precio automático según la tarifa seleccionada y las unidades reservadas.
              </p>
            )}
            {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
          </div>

          <div>
            <label htmlFor="nota" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota
            </label>
            <textarea
              id="nota"
              rows={3}
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Notas adicionales sobre la reserva..."
              style={{ height: '88px', minHeight: '88px', maxHeight: '88px' }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resumen</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-2xl bg-surface-container px-4 py-3">
                <p className="font-semibold text-on-surface">{formData.actividad || 'Actividad pendiente'}</p>
                <p className="mt-1 text-on-surface-variant">{formData.empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Inicio</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaInicio ? formatDisplayDate(formData.fechaInicio) : '--'}
                  </div>
                  <div>{formData.horaInicio || '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Fin</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaFin ? formatDisplayDate(formData.fechaFin) : '--'}
                  </div>
                  <div>{formData.horaFin || '--'}</div>
                </div>
              </div>
            </div>
          </div>

          {renderRentalAvailabilityCard()}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Atras
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingActividades || rentalAvailability.status === 'checking'}
            className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Continuar al pago
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const renderCourseStepTwo = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 2/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Configura fecha, horario y plazas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-sm font-black text-primary">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              {tarifasActividad.length >= 1 ? (
                <>
                  <label htmlFor="duracion-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duración *
                  </label>
                  <select
                    id="duracion-curso"
                    value={formData.duracion || ''}
                    onChange={(e) => handleInputChange('duracion', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer ${
                      errors.duracion ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  >
                    <option value="">Selecciona una duración</option>
                    {tarifasActividad.map((tarifa) => {
                      const durationValue = buildTarifaDurationValue(tarifa);
                      return (
                        <option key={tarifa.id} value={durationValue}>
                          {getTarifaNombreLabel(tarifa)} · {formatDurationLabel(durationValue)} · {formatSpanishNumber(Number(tarifa.precio), { fixedDecimals: true })}€
                        </option>
                      );
                    })}
                  </select>
                  {errors.duracion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>}
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duración *</label>
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                    Selecciona una actividad
                  </div>
                </>
              )}
            </div>

            <div>
              <label htmlFor="precio-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio Total (€)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="precio-curso"
                  inputMode="decimal"
                  value={priceInputValue}
                  onChange={(e) => handlePriceInputChange(e.target.value)}
                  onFocus={handlePriceInputFocus}
                  onBlur={handlePriceInputBlur}
                  disabled={!precioManualPendiente}
                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } ${
                    precioManualPendiente
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="0,00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                </div>
              </div>
              {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
            </div>
          </div>

          {isCourseMultiRangeTariff ? (
            <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Curso multi-tramo</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {isCoursePendingAssignmentMode
                      ? 'Esta tarifa quedará vendida sin horarios asignados. Las horas se repartirán después desde la bandeja de pendientes.'
                      : 'Esta tarifa permite repartir sus horas en varios rangos. Configura los tramos desde el bloque de disponibilidad.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm md:min-w-[260px]">
                  <div className="rounded-2xl bg-surface-container px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">{isCoursePendingAssignmentMode ? 'Estado' : 'Primer tramo'}</div>
                    <div className="mt-1 font-semibold text-on-surface">
                      {isCoursePendingAssignmentMode
                        ? 'Pendiente de asignar'
                        : courseRangeAggregate ? `${formatDisplayDate(courseRangeAggregate.fechaInicio)} · ${courseRangeAggregate.horaInicio}` : '--'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-surface-container px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">{isCoursePendingAssignmentMode ? 'Horas pendientes' : 'Último tramo'}</div>
                    <div className="mt-1 font-semibold text-on-surface">
                      {isCoursePendingAssignmentMode
                        ? formatMinutesSummary(courseDurationSelectedMin ?? 0)
                        : courseRangeAggregate ? `${formatDisplayDate(courseRangeAggregate.fechaFin)} · ${courseRangeAggregate.horaFin}` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="fechaInicio-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    id="fechaInicio-curso"
                    value={formData.fechaInicio}
                    onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                    min={today}
                    className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
                </div>

                <div>
                  <label htmlFor="fechaFin-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Fin
                  </label>
                  <input
                    type="text"
                    id="fechaFin-curso"
                    value={formData.fechaFin ? formatDisplayDate(formData.fechaFin) : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    placeholder="Se calculará automáticamente"
                  />
                  {errors.fechaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="horaInicio-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    id="horaInicio-curso"
                    value={formData.horaInicio}
                    onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                    disabled={!formData.fechaInicio}
                    min={formData.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
                    step={timeInputStepSeconds}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      !formData.fechaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${
                      errors.horaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                  {errors.horaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>}
                </div>

                <div>
                  <label htmlFor="horaFin-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Fin
                  </label>
                  <input
                    type="text"
                    id="horaFin-curso"
                    value={formData.horaFin || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    placeholder="09:00"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="numeroPersonas-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Personas *
              </label>
              <input
                type="number"
                id="numeroPersonas-curso"
                min="1"
                max={maxNumeroPersonas}
                value={formData.numeroPersonas}
                onChange={(e) => handleInputChange('numeroPersonas', Math.min(parseInt(e.target.value, 10) || 1, maxNumeroPersonas))}
                className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.numeroPersonas ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.numeroPersonas && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>}
              {actividadSeleccionada?.numero_personas ? (
                <p className="mt-1 text-xs text-on-surface-variant">Máximo {actividadSeleccionada.numero_personas} personas para esta actividad.</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="nota-curso" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota
            </label>
            <textarea
              id="nota-curso"
              rows={3}
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Notas adicionales sobre la reserva..."
              style={{ height: '80px', minHeight: '80px', maxHeight: '80px' }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resumen</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-2xl bg-surface-container px-4 py-3">
                <p className="font-semibold text-on-surface">{formData.actividad || 'Actividad pendiente'}</p>
                <p className="mt-1 text-on-surface-variant">{formData.empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Inicio</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaInicio ? formatDisplayDate(formData.fechaInicio) : '--'}
                  </div>
                  <div>{formData.horaInicio || '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Fin</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaFin ? formatDisplayDate(formData.fechaFin) : '--'}
                  </div>
                  <div>{formData.horaFin || '--'}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container px-4 py-3 text-on-surface-variant">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]">Duración</div>
                    <div className="mt-1 font-semibold text-on-surface">{formData.duracion ? formatDurationLabel(formData.duracion) : '--'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]">Precio</div>
                    <div className="mt-1 font-semibold text-on-surface">{formatSpanishNumber(Number(formData.precio || 0), { fixedDecimals: true })} €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderCourseAvailabilityCard()}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Atras
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingActividades}
            className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Continuar al pago
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const renderCampStepOne = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 1/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Selecciona el campamento</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary/25" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-black text-on-surface-variant">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="empresa-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa-camp"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad-camp"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="actividad-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Actividad *
        </label>
        <select
          id="actividad-camp"
          value={formData.actividad}
          onChange={(e) => handleInputChange('actividad', e.target.value)}
          disabled={loadingActividades}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">
            {loadingActividades
              ? 'Cargando actividades...'
              : actividadesExistentes.length === 0
                ? 'No hay actividades de este tipo'
                : 'Selecciona una actividad'}
          </option>
          {actividadesExistentes.map((actividad) => (
            <option key={actividad.id} value={actividad.nombre}>
              {actividad.nombre}
            </option>
          ))}
        </select>
        {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
        {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Continuar
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderCampStepTwo = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 2/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Configura rango, turno y notas del programa</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-sm font-black text-primary">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fechaInicio-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio-camp"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={today}
                className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
            </div>

            <div>
              <label htmlFor="fechaFin-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Fin *
              </label>
              <input
                type="date"
                id="fechaFin-camp"
                value={formData.fechaFin}
                onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                min={formData.fechaInicio || today}
                className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.fechaFin ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.fechaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              {campTurnoOptions.length > 1 ? (
                <>
                  <label htmlFor="turno-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Turno *
                  </label>
                  <select
                    id="turno-camp"
                    value={campTurnoSeleccionado}
                    onChange={(e) => handleCampTurnoChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer ${
                      errors.campTurno ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  >
                    <option value="">Selecciona un turno</option>
                    {campTurnoOptions.map((turno) => (
                      <option key={turno.key} value={turno.key}>
                        {turno.label}
                      </option>
                    ))}
                  </select>
                  {errors.campTurno && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.campTurno}</p>}
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Horario</label>
                  <div className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                    {campTurnoOptions[0]?.label ?? 'Sin horario configurado'}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resumen horario
              </label>
              <div className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                {campHorarioResumen || 'Selecciona un turno válido'}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="nota-camp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota
            </label>
            <textarea
              id="nota-camp"
              rows={4}
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Notas del programa de campamento..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resumen</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-2xl bg-surface-container px-4 py-3">
                <p className="font-semibold text-on-surface">{formData.actividad || 'Campamento pendiente'}</p>
                <p className="mt-1 text-on-surface-variant">{formData.empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Rango</div>
                  <div className="mt-1 font-semibold text-on-surface">{campRangoResumen || '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Horario</div>
                  <div className="mt-1 font-semibold text-on-surface">{campHorarioResumen || '--'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Sesiones</div>
                  <div className="mt-1 font-semibold text-on-surface">{campOccurrences.length}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Flujo</div>
                  <div className="mt-1 font-semibold text-on-surface">Programa base</div>
                </div>
              </div>
              {campFirstOccurrence && campLastOccurrence ? (
                <div className="rounded-2xl bg-surface-container px-4 py-3 text-on-surface-variant">
                  <div className="text-xs uppercase tracking-[0.14em]">Sesiones generadas</div>
                  <p className="mt-1 font-semibold text-on-surface">
                    Primera: {formatDateInputForDisplay(campFirstOccurrence.date)} · {campFirstOccurrence.horaInicio}
                  </p>
                  <p className="mt-1 font-semibold text-on-surface">
                    Última: {formatDateInputForDisplay(campLastOccurrence.date)} · {campLastOccurrence.horaFin}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Calendario previsto</p>
            {campOccurrences.length === 0 ? (
              <p className="mt-3 text-sm text-on-surface-variant">
                Selecciona rango y turno para generar las sesiones del campamento.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {campOccurrences.slice(0, 6).map((occurrence) => (
                  <div key={`${occurrence.date}-${occurrence.horaInicio}`} className="rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface">
                    {formatDateInputForDisplay(occurrence.date)} · {occurrence.horaInicio} - {occurrence.horaFin}
                  </div>
                ))}
                {campOccurrences.length > 6 ? (
                  <p className="text-sm font-semibold text-primary">+{campOccurrences.length - 6} sesiones más</p>
                ) : null}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary-dark">
              Este paso crea el programa principal. Las familias y pagos se añadirán después desde el detalle del programa.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Atras
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingActividades}
            className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Crear programa
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const renderRouteStepOne = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 1/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Selecciona la ruta</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary/25" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-black text-on-surface-variant">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="empresa-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa-ruta"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`activities-date-input w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad-ruta"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="actividad-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Actividad *
        </label>
        <select
          id="actividad-ruta"
          value={formData.actividad}
          onChange={(e) => handleInputChange('actividad', e.target.value)}
          disabled={loadingActividades}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">
            {loadingActividades
              ? 'Cargando actividades...'
              : actividadesExistentes.length === 0
                ? 'No hay actividades de este tipo'
                : 'Selecciona una actividad'}
          </option>
          {actividadesExistentes.map((actividad) => (
            <option key={actividad.id} value={actividad.nombre}>
              {actividad.nombre}
            </option>
          ))}
        </select>
        {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
        {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          Continuar
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </button>
      </div>
    </>
  );

  const renderRouteStepTwo = () => (
    <>
      <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Paso 2/2</p>
            <p className="mt-1 text-lg font-black text-on-surface">Configura horario, material y precio</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/25 text-sm font-black text-primary">1</div>
            <div className="h-1.5 w-10 rounded-full bg-primary" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">2</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fechaInicio-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="fechaInicio-ruta"
                value={formData.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                min={today}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
            </div>

            <div>
              <label htmlFor="fechaFin-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Fin
              </label>
              <input
                type="text"
                id="fechaFin-ruta"
                value={formData.fechaFin ? formatDisplayDate(formData.fechaFin) : ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                placeholder="Se usa el mismo día"
              />
              {errors.fechaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="horaInicio-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Inicio *
              </label>
              <input
                type="time"
                id="horaInicio-ruta"
                value={formData.horaInicio}
                onChange={(e) => handleInputChange('horaInicio', e.target.value)}
                disabled={!formData.fechaInicio}
                min={formData.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
                step={timeInputStepSeconds}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  !formData.fechaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${
                  errors.horaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.horaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>}
            </div>

            <div>
              <label htmlFor="horaFin-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Fin {routeHasFixedDuration ? '(automática)' : '*'}
              </label>
              <input
                type="time"
                id="horaFin-ruta"
                value={formData.horaFin}
                onChange={(e) => handleInputChange('horaFin', e.target.value)}
                disabled={routeHasFixedDuration || !formData.fechaInicio || !formData.horaInicio}
                step={timeInputStepSeconds}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  routeHasFixedDuration || !formData.fechaInicio || !formData.horaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${
                  errors.horaFin ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {routeHasFixedDuration && (
                <p className="mt-1 text-xs text-on-surface-variant">
                  Hora de fin calculada automáticamente por la tarifa seleccionada.
                </p>
              )}
              {errors.horaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="cantidadReservada-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Uni. reservadas *
              </label>
              <input
                type="number"
                id="cantidadReservada-ruta"
                min="1"
                value={formData.cantidadReservada}
                onChange={(e) => handleInputChange('cantidadReservada', parseInt(e.target.value, 10) || 1)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.cantidadReservada ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.cantidadReservada && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidadReservada}</p>}
            </div>

            <div>
              <label htmlFor="numeroPersonas-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personas *
              </label>
              <input
                type="number"
                id="numeroPersonas-ruta"
                min="1"
                value={formData.numeroPersonas}
                onChange={(e) => handleInputChange('numeroPersonas', parseInt(e.target.value, 10) || 1)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.numeroPersonas ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="1"
              />
              {errors.numeroPersonas && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>}
            </div>

            <div>
              <label htmlFor="precio-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio Total (€)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="precio-ruta"
                  inputMode="decimal"
                  value={priceInputValue}
                  onChange={(e) => handlePriceInputChange(e.target.value)}
                  onFocus={handlePriceInputFocus}
                  onBlur={handlePriceInputBlur}
                  disabled={!precioManualPendiente}
                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } ${
                    precioManualPendiente
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="0,00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                </div>
              </div>
              {precioManualPendiente && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Esta ruta no tiene tarifa predefinida y el precio debe indicarse manualmente.</p>}
              {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="nota-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota
            </label>
            <textarea
              id="nota-ruta"
              rows={3}
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              placeholder="Notas adicionales sobre la reserva..."
              style={{ height: '80px', minHeight: '80px', maxHeight: '80px' }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-outline-variant/35 bg-surface-container-low p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Resumen</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-2xl bg-surface-container px-4 py-3">
                <p className="font-semibold text-on-surface">{formData.actividad || 'Actividad pendiente'}</p>
                <p className="mt-1 text-on-surface-variant">{formData.empresa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-on-surface-variant">
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Inicio</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaInicio ? formatDisplayDate(formData.fechaInicio) : '--'}
                  </div>
                  <div>{formData.horaInicio || '--'}</div>
                </div>
                <div className="rounded-2xl bg-surface-container px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.14em]">Fin</div>
                  <div className="mt-1 font-semibold text-on-surface">
                    {formData.fechaFin ? formatDisplayDate(formData.fechaFin) : '--'}
                  </div>
                  <div>{formData.horaFin || '--'}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container px-4 py-3 text-on-surface-variant">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]">{routeMaterialLabels.pluralDisplay}</div>
                    <div className="mt-1 font-semibold text-on-surface">{formData.cantidadReservada || '--'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em]">Personas</div>
                    <div className="mt-1 font-semibold text-on-surface">{formData.numeroPersonas || '--'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {renderRouteAvailabilityCard()}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" />
          Atras
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loadingActividades || consultandoStock}
            className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            Continuar al pago
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  const renderStandardContent = () => (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Empresa *
          </label>
          <select
            id="empresa"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value as 'Flecha Extreme' | 'Rober')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.empresa ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="Flecha Extreme">Flecha Extreme</option>
            <option value="Rober">Rober</option>
          </select>
          {errors.empresa && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.empresa}</p>}
        </div>

        <div>
          <label htmlFor="tipoActividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Actividad *
          </label>
          <select
            id="tipoActividad"
            value={formData.tipoActividad}
            onChange={(e) => handleInputChange('tipoActividad', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.tipoActividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
          >
            <option value="alquiler">Alquiler</option>
            <option value="curso">Curso</option>
            <option value="ruta">Ruta</option>
            <option value="campamento">Campamento</option>
            <option value="sport">Sport</option>
          </select>
          {errors.tipoActividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipoActividad}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          {tarifasActividad.length >= 1 ? (
            <>
              <label htmlFor="duracion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración *
              </label>
              <select
                id="duracion"
                value={formData.duracion || ''}
                onChange={(e) => handleInputChange('duracion', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer ${
                  errors.duracion ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              >
                <option value="">Selecciona una duración</option>
                {tarifasActividad.map((tarifa) => {
                  const durationValue = buildTarifaDurationValue(tarifa);
                  return (
                    <option key={tarifa.id} value={durationValue}>
                      {formatDurationLabel(durationValue)}
                    </option>
                  );
                })}
              </select>
              {errors.duracion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>}
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duración *</label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                Seleccione una actividad
              </div>
            </>
          )}
        </div>

        <div>
          <label htmlFor="actividad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Actividad *
          </label>
          <select
            id="actividad"
            value={formData.actividad}
            onChange={(e) => handleInputChange('actividad', e.target.value)}
            disabled={loadingActividades}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.actividad ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">
              {loadingActividades
                ? 'Cargando actividades...'
                : actividadesExistentes.length === 0
                  ? 'No hay actividades de este tipo'
                  : 'Selecciona una actividad'}
            </option>
            {actividadesExistentes.map((actividad) => (
              <option key={actividad.id} value={actividad.nombre}>
                {actividad.nombre}
              </option>
            ))}
          </select>
          {errors.actividad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actividad}</p>}
          {errorActividades && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Error al cargar actividades: {errorActividades}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Inicio *
          </label>
          <input
            type="date"
            id="fechaInicio"
            value={formData.fechaInicio}
            onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
            min={today}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.fechaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          />
          {errors.fechaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p>}
        </div>

        <div>
          <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha de Fin
          </label>
          <input
            type="text"
            id="fechaFin"
            value={formData.fechaFin ? formatDisplayDate(formData.fechaFin) : ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            placeholder="Se calculará automáticamente"
          />
          {errors.fechaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hora de Inicio *
          </label>
          <input
            type="time"
            id="horaInicio"
            value={formData.horaInicio}
            onChange={(e) => handleInputChange('horaInicio', e.target.value)}
            disabled={!formData.fechaInicio}
            min={formData.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
            step={timeInputStepSeconds}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              !formData.fechaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${
              errors.horaInicio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {errors.horaInicio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaInicio}</p>}
        </div>

        <div>
          <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hora de Fin
          </label>
          <input
            type="text"
            id="horaFin"
            value={formData.horaFin || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            placeholder="09:00"
          />
        </div>
      </div>

      <div className={`grid gap-6 ${usesPerPersonPricing ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {!usesPerPersonPricing && (
          <div>
            <label htmlFor="cantidadReservada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Uni. Reservadas *
            </label>
            <input
              type="number"
              id="cantidadReservada"
              min="1"
              value={formData.cantidadReservada}
              onChange={(e) => handleInputChange('cantidadReservada', parseInt(e.target.value, 10) || 1)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.cantidadReservada ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              placeholder="1"
            />
            {errors.cantidadReservada && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidadReservada}</p>}
            {stockInfo && (
              <div className={`mt-2 p-2 rounded-md ${
                stockInfo.stockDisponible > 0
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className={`text-xs ${
                  stockInfo.stockDisponible > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex justify-between">
                    <span>Stock disponible:</span>
                    <span className="font-medium">{stockInfo.stockDisponible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{stockInfo.stockTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reservadas:</span>
                    <span>{stockInfo.reservadas}</span>
                  </div>
                </div>
              </div>
            )}
            {consultandoStock && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Consultando stock disponible...</div>}
          </div>
        )}

        <div>
          <label htmlFor="numeroPersonas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Personas *
          </label>
          <input
            type="number"
            id="numeroPersonas"
            min="1"
            max={maxNumeroPersonas}
            value={formData.numeroPersonas}
            onChange={(e) => handleInputChange('numeroPersonas', Math.min(parseInt(e.target.value, 10) || 1, maxNumeroPersonas))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.numeroPersonas ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            placeholder="1"
          />
          {errors.numeroPersonas && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p>}
          {actividadSeleccionada?.numero_personas ? (
            <p className="mt-1 text-xs text-on-surface-variant">Máximo {actividadSeleccionada.numero_personas} personas para esta actividad.</p>
          ) : null}
          {usesPerPersonPricing && stockInfo && (
            <div className={`mt-2 p-2 rounded-md ${
              stockInfo.stockDisponible > 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className={`text-xs ${
                stockInfo.stockDisponible > 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                <div className="flex justify-between">
                  <span>Plazas disponibles:</span>
                  <span className="font-medium">{stockInfo.stockDisponible}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{stockInfo.stockTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reservadas:</span>
                  <span>{stockInfo.reservadas}</span>
                </div>
              </div>
            </div>
          )}
          {usesPerPersonPricing && consultandoStock && <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Consultando plazas disponibles...</div>}
        </div>

        <div>
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Precio Total (€)
          </label>
          <div className="relative">
            <input
              type="text"
              id="precio"
              inputMode="decimal"
              value={priceInputValue}
              onChange={(e) => handlePriceInputChange(e.target.value)}
              onFocus={handlePriceInputFocus}
              onBlur={handlePriceInputBlur}
              disabled={!precioManualPendiente}
              className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } ${
                precioManualPendiente
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              placeholder="0,00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
            </div>
          </div>
          {precioManualPendiente && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {isRental
                ? 'La duración está preconfigurada a 1 hora, pero el precio sigue pendiente y debe indicarse manualmente.'
                : 'Esta tarifa no tiene precio predefinido y debe indicarse manualmente.'}
            </p>
          )}
          {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="nota" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nota
        </label>
        <textarea
          id="nota"
          rows={3}
          value={formData.nota}
          onChange={(e) => handleInputChange('nota', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
          placeholder="Notas adicionales sobre la reserva..."
          style={{ height: '80px', minHeight: '80px', maxHeight: '80px' }}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2 pb-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loadingActividades}
          className="primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loadingActividades ? 'Creando...' : 'Crear Reserva'}
        </button>
      </div>
    </>
  );

  if (campamentoProgramaContext) {
    return (
      <ModalNuevaReservaCampamentoInscripcion
        isOpen={isOpen}
        programa={campamentoProgramaContext}
        onClose={handleCloseCampamentoInscripcion}
        onSubmit={onSubmit}
        onToast={onToast}
      />
    );
  }

  if (closingCampamentoFlow) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="actividades-v2-modal w-full max-w-5xl max-h-[90vh] transform overflow-y-auto rounded-2xl border border-outline-variant/35 bg-surface-container-lowest text-left align-middle shadow-xl transition-all">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <Dialog.Title as="h3" className="font-headline text-2xl font-extrabold leading-6 tracking-tight text-white">
                    Nueva Actividad
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 cursor-pointer"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit} className="actividades-v2-modal-form space-y-6">
                    {isRental
                      ? (currentStep === 1 ? renderRentalStepOne() : renderRentalStepTwo())
                      : isCourse
                        ? (currentStep === 1 ? renderCourseStepOne() : renderCourseStepTwo())
                        : isCamp
                          ? (currentStep === 1 ? renderCampStepOne() : renderCampStepTwo())
                        : isSport
                          ? (currentStep === 1 ? renderBananaStepOne() : isBanana ? renderBananaStepTwo() : renderStandardContent())
                        : isRoute
                          ? (currentStep === 1 ? renderRouteStepOne() : renderRouteStepTwo())
                        : renderStandardContent()}
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      <Transition appear show={showCourseRangesModal} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={() => setShowCourseRangesModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl">
                  <div className="primary-gradient rounded-t-2xl flex items-center justify-between px-6 py-4 text-white">
                    <div>
                      <Dialog.Title className="font-headline text-2xl font-extrabold tracking-tight">Configurar rangos del curso</Dialog.Title>
                      <p className="mt-1 text-sm text-white/85">
                        Reparte {formData.duracion ? formatDurationLabel(formData.duracion) : 'la duración del curso'} en los tramos que necesites.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer rounded-md text-white hover:text-gray-200"
                      onClick={() => setShowCourseRangesModal(false)}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">Objetivo</div>
                        <div className="mt-1 font-semibold text-on-surface">{formData.duracion ? formatDurationLabel(formData.duracion) : '--'}</div>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">Asignadas</div>
                        <div className="mt-1 font-semibold text-on-surface">
                          {formatMinutesSummary(courseRangeEditor.reduce((total, range) => total + calculateCourseRangeDuration(range), 0))}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-surface-container-low px-4 py-3">
                        <div className="text-xs uppercase tracking-[0.14em] text-on-surface-variant">Cantidad</div>
                        <div className="mt-1 font-semibold text-on-surface">{effectiveInventoryQuantity}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {courseRangeEditor.map((range, index) => (
                        <div key={range.id} className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-on-surface">Tramo {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeCourseRangeEditorRow(range.id)}
                              disabled={courseRangeEditor.length === 1}
                              className="cursor-pointer rounded-full border border-outline-variant/35 px-3 py-1 text-xs font-semibold text-on-surface-variant transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Eliminar
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
                              <input
                                type="date"
                                value={range.fechaInicio}
                                min={today}
                                onChange={(e) => updateCourseRangeEditorField(range.id, 'fechaInicio', e.target.value)}
                                className="activities-date-input w-full px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora inicio</label>
                              <input
                                type="time"
                                value={range.horaInicio}
                                step={timeInputStepSeconds}
                                min={range.fechaInicio === today ? getCurrentTimeInputValue() : undefined}
                                onChange={(e) => updateCourseRangeEditorField(range.id, 'horaInicio', e.target.value)}
                                className="w-full px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora fin</label>
                              <input
                                type="time"
                                value={range.horaFin}
                                step={timeInputStepSeconds}
                                onChange={(e) => updateCourseRangeEditorField(range.id, 'horaFin', e.target.value)}
                                className="w-full px-3 py-2"
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                            <span className="text-on-surface-variant">
                              Duración: {formatDurationLabel(buildDurationValue(calculateCourseRangeDuration(range), 'minuto'))}
                            </span>
                            {courseRangeErrors[range.id] ? (
                              <span className="text-red-600 dark:text-red-400">{courseRangeErrors[range.id]}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>

                    {courseRangeErrors.__summary ? (
                      <p className="text-sm text-red-600 dark:text-red-400">{courseRangeErrors.__summary}</p>
                    ) : null}

                    <div className="flex flex-wrap justify-between gap-3">
                      <button
                        type="button"
                        onClick={addCourseRangeEditorRow}
                        className="cursor-pointer rounded-full border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:border-primary/25 hover:text-primary"
                      >
                        Añadir tramo
                      </button>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCourseRangesModal(false)}
                          className="cursor-pointer rounded-full border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={validateAndSaveCourseRanges}
                          disabled={isValidatingCourseRanges}
                          className="primary-gradient cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isValidatingCourseRanges ? 'Validando...' : 'Guardar tramos'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <PagoReservaModal
        isOpen={showModalPago}
        onClose={handlePagoModalClose}
        onSubmit={handlePagoSubmit}
        actividad={generarDatosActividad()}
      />

      <style jsx global>{`
        .actividades-v2-modal-form label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--outline);
        }

        .actividades-v2-modal-form input[type='text'],
        .actividades-v2-modal-form input[type='number'],
        .actividades-v2-modal-form input[type='date'],
        .actividades-v2-modal-form input[type='time'],
        .actividades-v2-modal-form select,
        .actividades-v2-modal-form textarea {
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--outline-variant) 60%, transparent);
          background: var(--surface-container-lowest);
          color: var(--on-surface);
          box-shadow: 0 1px 0 rgba(0, 25, 71, 0.05);
        }

        .actividades-v2-modal-form input[type='text']:focus,
        .actividades-v2-modal-form input[type='number']:focus,
        .actividades-v2-modal-form input[type='date']:focus,
        .actividades-v2-modal-form input[type='time']:focus,
        .actividades-v2-modal-form select:focus,
        .actividades-v2-modal-form textarea:focus {
          border-color: color-mix(in srgb, var(--primary) 45%, white);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
          outline: none;
        }
      `}</style>
    </Transition>
  );
}
