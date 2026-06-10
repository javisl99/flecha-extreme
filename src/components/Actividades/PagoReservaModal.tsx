'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ReceiptPercentIcon, CheckCircleIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/formatUtils';
import {
  useActividades,
  type PagoDescuentoSnapshotDraft,
  type ReservaServicioItemInput
} from '@/hooks/useActividades';
import SurfSpinner from '@/components/shared/SurfSpinner';
import TicketCompra from '@/components/Tienda/TicketCompra';
import { SelectorCliente } from '@/components/Actividades/SelectorCliente';
import ModalNuevoClientePago from '@/components/Actividades/ModalNuevoClientePago';
import { useTickets } from '@/hooks/useTickets';
import { toast } from 'react-hot-toast';
import { ACTIVE_PAYMENT_METHOD_OPTIONS } from '@/lib/contabilidadCatalogos';
import { calculateDiscountAmount, calculateDiscountPercentage, type DescuentoModo } from '@/lib/descuentos';
import {
  calculateCampamentoDiscountAmount,
  roundCampamentoCurrency,
  type CampamentoMetadata,
  type CampamentoParticipanteDescuentoSeleccionado,
  type DescuentoCatalogo
} from '@/lib/campamento';
import type { Cliente } from '@/shared/types';

type MetodoPago = 'efectivo' | 'tpv' | 'transferencia' | 'bizum_alfonso';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface ActividadReserva {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  duracion: string;
  empresa: string;
  numeroPersonas: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  nota?: string;
  modoPrecio?: 'por_persona' | 'fijo';
  depositoPermitido?: boolean;
  depositoObligatorio?: boolean;
  precioReserva?: number;
  campamentoMetadata?: CampamentoMetadata;
  reservaFechaInicio?: string;
  reservaFechaFin?: string;
  resumenHorario?: string;
  resumenFechas?: string;
  campamentoProgramaId?: string;
  tarifaId?: string;
  duracionTotalMin?: number;
  asignarTramosDespues?: boolean;
  rangos?: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    duracionMin: number;
  }>;
  participantes?: Array<{
    participanteId?: string;
    nombre: string;
    dni?: string;
    descuentos?: CampamentoParticipanteDescuentoSeleccionado[];
  }>;
}

interface CampamentoParticipantePagoDraft {
  participanteId?: string;
  nombre: string;
  dni?: string;
  descuentos: CampamentoParticipanteDescuentoSeleccionado[];
}

interface PagoReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    actividad: ActividadReserva;
    subtotal: number;
    descuento: number;
    descuentoPorcentaje: number;
    iva: number;
    total: number;
    concepto: string;
    pago: {
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => Promise<{ reservaId?: string } | void>;
  actividad: ActividadReserva;
  readOnly?: boolean;
  reservaData?: {
    metodo: MetodoPago;
    estado: EstadoPago;
    concepto: string;
  };
  initialClienteId?: string | null;
  requireCliente?: boolean;
}

function buildLocalDate(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function buildReservaItemsFromRanges(
  actividad: ActividadReserva,
  cantidad: number
): ReservaServicioItemInput[] | null {
  if (!actividad.rangos || actividad.rangos.length === 0) {
    return null;
  }

  const totalMinutes = actividad.rangos.reduce((sum, rango) => sum + rango.duracionMin, 0);
  const items = actividad.rangos.map((rango, index) => {
    const inicio = buildLocalDate(rango.fechaInicio, rango.horaInicio);
    const fin = buildLocalDate(rango.fechaFin, rango.horaFin);
    const rawSubtotal = totalMinutes > 0
      ? Number(((actividad.precio * rango.duracionMin) / totalMinutes).toFixed(2))
      : 0;
    return {
      index,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      cantidad,
      subtotal: rawSubtotal
    };
  });

  const subtotalAsignado = items.reduce((sum, item) => sum + item.subtotal, 0);
  const ajusteFinal = Number((actividad.precio - subtotalAsignado).toFixed(2));

  return items.map((item) => ({
    inicio: item.inicio,
    fin: item.fin,
    cantidad: item.cantidad,
    subtotal: Number((item.subtotal + (item.index === items.length - 1 ? ajusteFinal : 0)).toFixed(2)),
    tarifa_id: actividad.tarifaId ?? null
  }));
}

function buildInitialCampamentoParticipantes(
  participantes?: ActividadReserva['participantes']
): CampamentoParticipantePagoDraft[] {
  return (participantes ?? []).map((participante) => ({
    participanteId: participante.participanteId,
    nombre: participante.nombre,
    dni: participante.dni,
    descuentos: [...(participante.descuentos ?? [])]
  }));
}

function calculateCampamentoDiscountSummary(
  participants: CampamentoParticipantePagoDraft[],
  baseAmountPerParticipant: number
) {
  const totalDiscount = roundCampamentoCurrency(
    participants.reduce(
      (total, participante) =>
        total + participante.descuentos.reduce(
          (subtotal, descuento) => subtotal + calculateCampamentoDiscountAmount(baseAmountPerParticipant, descuento),
          0
        ),
      0
    )
  );

  const appliedDiscountCount = participants.reduce(
    (total, participante) => total + participante.descuentos.length,
    0
  );

  return {
    totalDiscount,
    appliedDiscountCount
  };
}

interface CampamentoDiscountConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: CampamentoParticipantePagoDraft[];
  discounts: DescuentoCatalogo[];
  baseAmountPerParticipant: number;
  onToggleDiscount: (participantIndex: number, discount: DescuentoCatalogo) => void;
}

