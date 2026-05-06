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
import PagoReservaModal from './PagoReservaModal';

interface ModalNuevaReservaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    empresa: 'Flecha Extreme' | 'Rober';
    tipoActividad: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
    actividad: string;
    cantidadReservada: number;
    numeroPersonas: number;
    precio: number;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    nota?: string;
  }) => void;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

type WizardStep = 1 | 2;
type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

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

const EMPTY_RENTAL_AVAILABILITY: RentalAvailabilityState = {
  status: 'idle'
};

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

function buildRentalDurationValue(hours: number) {
  return `${hours}-hora`;
}

function parseRentalHours(value: string) {
  const [rawHours, rawUnit] = value.split('-');
  const hours = Number(rawHours);
  if (!Number.isFinite(hours) || hours <= 0 || rawUnit !== 'hora') {
    return null;
  }

  return hours;
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

  const [duracionValor, duracionUnidad] = duracion.split('-');
  const valor = parseInt(duracionValor, 10);
  const minutosInicio = minutesFromTime(horaInicio);
  if (!minutosInicio && minutosInicio !== 0) return '';

  let duracionMinutos = 0;
  if (duracionUnidad === 'hora' || duracionUnidad === 'horas') {
    duracionMinutos = valor * 60;
  } else if (duracionUnidad === 'minuto' || duracionUnidad === 'minutos') {
    duracionMinutos = valor;
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

function calculateRentalRange(fechaInicio: string, horaInicio: string, horas: number) {
  if (!fechaInicio || !horaInicio || !Number.isFinite(horas) || horas <= 0) {
    return null;
  }

  const minutosInicio = minutesFromTime(horaInicio);
  if (minutosInicio === null) {
    return null;
  }

  const duracionMin = horas * 60;
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

function formatDurationLabel(value: string) {
  if (!value) return '';

  const [rawAmount, rawUnit] = value.split('-');
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return value;
  }

  if (rawUnit === 'minuto' || rawUnit === 'minutos') {
    if (amount < 60) {
      return `${amount} ${amount === 1 ? 'minuto' : 'minutos'}`;
    }

    const hours = Math.floor(amount / 60);
    const minutes = amount % 60;
    if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    return `${hours} ${hours === 1 ? 'hora' : 'horas'} y ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }

  if (rawUnit === 'hora' || rawUnit === 'horas') {
    return `${amount} ${amount === 1 ? 'hora' : 'horas'}`;
  }

  if (rawUnit === 'dia' || rawUnit === 'dias') {
    return `${amount} ${amount === 1 ? 'día' : 'días'}`;
  }

  if (rawUnit === 'semana' || rawUnit === 'semanas') {
    return `${amount} ${amount === 1 ? 'semana' : 'semanas'}`;
  }

  if (rawUnit === 'mes' || rawUnit === 'meses') {
    return `${amount} ${amount === 1 ? 'mes' : 'meses'}`;
  }

  if (rawUnit === 'año' || rawUnit === 'años') {
    return `${amount} ${amount === 1 ? 'año' : 'años'}`;
  }

  return value;
}

function getHourlyBaseTariff(tarifas: TarifaActividad[]) {
  return tarifas.find((tarifa) => tarifa.duracion_valor === 1 && tarifa.duracion_unidad === 'hora') ?? null;
}

export default function ModalNuevaReserva({
  isOpen,
  onClose,
  onSubmit,
  onToast
}: ModalNuevaReservaProps) {
  const {
    obtenerActividadesPorTipo,
    obtenerTarifasActividad,
    consultarStockDisponible,
    buscarSiguienteDisponibilidadServicio,
    loadingActividades,
    error: errorActividades
  } = useActividades();

  const [formData, setFormData] = useState({
    empresa: 'Flecha Extreme' as 'Flecha Extreme' | 'Rober',
    tipoActividad: 'alquiler' as 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros',
    actividad: '',
    duracion: '',
    cantidadReservada: 1,
    numeroPersonas: 1,
    precio: 0,
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    nota: ''
  });
  const [actividadesExistentes, setActividadesExistentes] = useState<ActividadDB[]>([]);
  const [tipoCargado, setTipoCargado] = useState('');
  const [tarifasActividad, setTarifasActividad] = useState<TarifaActividad[]>([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadDB | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModalPago, setShowModalPago] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [stockInfo, setStockInfo] = useState<{
    stockDisponible: number;
    stockTotal: number;
    reservadas: number;
  } | null>(null);
  const [consultandoStock, setConsultandoStock] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [rentalAvailability, setRentalAvailability] = useState<RentalAvailabilityState>(EMPTY_RENTAL_AVAILABILITY);

  const isRental = formData.tipoActividad === 'alquiler';
  const isCourse = formData.tipoActividad === 'curso';
  const isRoute = formData.tipoActividad === 'ruta';
  const today = getTodayInputValue();

  const tarifaSeleccionada = useMemo(() => {
    if (!formData.duracion) return null;

    return tarifasActividad.find(
      (tarifa) => `${tarifa.duracion_valor}-${tarifa.duracion_unidad}` === formData.duracion
    ) ?? null;
  }, [formData.duracion, tarifasActividad]);

  const hourlyBaseTariff = useMemo(() => getHourlyBaseTariff(tarifasActividad), [tarifasActividad]);
  const rentalHoursSelected = useMemo(
    () => (isRental ? parseRentalHours(formData.duracion) : null),
    [formData.duracion, isRental]
  );
  const usesPerPersonPricing = useMemo(
    () => !isRental && (actividadSeleccionada?.modo_precio === 'por_persona' || isCourse),
    [actividadSeleccionada, isCourse, isRental]
  );
  const effectiveReservedQuantity = useMemo(
    () => (usesPerPersonPricing ? formData.numeroPersonas : formData.cantidadReservada),
    [formData.cantidadReservada, formData.numeroPersonas, usesPerPersonPricing]
  );
  const effectiveInventoryQuantity = useMemo(() => {
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
  }, [actividadSeleccionada, effectiveReservedQuantity, formData.cantidadReservada, formData.numeroPersonas, usesPerPersonPricing]);
  const maxNumeroPersonas = useMemo(() => {
    if (actividadSeleccionada?.numero_personas && actividadSeleccionada.numero_personas > 0) {
      return actividadSeleccionada.numero_personas;
    }

    return 15;
  }, [actividadSeleccionada]);
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
      if (!hourlyBaseTariff) return true;
      return hourlyBaseTariff.precio === 0 || hourlyBaseTariff.metadata?.precio_manual === true;
    }

    if (!tarifaSeleccionada && tarifasActividad.length === 0) {
      return true;
    }

    if (!tarifaSeleccionada) return false;

    return tarifaSeleccionada.precio === 0 && tarifaSeleccionada.metadata?.precio_manual === true;
  }, [hourlyBaseTariff, isRental, tarifaSeleccionada, tarifasActividad.length]);

  const rentalDurationOptions = useMemo(() => {
    if (!isRental) return [];

    const minutosInicio = minutesFromTime(formData.horaInicio);
    if (minutosInicio === null) {
      const minHours = actividadSeleccionada?.duracion_minima_min
        ? Math.max(1, Math.ceil(actividadSeleccionada.duracion_minima_min / 60))
        : 1;
      const maxHours = actividadSeleccionada?.duracion_maxima_min
        ? Math.max(minHours, Math.floor(actividadSeleccionada.duracion_maxima_min / 60))
        : 12;
      return Array.from({ length: Math.max(maxHours - minHours + 1, 0) }, (_, index) => minHours + index);
    }

    const maxHoursSameDay = Math.floor((1439 - minutosInicio) / 60);
    if (maxHoursSameDay <= 0) {
      return [];
    }

    const minHours = actividadSeleccionada?.duracion_minima_min
      ? Math.max(1, Math.ceil(actividadSeleccionada.duracion_minima_min / 60))
      : 1;
    const configuredMaxHours = actividadSeleccionada?.duracion_maxima_min
      ? Math.max(minHours, Math.floor(actividadSeleccionada.duracion_maxima_min / 60))
      : maxHoursSameDay;
    const maxHours = Math.min(maxHoursSameDay, configuredMaxHours);

    if (maxHours < minHours) {
      return [];
    }

    return Array.from({ length: maxHours - minHours + 1 }, (_, index) => minHours + index);
  }, [actividadSeleccionada, formData.horaInicio, isRental]);

  const resetModalState = () => {
    setFormData({
      empresa: 'Flecha Extreme',
      tipoActividad: 'alquiler',
      actividad: '',
      duracion: '',
      cantidadReservada: 1,
      numeroPersonas: 1,
      precio: 0,
      fechaInicio: '',
      fechaFin: '',
      horaInicio: '',
      horaFin: '',
      nota: ''
    });
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
    setErrors({});
  };

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
    duracion: formData.duracion,
    empresa: formData.empresa,
    numeroPersonas: formData.numeroPersonas,
    fechaInicio: formData.fechaInicio,
    fechaFin: formData.fechaFin,
    horaInicio: formData.horaInicio,
    horaFin: formData.horaFin,
    nota: formData.nota,
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

      if (!actividadSeleccionada || !formData.fechaInicio || !formData.horaInicio || formData.cantidadReservada < 1) {
        if (!cancelled) {
          setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
        }
        return;
      }

      const hours = rentalHoursSelected ?? 1;
      const range = calculateRentalRange(formData.fechaInicio, formData.horaInicio, hours);
      if (!range) {
        if (!cancelled) {
          setRentalAvailability({
            status: 'error',
            message: 'Selecciona una hora de inicio valida.'
          });
        }
        return;
      }

      if (rentalHoursSelected && range.crossesDay) {
        if (!cancelled) {
          setRentalAvailability({
            status: 'error',
            message: 'La duracion seleccionada supera las 23:59 del mismo dia.'
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
          message:
            rentalHoursSelected && rentalHoursSelected > 1
              ? 'Disponible para toda la duracion seleccionada.'
              : 'Disponible. Selecciona la duracion final o continua con la reserva.',
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
    formData.fechaInicio,
    formData.horaInicio,
    isOpen,
    isRental,
    rentalHoursSelected
  ]);

  const handleInputChange = async (field: string, value: string | number | boolean) => {
    const nextIsRental = field === 'tipoActividad' ? value === 'alquiler' : isRental;

    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === 'tipoActividad') {
        return {
          ...newData,
          actividad: '',
          duracion: '',
          cantidadReservada: 1,
          numeroPersonas: 1,
          precio: 0,
          fechaInicio: '',
          fechaFin: '',
          horaInicio: '',
          horaFin: '',
          nota: ''
        };
      }

      if (field === 'fechaInicio' && value) {
        newData.horaInicio = getCurrentTimeInputValue();
        if (isRoute) {
          newData.fechaFin = String(value);
        }
      } else if (field === 'fechaInicio' && !value) {
        newData.horaInicio = '';
        if (isRoute) {
          newData.fechaFin = '';
        }
      }

      if (!nextIsRental) {
        if (usesPerPersonPricing && field === 'numeroPersonas' && typeof value === 'number') {
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
            (tarifa) => `${tarifa.duracion_valor}-${tarifa.duracion_unidad}` === newData.duracion
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
          const rentalHours = parseRentalHours(newData.duracion);
          if (rentalHours) {
            const range = calculateRentalRange(newData.fechaInicio, newData.horaInicio, rentalHours);
            newData.fechaFin = range?.fechaFin ?? '';
            newData.horaFin = range && !range.crossesDay ? range.horaFin : '';
          }
        } else if (field === 'duracion' && !newData.duracion) {
          newData.fechaFin = '';
          newData.horaFin = '';
        }

        if ((field === 'duracion' || field === 'cantidadReservada' || field === 'actividad') && precioManualPendiente) {
          newData.precio = 0;
        }

        if (!precioManualPendiente && hourlyBaseTariff) {
          const rentalHours = parseRentalHours(newData.duracion);
          if (rentalHours) {
            newData.precio = Number((hourlyBaseTariff.precio * newData.cantidadReservada * rentalHours).toFixed(2));
          }
        }
      }

      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    if (field === 'tipoActividad') {
      setTipoCargado('');
      setTarifasActividad([]);
      setActividadSeleccionada(null);
      setStockInfo(null);
      setRentalAvailability(EMPTY_RENTAL_AVAILABILITY);
      setCurrentStep(1);
      return;
    }

    if (field === 'actividad' && value) {
        const actividad = actividadesExistentes.find((item) => item.nombre === value);
        if (!actividad) return;

        setActividadSeleccionada(actividad);
        const tarifas = await obtenerTarifasActividad(actividad.id);
        setTarifasActividad(tarifas);
        const actividadMaxPersonas = actividad.numero_personas && actividad.numero_personas > 0 ? actividad.numero_personas : 15;
        const numeroPersonasAjustado = Math.min(formData.numeroPersonas, actividadMaxPersonas);

      if (!nextIsRental) {
        if (tarifas.length === 1) {
          const duracion = `${tarifas[0].duracion_valor}-${tarifas[0].duracion_unidad}`;
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
        const fetchedHourlyBaseTariff = getHourlyBaseTariff(tarifas);
        const requiresManualPrice =
          !fetchedHourlyBaseTariff ||
          fetchedHourlyBaseTariff.precio === 0 ||
          fetchedHourlyBaseTariff.metadata?.precio_manual === true;

        setFormData((prev) => {
          const duration = prev.duracion || buildRentalDurationValue(1);
          const hours = parseRentalHours(duration) ?? 1;
          const range = prev.fechaInicio && prev.horaInicio
            ? calculateRentalRange(prev.fechaInicio, prev.horaInicio, hours)
            : null;

          return {
            ...prev,
            numeroPersonas: Math.min(prev.numeroPersonas, actividadMaxPersonas),
            duracion: duration,
            fechaFin: range?.fechaFin ?? prev.fechaFin,
            horaFin: range && !range.crossesDay ? range.horaFin : '',
            precio: requiresManualPrice || !fetchedHourlyBaseTariff
              ? 0
              : Number((fetchedHourlyBaseTariff.precio * prev.cantidadReservada * hours).toFixed(2))
          };
        });
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
      setCurrentStep(1);
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

    if (field === 'fechaInicio' && !value) {
      setStockInfo(null);
    }

    if (
      isRoute &&
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
        (tarifa) => `${tarifa.duracion_valor}-${tarifa.duracion_unidad}` === formData.duracion
      );
      const requiresManualPrice = selectedTarifa?.precio === 0 && selectedTarifa.metadata?.precio_manual === true;
      if (selectedTarifa && typeof value === 'number' && !requiresManualPrice) {
        const precioCalculado = usesPerPersonPricing ? selectedTarifa.precio * value : selectedTarifa.precio;
        setFormData((prev) => ({ ...prev, precio: precioCalculado }));
      }

      if (usesPerPersonPricing && actividadSeleccionada && formData.fechaInicio && formData.horaInicio) {
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

    if (tarifasActividad.length > 1 && !formData.duracion) {
      newErrors.duracion = 'La duración es obligatoria';
    } else if (tarifasActividad.length === 1 && !formData.duracion) {
      newErrors.duracion = 'Error al cargar la duración de la actividad';
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

    if (stockInfo && stockInfo.stockDisponible < effectiveInventoryQuantity) {
      if (usesGroupedInventory) {
        newErrors.numeroPersonas = `No hay material suficiente para ${formData.numeroPersonas} personas en esa franja.`;
      } else if (usesPerPersonPricing) {
        newErrors.numeroPersonas = `Solo hay ${stockInfo.stockDisponible} plazas disponibles. Total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
      } else {
        newErrors.cantidadReservada = `Solo hay ${stockInfo.stockDisponible} unidades disponibles. Stock total: ${stockInfo.stockTotal}, Reservadas: ${stockInfo.reservadas}`;
      }
    }

    if (stockInfo && stockInfo.stockDisponible === 0) {
      newErrors.actividad = usesGroupedInventory
        ? 'No hay material disponible para esta actividad en la fecha seleccionada'
        : usesPerPersonPricing
        ? 'No hay plazas disponibles para esta actividad en la fecha seleccionada'
        : 'No hay stock disponible para esta actividad en la fecha seleccionada';
    }

    if (precioManualPendiente && formData.precio <= 0) {
      newErrors.precio = 'Debes indicar un precio manual mayor que 0';
    }

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

    if (rentalDurationOptions.length === 0) {
      newErrors.horaInicio = 'No hay margen horario suficiente para una reserva dentro del mismo dia.';
    }

    const hours = rentalHoursSelected;
    if (hours) {
      const range = calculateRentalRange(formData.fechaInicio, formData.horaInicio, hours);
      if (!range || range.crossesDay) {
        newErrors.duracion = 'La duracion seleccionada supera las 23:59 del mismo dia.';
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

    const isValid = isRental
      ? validateRentalStepTwo()
      : isRoute
        ? validateRouteStepTwo()
        : validateStandardForm();
    if (!isValid || rentalAvailability.status === 'checking') {
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
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horaInicio: formData.horaInicio,
        horaFin: formData.horaFin,
        nota: formData.nota || undefined
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
          Selecciona fecha, hora y unidades. En cuanto tengamos esos datos, comprobaremos un hueco provisional de 1 hora.
        </div>
      );
    }

    if (rentalAvailability.status === 'checking') {
      return (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary-dark">
          Comprobando disponibilidad para {rentalAvailability.checkedDurationMin ? `${rentalAvailability.checkedDurationMin / 60} h` : '1 h'}...
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
                  <div>{usesGroupedInventory ? 'Unidades reservadas' : 'Reservadas'}</div>
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
                  <div>{usesGroupedInventory ? 'Unidades reservadas' : 'Reservadas'}</div>
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
                ? 'Hay kayaks disponibles para esta ruta en la franja seleccionada.'
                : 'No hay kayaks suficientes para esta ruta en la franja seleccionada.'}
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
            <option value="parking">Parking</option>
            <option value="otros">Otros</option>
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
            <option value="parking">Parking</option>
            <option value="otros">Otros</option>
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
              <label htmlFor="duracionAlquiler" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración *
              </label>
              <select
                id="duracionAlquiler"
                value={formData.duracion}
                onChange={(e) => handleInputChange('duracion', e.target.value)}
                disabled={!formData.fechaInicio || !formData.horaInicio || rentalDurationOptions.length === 0}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.duracion ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">Selecciona una duración</option>
                {rentalDurationOptions.map((hours) => (
                  <option key={hours} value={buildRentalDurationValue(hours)}>
                    {hours} {hours === 1 ? 'hora' : 'horas'}
                  </option>
                ))}
              </select>
              {errors.duracion && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duracion}</p>}
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
                type="number"
                id="precio"
                value={Number(formData.precio || 0).toFixed(2)}
                onChange={(e) => handleInputChange('precio', parseFloat(e.target.value) || 0)}
                disabled={!precioManualPendiente}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } ${
                  precioManualPendiente
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
              </div>
            </div>
            {precioManualPendiente ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Introduce el precio total manualmente. Cuando exista una tarifa horaria definitiva se rellenará sola.
              </p>
            ) : (
              <p className="mt-1 text-xs text-on-surface-variant">
                Precio automático según tarifa horaria y unidades seleccionadas.
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
                      const durationValue = `${tarifa.duracion_valor}-${tarifa.duracion_unidad}`;
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
                  type="number"
                  id="precio-curso"
                  value={Number(formData.precio || 0).toFixed(2)}
                  onChange={(e) => handleInputChange('precio', parseFloat(e.target.value) || 0)}
                  disabled={!precioManualPendiente}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } ${
                    precioManualPendiente
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                </div>
              </div>
              {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio}</p>}
            </div>
          </div>

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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
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
                    <div className="mt-1 font-semibold text-on-surface">{Number(formData.precio || 0).toFixed(2)} €</div>
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
            <option value="parking">Parking</option>
            <option value="otros">Otros</option>
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
                Hora de Fin *
              </label>
              <input
                type="time"
                id="horaFin-ruta"
                value={formData.horaFin}
                onChange={(e) => handleInputChange('horaFin', e.target.value)}
                disabled={!formData.fechaInicio || !formData.horaInicio}
                step={timeInputStepSeconds}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  !formData.fechaInicio || !formData.horaInicio ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${
                  errors.horaFin ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.horaFin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.horaFin}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="cantidadReservada-ruta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kayaks reservados *
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
                  type="number"
                  id="precio-ruta"
                  value={Number(formData.precio || 0).toFixed(2)}
                  onChange={(e) => handleInputChange('precio', parseFloat(e.target.value) || 0)}
                  disabled={!precioManualPendiente}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  } ${
                    precioManualPendiente
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  placeholder="0.00"
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
                    <div className="text-xs uppercase tracking-[0.14em]">Kayaks</div>
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
            <option value="parking">Parking</option>
            <option value="otros">Otros</option>
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
                  const durationValue = `${tarifa.duracion_valor}-${tarifa.duracion_unidad}`;
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
              Unidades Reservadas *
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
              type="number"
              id="precio"
              value={Number(formData.precio || 0).toFixed(2)}
              onChange={(e) => handleInputChange('precio', parseFloat(e.target.value) || 0)}
              disabled={!precioManualPendiente}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.precio ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              } ${
                precioManualPendiente
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              placeholder="0.00"
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