function CampamentoDiscountConfiguratorModal({
  isOpen,
  onClose,
  participants,
  discounts,
  baseAmountPerParticipant,
  onToggleDiscount
}: CampamentoDiscountConfiguratorModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[75]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/45" />
        </Transition.Child>

        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
                <div>
                  <Dialog.Title className="text-xl font-black text-on-surface">
                    Configurar descuentos
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Selecciona uno o varios descuentos por participante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-outline-variant/30 p-2 text-on-surface-variant transition hover:border-primary/30 hover:text-primary cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
                <div className="space-y-4">
                  {participants.map((participante, participantIndex) => {
                    const participantDiscount = roundCampamentoCurrency(
                      participante.descuentos.reduce(
                        (total, descuento) => total + calculateCampamentoDiscountAmount(baseAmountPerParticipant, descuento),
                        0
                      )
                    );

                    return (
                      <div
                        key={`${participante.participanteId ?? participante.nombre}-${participantIndex}`}
                        className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-black text-on-surface">{participante.nombre}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              DNI: {participante.dni || '-'}
                            </p>
                          </div>
                          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                            Descuento aplicado: {formatPrice(participantDiscount)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {discounts.map((discount) => {
                            const isSelected = participante.descuentos.some(
                              (selected) => selected.descuento_id === discount.id
                            );
                            const discountAmount = calculateCampamentoDiscountAmount(baseAmountPerParticipant, discount);

                            return (
                              <button
                                key={discount.id}
                                type="button"
                                onClick={() => onToggleDiscount(participantIndex, discount)}
                                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-outline-variant/25 bg-surface-container-lowest text-on-surface hover:border-primary/30'
                                } cursor-pointer`}
                              >
                                <div>
                                  <p className="text-sm font-semibold">{discount.nombre}</p>
                                  <p className="mt-1 text-xs opacity-80">
                                    {discount.tipo_valor === 'porcentaje'
                                      ? `${discount.valor}%`
                                      : `${formatPrice(discount.valor)} por participante`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-black">
                                    -{formatPrice(discountAmount)}
                                  </span>
                                  <span
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                      isSelected ? 'bg-primary' : 'bg-surface-container-high'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                        isSelected ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end border-t border-outline-variant/20 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default function PagoReservaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  actividad,
  readOnly = false,
  reservaData,
  initialClienteId = null,
  requireCliente = false
}: PagoReservaModalProps) {
  const {
    crearReserva,
    crearInscripcionCampamento,
    crearPago,
    obtenerIdEmpresa,
    obtenerDescuentosActivosCampamento
  } = useActividades();
  const { saveTicket } = useTickets();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [concepto, setConcepto] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [esReservaOverride, setEsReservaOverride] = useState<boolean | null>(null);
  const [precioReservaOverride, setPrecioReservaOverride] = useState<number | null>(null);
  const [reservaPreviaPagada, setReservaPreviaPagada] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [showDiscountConfigurator, setShowDiscountConfigurator] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);
  const [discountMode, setDiscountMode] = useState<DescuentoModo>('porcentaje');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [descuentosDisponibles, setDescuentosDisponibles] = useState<DescuentoCatalogo[]>([]);
  const [participantesConDescuentos, setParticipantesConDescuentos] = useState<CampamentoParticipantePagoDraft[]>([]);
  const [processedPaymentData, setProcessedPaymentData] = useState<{
    actividad: ActividadReserva;
    subtotal: number;
    descuento: number;
    discountPercentage: number;
    discountLabel?: string;
    iva: number;
    total: number;
    metodoPago: string;
    fecha: Date;
    reservaId?: string;
    estadoPago: EstadoPago;
  } | null>(null);

  // Inicializar valores cuando se proporcionen datos de la reserva
  useEffect(() => {
    if (reservaData && readOnly) {
      setMetodoPago(reservaData.metodo);
      setConcepto(reservaData.concepto);
    }
  }, [reservaData, readOnly]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedClienteId(initialClienteId);
  }, [initialClienteId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDiscountMode('porcentaje');
      setDiscountValue(0);
      setParticipantesConDescuentos([]);
      setDescuentosDisponibles([]);
      setShowDiscountConfigurator(false);
      setIsLoadingDiscounts(false);
      setEsReservaOverride(null);
      setPrecioReservaOverride(null);
      setReservaPreviaPagada(true);
      return;
    }

    setParticipantesConDescuentos(buildInitialCampamentoParticipantes(actividad.participantes));
    setDiscountMode('porcentaje');
    setDiscountValue(0);
    setEsReservaOverride(Boolean(actividad.campamentoProgramaId) ? true : null);
    setPrecioReservaOverride(actividad.precioReserva ?? null);
    setReservaPreviaPagada(true);

    if (!actividad.campamentoProgramaId || !actividad.participantes?.length) {
      setDescuentosDisponibles([]);
      return;
    }

    let cancelled = false;

    const loadDiscounts = async () => {
      try {
        setIsLoadingDiscounts(true);
        const result = await obtenerDescuentosActivosCampamento();
        if (!cancelled) {
          setDescuentosDisponibles(result);
        }
      } catch (error) {
        console.error('Error cargando descuentos de campamento:', error);
        if (!cancelled) {
          setDescuentosDisponibles([]);
          toast.error('No se pudieron cargar los descuentos disponibles');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDiscounts(false);
        }
      }
    };

    void loadDiscounts();

    return () => {
      cancelled = true;
    };
  }, [actividad.campamentoProgramaId, actividad.participantes, isOpen, obtenerDescuentosActivosCampamento]);

  const metodosPago = useMemo(
    () => ACTIVE_PAYMENT_METHOD_OPTIONS as Array<{ value: MetodoPago; label: string }>,
    []
  );

  // Obtener el método de pago optimizado
  const selectedMetodoPago = useMemo(() => 
    metodosPago.find(m => m.value === metodoPago), 
    [metodoPago, metodosPago]
  );
  const depositoPermitido = actividad.depositoPermitido ?? false;
  const depositoObligatorio = actividad.depositoObligatorio ?? false;
  const esReserva = esReservaOverride ?? depositoObligatorio;
  const precioReserva = precioReservaOverride ?? Math.max(actividad.precioReserva ?? 0, 0);
  const isCampamento = Boolean(actividad.campamentoProgramaId);
  const usaReservaPreviaCampamento = isCampamento && esReserva;
  const usaConfirmacionPagoNormal = !esReserva || usaReservaPreviaCampamento;
  const precioBaseParticipante = useMemo(
    () => actividad.numeroPersonas > 0 ? roundCampamentoCurrency(actividad.precio / actividad.numeroPersonas) : actividad.precio,
    [actividad.numeroPersonas, actividad.precio]
  );
  const { totalDiscount: descuentoCampamentoTotal, appliedDiscountCount } = useMemo(
    () => calculateCampamentoDiscountSummary(participantesConDescuentos, precioBaseParticipante),
    [participantesConDescuentos, precioBaseParticipante]
  );

  const descuentoManual = useMemo(() => {
    if (isCampamento) {
      return 0;
    }

    return calculateDiscountAmount(actividad.precio, discountMode, discountValue);
  }, [actividad.precio, discountMode, discountValue, isCampamento]);

  // Cálculos de precios optimizados con useMemo
  const {
    subtotal,
    descuento,
    discountPercentageValue,
    discountLabel,
    iva,
    total,
    precioRestante,
    importeReserva,
    importeInscripcionPendiente
  } = useMemo(() => {
    const subtotal = actividad.precio;
    const descuento = isCampamento ? descuentoCampamentoTotal : descuentoManual;
    const subtotalConDescuento = Math.max(subtotal - descuento, 0);
    const iva = subtotalConDescuento * 0.21; // 21% de IVA (informativo)

    const importeReserva = esReserva ? Math.min(precioReserva, subtotalConDescuento) : 0;
    const importeInscripcionPendiente = esReserva ? Math.max(subtotalConDescuento - importeReserva, 0) : 0;
    const total = usaReservaPreviaCampamento
      ? importeInscripcionPendiente
      : esReserva
        ? importeReserva
        : subtotalConDescuento;
    const precioRestante = usaReservaPreviaCampamento ? 0 : importeInscripcionPendiente;
    const discountPercentageValue = calculateDiscountPercentage(subtotal, descuento);
    const discountLabel = isCampamento
      ? 'Descuento campamento'
      : discountMode === 'porcentaje'
        ? `Descuento (${discountValue}%)`
        : 'Descuento (€)';

    return {
      subtotal,
      descuento,
      discountPercentageValue,
      discountLabel,
      iva,
      total,
      precioRestante,
      importeReserva,
      importeInscripcionPendiente
    };
  }, [
    actividad.precio,
    descuentoCampamentoTotal,
    descuentoManual,
    discountMode,
    discountValue,
    esReserva,
    isCampamento,
    precioReserva,
    usaReservaPreviaCampamento
  ]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actividad) {
      return;
    }

    if (esReserva && precioReserva <= 0) {
      toast.error('Debes indicar un importe de reserva mayor que 0');
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  const handleToggleParticipantDiscount = (participantIndex: number, discount: DescuentoCatalogo) => {
    setParticipantesConDescuentos((current) => current.map((participante, index) => {
      if (index !== participantIndex) {
        return participante;
      }

      const isSelected = participante.descuentos.some((selected) => selected.descuento_id === discount.id);
      if (isSelected) {
        return {
          ...participante,
          descuentos: participante.descuentos.filter((selected) => selected.descuento_id !== discount.id)
        };
      }

      return {
        ...participante,
        descuentos: [
          ...participante.descuentos,
          {
            descuento_id: discount.id,
            codigo: discount.codigo,
            nombre: discount.nombre,
            tipo_valor: discount.tipo_valor,
            valor: discount.valor
          }
        ]
      };
    }));
  };

  const handleConfirmPaymentWithState = async (estado: EstadoPago) => {
    setIsProcessing(true);
    
    try {
      let reservaId: string | undefined;
      
      if (!readOnly) {
        if (requireCliente && !selectedClienteId) {
          throw new Error('Debes seleccionar un cliente pagador para continuar');
        }

        // Obtener el ID de la empresa
        const resultadoEmpresa = await obtenerIdEmpresa(actividad.empresa);
        if (!resultadoEmpresa.success) {
          throw new Error(resultadoEmpresa.message);
        }

        const clienteId = selectedClienteId ?? null;
        
        // Crear la reserva en la base de datos
        // Crear fechas sin conversión de zona horaria
        const fallbackDate = new Date().toISOString().split('T')[0];
        const fechaInicioBase = actividad.reservaFechaInicio ?? actividad.fechaInicio ?? fallbackDate;
        const fechaFinBase = actividad.reservaFechaFin ?? actividad.fechaFin ?? fechaInicioBase;
        const horaInicioValue = /^\d{2}:\d{2}$/.test(actividad.horaInicio) ? actividad.horaInicio : '00:00';
        const horaFinValue = /^\d{2}:\d{2}$/.test(actividad.horaFin) ? actividad.horaFin : horaInicioValue;
        const [añoInicio, mesInicio, diaInicio] = fechaInicioBase.split('-');
        const [horaInicio, minutoInicio] = horaInicioValue.split(':');
        const [añoFin, mesFin, diaFin] = fechaFinBase.split('-');
        const [horaFin, minutoFin] = horaFinValue.split(':');
        
        const fechaInicio = new Date(parseInt(añoInicio), parseInt(mesInicio) - 1, parseInt(diaInicio), parseInt(horaInicio), parseInt(minutoInicio), 0);
        const fechaFin = new Date(parseInt(añoFin), parseInt(mesFin) - 1, parseInt(diaFin), parseInt(horaFin), parseInt(minutoFin), 0);
        const reservaItems = buildReservaItemsFromRanges(actividad, actividad.cantidad);
        const estadoAsignacionTramos = actividad.asignarTramosDespues
          ? 'pendiente'
          : actividad.duracionTotalMin && actividad.rangos && actividad.rangos.length > 0
            ? 'completa'
            : 'no_aplica';
        
        const estadoReserva = usaReservaPreviaCampamento
          ? (reservaPreviaPagada && (importeInscripcionPendiente <= 0 || estado === 'completado') ? 'confirmada' : 'pendiente')
          : esReserva
            ? 'pendiente'
            : (estado === 'completado' ? 'confirmada' : 'pendiente');
        const participantesPayload = participantesConDescuentos.map((participante) => ({
          participanteId: participante.participanteId ?? null,
          nombre: participante.nombre,
          dni: participante.dni,
          descuentos: participante.descuentos
        }));
        const resultadoReserva = actividad.campamentoProgramaId && actividad.tarifaId
          ? await crearInscripcionCampamento({
              campamentoProgramaId: actividad.campamentoProgramaId,
              idCliente: clienteId,
              idActividad: actividad.id,
              idEmpresa: resultadoEmpresa.empresaId!,
              tarifaId: actividad.tarifaId,
              precioUnitario: actividad.numeroPersonas > 0
                ? Number((actividad.precio / actividad.numeroPersonas).toFixed(2))
                : actividad.precio,
              precioTotal: subtotal,
              cantidadParticipantes: actividad.numeroPersonas,
              fechaInicio: fechaInicio.toISOString(),
              fechaFin: fechaFin.toISOString(),
              horaInicio: actividad.horaInicio,
              horaFin: actividad.horaFin,
              estado: estadoReserva,
              nota: actividad.nota || undefined,
              participantes: participantesPayload
            })
          : await crearReserva({
              id_cliente: clienteId,
              id_actividad: actividad.id,
              id_empresa: resultadoEmpresa.empresaId!,
              cantidad_reservada: actividad.cantidad,
              tarifa_id: actividad.tarifaId ?? null,
              numero_personas: actividad.numeroPersonas,
              precio: actividad.precio,
              fecha_inicio: fechaInicio.toISOString(),
              fecha_fin: fechaFin.toISOString(),
              estado: estadoReserva,
              estado_asignacion_tramos: estadoAsignacionTramos,
              duracion_total_min: actividad.duracionTotalMin ?? null,
              nota: actividad.nota || undefined,
              items: actividad.asignarTramosDespues ? [] : (reservaItems ?? undefined),
              metadata: actividad.campamentoMetadata
                ? { campamento: actividad.campamentoMetadata }
                : undefined
            });
        
        if (!resultadoReserva.success) {
          throw new Error(resultadoReserva.message);
        }
        
        reservaId = resultadoReserva.reservaId;
        const descuentosSnapshot: PagoDescuentoSnapshotDraft[] =
          'descuentosSnapshot' in resultadoReserva && Array.isArray(resultadoReserva.descuentosSnapshot)
            ? resultadoReserva.descuentosSnapshot
            : [];
        
        // Crear los pagos en la base de datos
        if (usaReservaPreviaCampamento) {
          if (importeReserva > 0) {
            const resultadoPagoReservaPrevia = await crearPago({
              id_cliente: clienteId,
              origen_tipo: 'reserva',
              origen_id: reservaId!,
              concepto: `Reserva previa - ${concepto}`,
              importe: importeReserva,
              metodo: metodoPago,
              estado: reservaPreviaPagada ? 'completado' : 'pendiente',
              descuentosSnapshot
            });

            if (!resultadoPagoReservaPrevia.success) {
              throw new Error(resultadoPagoReservaPrevia.message);
            }
          }

          if (importeInscripcionPendiente > 0) {
            const resultadoPagoRestoInscripcion = await crearPago({
              id_cliente: clienteId,
              origen_tipo: 'reserva',
              origen_id: reservaId!,
              concepto: `Resto inscripción - ${concepto}`,
              importe: importeInscripcionPendiente,
              metodo: metodoPago,
              estado,
              descuentosSnapshot
            });

            if (!resultadoPagoRestoInscripcion.success) {
              throw new Error(resultadoPagoRestoInscripcion.message);
            }
          }
        } else if (esReserva && precioRestante > 0) {
          // Crear pago inmediato (reserva)
          const resultadoPagoReserva = await crearPago({
            id_cliente: clienteId,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: `Reserva - ${concepto}`,
            importe: total,
            metodo: metodoPago,
            estado: 'completado',
            descuentosSnapshot
          });
          
          if (!resultadoPagoReserva.success) {
            throw new Error(resultadoPagoReserva.message);
          }
          
          // Crear pago pendiente (resto)
          const resultadoPagoPendiente = await crearPago({
            id_cliente: clienteId,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: `Pago pendiente - ${concepto}`,
            importe: precioRestante,
            metodo: metodoPago,
            estado: 'pendiente',
            descuentosSnapshot
          });
          
          if (!resultadoPagoPendiente.success) {
            throw new Error(resultadoPagoPendiente.message);
          }
        } else {
          // Crear pago normal (sin reserva)
          const resultadoPago = await crearPago({
            id_cliente: clienteId,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: concepto,
            importe: total,
            metodo: metodoPago,
            estado: estado,
            descuentosSnapshot
          });
          
          if (!resultadoPago.success) {
            throw new Error(resultadoPago.message);
          }
        }
      }
      
      // Preservar los datos del pago para el ticket
        const paymentData = {
          actividad: { 
            ...actividad,
            participantes: participantesConDescuentos.map((participante) => ({
              participanteId: participante.participanteId,
              nombre: participante.nombre,
            dni: participante.dni,
            descuentos: participante.descuentos
          })),
          // Si es reserva, modificar el precio para el ticket
          precio: esReserva ? total : actividad.precio
        },
        subtotal: esReserva ? total : subtotal,
        descuento: esReserva ? 0 : descuento,
        discountPercentage: isCampamento ? 0 : discountPercentageValue,
        discountLabel,
        iva: esReserva ? total * 0.21 : iva,
        total,
        metodoPago: (() => {
          const metodo = selectedMetodoPago?.label || 'Efectivo';
          if (metodo.includes('Bizum')) return 'Bizum';
          if (metodo.includes('Tarjeta')) return 'Tarjeta';
          return 'Efectivo';
        })(),
        fecha: new Date(),
        reservaId,
        estadoPago: estado
      };
      
      setProcessedPaymentData(paymentData);
      
      // Ejecutar onSubmit del componente padre si no es readOnly
      if (!readOnly) {
        await onSubmit({
          actividad: {
            ...actividad,
            participantes: participantesConDescuentos.map((participante) => ({
              participanteId: participante.participanteId,
              nombre: participante.nombre,
              dni: participante.dni,
              descuentos: participante.descuentos
            }))
          },
        subtotal,
        descuento,
        descuentoPorcentaje: isCampamento ? 0 : discountPercentageValue,
        iva,
          total,
          concepto, // Usar el concepto del campo del formulario
          pago: {
            metodo: metodoPago,
            estado: estado
          }
        });
      }
      
      // Cerrar modal de confirmación y abrir modal del ticket
      setShowConfirmationModal(false);
      setShowTicketModal(true);
    } catch (error: unknown) {
      console.error('Error procesando pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    await handleConfirmPaymentWithState('completado');
  };

  const handleCancelPayment = () => {
    setShowConfirmationModal(false);
  };


  const handleGuardarTicket = async () => {
    if (!processedPaymentData) {
      toast.error('No hay datos de pago para guardar');
      return;
    }

    setIsSavingTicket(true);

    try {
      const ticketQuantity = actividad.modoPrecio === 'por_persona'
        ? Math.max(actividad.numeroPersonas, 1)
        : Math.max(actividad.cantidad, 1);
      const ticketUnitPrice = ticketQuantity > 0
        ? processedPaymentData.actividad.precio / ticketQuantity
        : processedPaymentData.actividad.precio;

      const ticketData = {
        cartItems: [{
          id: processedPaymentData.actividad.id,
          name: usaReservaPreviaCampamento
            ? `Resto inscripción - ${processedPaymentData.actividad.nombre}`
            : esReserva 
              ? `Reserva - ${processedPaymentData.actividad.nombre}`
            : processedPaymentData.actividad.nombre,
          price: ticketUnitPrice,
          quantity: ticketQuantity,
          image: '',
        }],
        subtotal: processedPaymentData.subtotal,
        descuento: processedPaymentData.descuento,
        discountPercentage: processedPaymentData.discountPercentage,
        discountLabel: processedPaymentData.discountLabel,
        iva: processedPaymentData.iva,
        total: processedPaymentData.total,
        metodoPago: processedPaymentData.metodoPago,
        fecha: processedPaymentData.fecha,
        pedidoId: processedPaymentData.reservaId,
        clienteId: selectedClienteId || undefined,
        estadoPago: processedPaymentData.estadoPago
      };

      const result = await saveTicket(ticketData);
      
      if (result.success && result.url) {
        // Actualizar la tabla reserva con la URL del ticket
        if (processedPaymentData.reservaId) {
          try {
            const supabase = (await import('@/lib/supabaseClient')).default;
            await supabase
              .from('reserva_servicio')
              .update({ ticket_url: result.url })
              .eq('id', processedPaymentData.reservaId);
          } catch (err) {
            console.error('❌ Error en catch al actualizar tabla reserva:', err);
            console.warn('Error al actualizar la URL del ticket en la tabla reserva:', err);
          }
        } else {
          console.warn('⚠️ No hay reservaId para actualizar la tabla reserva');
        }

        // Mostrar toast de éxito
        if (result.emailSent) {
          toast.success(`✅ Ticket PDF guardado exitosamente\n📧 ${result.emailMessage}`, {
            duration: 4000,
          });
        } else if (processedPaymentData.estadoPago === 'pendiente') {
          toast.success(`✅ Ticket PDF guardado exitosamente\n⏳ ${result.emailMessage}`, {
            duration: 4000,
          });
        } else {
          toast.success(`✅ Ticket PDF guardado exitosamente\n⚠️ ${result.emailMessage}`, {
            duration: 4000,
          });
        }

        // Cerrar el modal del ticket después de guardar exitosamente
        setShowTicketModal(false);
        setProcessedPaymentData(null);
        handleCloseModal();
      } else {
        toast.error(`❌ Error al guardar el ticket: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando ticket:', error);
      toast.error(`❌ Error al guardar el ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleCloseTicket = () => {
    setShowTicketModal(false);
    setProcessedPaymentData(null); // Limpiar los datos procesados
    // Limpiar formulario y cerrar modal
    setSelectedClienteId(null);
    setMetodoPago('efectivo');
    setConcepto('');
    setDiscountMode('porcentaje');
    setDiscountValue(0);
    setEsReservaOverride(null);
    setPrecioReservaOverride(null);
    setReservaPreviaPagada(true);
    setShowDiscountConfigurator(false);
    setParticipantesConDescuentos(buildInitialCampamentoParticipantes(actividad.participantes));
    onClose();
  };

  const handleCloseModal = () => {
    setEsReservaOverride(null);
    setPrecioReservaOverride(null);
    setReservaPreviaPagada(true);
    setDiscountMode('porcentaje');
    setDiscountValue(0);
    setShowNuevoClienteModal(false);
    setShowDiscountConfigurator(false);
    onClose();
  };

  const handleNuevoClienteSuccess = (cliente: Cliente) => {
    setSelectedClienteId(cliente.id);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className="flex min-h-full w-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl max-h-[90vh] transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform">
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ReceiptPercentIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Procesar Pago de Reserva
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {actividad.nombre} - {actividad.empresa}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg p-1 hover:bg-black/10 transition-colors cursor-pointer"
                        onClick={handleCloseModal}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Columna izquierda - Cliente y Método de pago */}
                      <div className="space-y-6">
                        {/* Selector de cliente */}
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Cliente
                            </label>
                            {!readOnly ? (
                              <button
                                type="button"
                                onClick={() => setShowNuevoClienteModal(true)}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 cursor-pointer"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Nuevo cliente
                              </button>
                            ) : null}
                          </div>
                          <SelectorCliente
                            selectedClienteId={selectedClienteId}
                            onClienteChange={setSelectedClienteId}
                            placeholder="Buscar por nombre, apellidos o DNI"
                            className="w-full"
                            disabled={readOnly}
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {requireCliente
                              ? 'Este pago requiere un cliente pagador seleccionado.'
                              : <>Puedes dejar la reserva y el pago como <span className="font-semibold">Sin cliente</span>.</>}
                          </p>
                        </div>

                        {/* Switch de Reserva y Precio de Reserva */}
                        <div className={`grid gap-6 ${usaReservaPreviaCampamento ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-2'}`}>
                          {/* Switch de Reserva */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {isCampamento ? 'Reserva previa' : 'Reserva'}
                            </label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setEsReservaOverride(!esReserva)}
                                disabled={readOnly || (!depositoPermitido && !isCampamento) || depositoObligatorio}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
                                  esReserva 
                                    ? 'bg-primary' 
                                    : 'bg-gray-200 dark:bg-gray-700'
                                } ${
                                  readOnly || ((!depositoPermitido && !isCampamento) || depositoObligatorio)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    esReserva ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                              {depositoObligatorio
                                ? 'Obligatorio'
                                : isCampamento
                                  ? (esReserva ? 'Activada' : 'Desactivada')
                                : depositoPermitido
                                  ? (esReserva ? 'Activado' : 'Desactivado')
                                  : 'No disponible'}
                            </span>
                          </div>
                          {!readOnly && depositoObligatorio && (
                            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                              Esta actividad exige anticipo para confirmar la reserva.
                            </p>
                          )}
                          {!readOnly && isCampamento && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              Si la inscripción viene de una reserva previa, podrás registrar ese cobro como pagado o pendiente.
                            </p>
                          )}
                          </div>

                          {usaReservaPreviaCampamento && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Estado reserva previa
                              </label>
                              <select
                                value={reservaPreviaPagada ? 'completado' : 'pendiente'}
                                onChange={(e) => setReservaPreviaPagada(e.target.value === 'completado')}
                                disabled={readOnly}
                                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <option value="completado">Pagada</option>
                                <option value="pendiente">Pendiente</option>
                              </select>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Esto definirá el estado del pago correspondiente a la reserva previa.
                              </p>
                            </div>
                          )}

                          {/* Precio de Reserva */}
                          {esReserva && (
                            <div>
                              <label htmlFor="precioReserva" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {usaReservaPreviaCampamento ? 'Importe reserva previa (€)' : 'Precio de Reserva (€)'}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  id="precioReserva"
                                  value={precioReserva}
                                  onChange={(e) => setPrecioReservaOverride(parseFloat(e.target.value) || 0)}
                                  disabled={readOnly || depositoObligatorio}
                                  min="0"
                                  step="0.01"
                                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                                    readOnly || depositoObligatorio
                                      ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  } border-gray-300 dark:border-gray-600`}
                                  placeholder="0.00"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {usaReservaPreviaCampamento
                                  ? 'Se registrará como un pago separado de la inscripción.'
                                  : depositoObligatorio
                                  ? 'Se usa el anticipo configurado en la actividad'
                                  : 'Pago inmediato al realizar la reserva'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Métodos de pago */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Método de Pago
                          </h4>
                          
                          <div>
                            <label htmlFor="metodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Forma de pago
                            </label>
                            <select
                              id="metodo"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              value={metodoPago}
                              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                              required
                              disabled={readOnly}
                            >
                              {metodosPago.map((metodo) => (
                                <option key={metodo.value} value={metodo.value}>
                                  {metodo.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Concepto
                            </label>
                            <input
                              type="text"
                              id="concepto"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              value={concepto}
                              onChange={(e) => setConcepto(e.target.value)}
                              placeholder="Descripción del pago (opcional)"
                              disabled={readOnly}
                            />
                          </div>

                          {!readOnly && !isCampamento ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descuento
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={discountMode}
                                  onChange={(e) => setDiscountMode(e.target.value as DescuentoModo)}
                                  className="col-span-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="porcentaje">%</option>
                                  <option value="importe">€</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  max={discountMode === 'porcentaje' ? 100 : undefined}
                                  step="0.01"
                                  value={discountValue === 0 ? '' : discountValue}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                      setDiscountValue(0);
                                      return;
                                    }

                                    const parsed = Number(raw);
                                    if (Number.isNaN(parsed)) {
                                      return;
                                    }

                                    setDiscountValue(discountMode === 'porcentaje'
                                      ? Math.min(100, Math.max(0, parsed))
                                      : Math.max(0, parsed));
                                  }}
                                  className="col-span-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                  placeholder="0.00"
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Puedes aplicar un descuento en porcentaje o en importe fijo.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Columna derecha - Ticket de reserva */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Ticket de Reserva
                          </h4>
                          {isCampamento && participantesConDescuentos.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowDiscountConfigurator(true)}
                              disabled={readOnly || isLoadingDiscounts || descuentosDisponibles.length === 0}
                              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                              <ReceiptPercentIcon className="h-4 w-4" />
                              {isLoadingDiscounts ? 'Cargando...' : 'Configurar descuentos'}
                            </button>
                          ) : null}
                        </div>
                        
                        {/* Ticket container */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                          {/* Header del ticket */}
                          <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-3 mb-4">
                            <h5 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              FLECHA EXTREME
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date().toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Europe/Madrid'
                              })}
                            </p>
                          </div>

                          {/* Información de la actividad */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {actividad.nombre}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <div>Empresa: {actividad.empresa}</div>
                                  <div>{isCampamento ? 'Programa' : 'Duración'}: {isCampamento ? (actividad.resumenFechas || '--') : actividad.duracion}</div>
                                  <div>Personas: {actividad.numeroPersonas}</div>
                                  {isCampamento ? (
                                    <div>Horario: {actividad.resumenHorario || `${actividad.horaInicio} - ${actividad.horaFin}`}</div>
                                  ) : (
                                    <>
                                      <div>Fecha: {new Date(actividad.fechaInicio).toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        timeZone: 'Europe/Madrid'
                                      })}</div>
                                      <div>Hora: {actividad.horaInicio} - {actividad.horaFin}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {formatPrice(subtotal)}
                              </span>
                            </div>
                          </div>

                          {/* Separador */}
                          <div className="border-t border-gray-300 dark:border-gray-600 my-3"></div>

                          {/* Resumen de precios */}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {formatPrice(subtotal)}
                              </span>
                            </div>

                            {isCampamento ? (
                              <div className="rounded-md bg-primary/5 px-3 py-2 text-xs text-primary-dark">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Participantes con descuento</span>
                                  <span className="font-bold">
                                    {participantesConDescuentos.filter((participante) => participante.descuentos.length > 0).length}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-3">
                                  <span>Descuentos aplicados</span>
                                  <span className="font-bold">{appliedDiscountCount}</span>
                                </div>
                              </div>
                            ) : null}

                            {descuento > 0 ? (
                              <div className="flex justify-between">
                                <span className="text-emerald-700 dark:text-emerald-300">
                                  {discountLabel}:
                                </span>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                  -{formatPrice(descuento)}
                                </span>
                              </div>
                            ) : null}
                            
                            <div className="flex justify-between text-gray-500 dark:text-gray-500">
                              <span>IVA incluido (21%):</span>
                              <span>
                                {formatPrice(iva)}
                              </span>
                            </div>
                            
                            {usaReservaPreviaCampamento && importeReserva > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-3">
                                <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                  <strong>Inscripción con reserva previa:</strong>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">
                                    Reserva previa ({reservaPreviaPagada ? 'pagada' : 'pendiente'}):
                                  </span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(importeReserva)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">Resto inscripción:</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(importeInscripcionPendiente)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!usaReservaPreviaCampamento && esReserva && precioRestante > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-3">
                                <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                  <strong>Pago con Reserva:</strong>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">Pago inmediato (reserva):</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(precioReserva)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">Pago pendiente:</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(precioRestante)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-900 dark:text-gray-100">
                                  {usaReservaPreviaCampamento
                                    ? 'RESTO DE INSCRIPCIÓN:'
                                    : esReserva ? 'TOTAL A PAGAR AHORA:' : 'TOTAL:'}
                                </span>
                                <span className="text-primary">
                                  {formatPrice(total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors duration-75 cursor-pointer"
                        onClick={handleCloseModal}
                        disabled={isProcessing}
                      >
                        {readOnly ? 'Cerrar' : 'Cancelar'}
                      </button>
                      {!readOnly && (
                        <button
                          type="submit"
                          disabled={!actividad || isProcessing}
                          className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="font-bold">Procesando...</span>
                            </div>
                          ) : (
                            <span className="font-bold">{`Procesar Pago - ${formatPrice(total)}`}</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
        </Dialog>
      </Transition.Root>

      {/* Modal de confirmación de pago */}
      <Transition.Root show={showConfirmationModal} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={handleCancelPayment}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 flex items-center justify-center">
            <div className="flex min-h-full w-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform">
                  <div className="px-6 py-8">
                    <div className="text-center">
                      {/* Spinner de carga */}
                      <div className="mx-auto mb-6">
                        <SurfSpinner size="lg" />
                      </div>
                      
                      {/* Título */}
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Esperando Confirmación
                      </Dialog.Title>
                      
                      {/* Descripción */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        {usaConfirmacionPagoNormal
                          ? `Seleccione cómo desea registrar el pago de ${formatPrice(total)}`
                          : `Por favor, confirme cuando haya recibido el pago de ${formatPrice(total)}`
                        }
                      </p>
                      
                      {/* Información del pago */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Método:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {selectedMetodoPago?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Actividad:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {actividad.nombre}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones */}
                      {usaConfirmacionPagoNormal ? (
                        // Opciones para pago completo (sin reserva)
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-75 cursor-pointer"
                              onClick={handleCancelPayment}
                              disabled={isProcessing}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              onClick={() => handleConfirmPaymentWithState('pendiente')}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Procesando...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>Pendiente Pago</span>
                                </div>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            onClick={() => handleConfirmPaymentWithState('completado')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Procesando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <CheckCircleIcon className="h-4 w-4" />
                                <span>Confirmar Pago</span>
                              </div>
                            )}
                          </button>
                        </div>
                      ) : (
                        // Opción única para reserva cobrada ahora
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-75 cursor-pointer"
                            onClick={handleCancelPayment}
                            disabled={isProcessing}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            onClick={handleConfirmPayment}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Procesando...</span>
                              </div>
                            ) : (
                              'Confirmar Pago'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <ModalNuevoClientePago
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        onSuccess={handleNuevoClienteSuccess}
      />

      <CampamentoDiscountConfiguratorModal
        isOpen={showDiscountConfigurator}
        onClose={() => setShowDiscountConfigurator(false)}
        participants={participantesConDescuentos}
        discounts={descuentosDisponibles}
        baseAmountPerParticipant={precioBaseParticipante}
        onToggleDiscount={handleToggleParticipantDiscount}
      />

      {/* Modal del ticket de compra */}
      {processedPaymentData && (
        <TicketCompra
          isOpen={showTicketModal}
          onClose={handleCloseTicket}
          onGuardar={handleGuardarTicket}
          cartItems={[{
            id: processedPaymentData.actividad.id,
            name: usaReservaPreviaCampamento
              ? `Resto inscripción - ${processedPaymentData.actividad.nombre} - Personas:`
              : esReserva 
                ? `Reserva - ${processedPaymentData.actividad.nombre} - Personas:`
                : `${processedPaymentData.actividad.nombre} - Personas:`,
            price: processedPaymentData.actividad.precio / processedPaymentData.actividad.numeroPersonas,
            quantity: processedPaymentData.actividad.numeroPersonas, 
            image: '',
          }]}
          subtotal={processedPaymentData.subtotal}
          descuento={processedPaymentData.descuento}
          discountPercentage={processedPaymentData.discountPercentage}
          discountLabel={processedPaymentData.discountLabel}
          iva={processedPaymentData.iva}
          total={processedPaymentData.total}
          metodoPago={processedPaymentData.metodoPago}
          fecha={processedPaymentData.fecha}
          pedidoId={processedPaymentData.reservaId}
          clienteId={selectedClienteId || undefined}
          estadoPago={processedPaymentData.estadoPago}
          isSaving={isSavingTicket}
        />
      )}
    </>
  );
}
