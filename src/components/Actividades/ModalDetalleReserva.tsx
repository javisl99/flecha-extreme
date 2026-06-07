'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/components';
import { useActividades, type PagoReservaConReembolsos, type Reserva as ActividadReserva } from '@/hooks/useActividades';
import { useTickets } from '@/hooks/useTickets';
import { useEmailAPI } from '@/hooks/useEmailAPI';
import { useSupabase } from '@/hooks/useSupabase';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TicketCompra from '@/components/Tienda/TicketCompra';
import { toast } from 'react-hot-toast';
import {
  buildCampamentoDateRangeLabel,
  buildCampamentoHorarioSummary,
  getCampamentoMetadata,
  type ReservaServicioItemMetadata
} from '@/lib/campamento';

type Reserva = ActividadReserva & {
  cliente?: ActividadReserva['cliente'] & {
    email?: string;
  };
  metadata?: ReservaServicioItemMetadata;
};

interface ModalDetalleReservaProps {
  isOpen: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onActualizarEstado: (reserva: Reserva, nuevoEstado: string) => Promise<void> | void;
  onReservaActualizada: () => Promise<void> | void;
}

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatearImporte(importe: number) {
  return euroFormatter.format(importe);
}

function formatearEstado(estado: string) {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function getEstadoColor(estado: string) {
  switch (estado) {
    case 'confirmada':
      return 'bg-green-100 text-green-700';
    case 'pendiente':
      return 'bg-amber-100 text-amber-700';
    case 'cancelada':
      return 'bg-red-100 text-red-700';
    case 'completada':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}

function getEstadoPagoColor(estado: string) {
  switch (estado) {
    case 'completado':
      return 'bg-emerald-100 text-emerald-700';
    case 'pendiente':
      return 'bg-amber-100 text-amber-700';
    case 'cancelado':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}

function getEstadoReembolsoLabel(estado: PagoReservaConReembolsos['estado_reembolso']) {
  switch (estado) {
    case 'total':
      return 'Reembolso total';
    case 'parcial':
      return 'Reembolso parcial';
    default:
      return 'Sin reembolso';
  }
}

function getEstadoReembolsoColor(estado: PagoReservaConReembolsos['estado_reembolso']) {
  switch (estado) {
    case 'total':
      return 'bg-sky-100 text-sky-700';
    case 'parcial':
      return 'bg-violet-100 text-violet-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function formatearMetodoPago(metodo: string) {
  const metodosFormateados: Record<string, string> = {
    efectivo: 'Efectivo',
    tpv: 'Tarjeta',
    tpv_online: 'Tarjeta online',
    transferencia: 'Transferencia',
    bizum_alfonso: 'Bizum Alfonso',
    bizum_robe: 'Bizum Robe',
    bizum_alba: 'Bizum Alba',
    bizum_maria: 'Bizum Maria',
    bizum_jm: 'Bizum JM',
    angeles: 'Angeles'
  };

  return metodosFormateados[metodo] ?? metodo;
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Madrid'
  });
}

function formatearHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
}

function formatearDuracionMinutos(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 minutos';
  }

  const horas = Math.floor(totalMinutes / 60);
  const minutos = totalMinutes % 60;

  if (horas === 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
}

function calculateReservaItemDurationMinutes(inicio: string, fin: string) {
  const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

const MADRID_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function getMadridDateKey(value: string | Date) {
  return MADRID_DATE_KEY_FORMATTER.format(new Date(value));
}

function isFutureTramoDay(value: string) {
  return getMadridDateKey(value) > getMadridDateKey(new Date());
}

function getEstadoAsignacionTramosLabel(estado?: Reserva['estado_asignacion_tramos']) {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente de asignar';
    case 'parcial':
      return 'Asignación parcial';
    case 'completa':
      return 'Horas completas';
    default:
      return '';
  }
}

function getEstadoAsignacionTramosColor(estado?: Reserva['estado_asignacion_tramos']) {
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

function getCantidadDetalle(reserva: Reserva) {
  const personas = reserva.numero_personas_reserva;

  if (personas && personas !== reserva.cantidad_reservada) {
    return {
      primaryLabel: 'Material',
      primaryValue: reserva.cantidad_reservada,
      secondaryLabel: 'Personas',
      secondaryValue: personas
    };
  }

  if (personas) {
    return {
      primaryLabel: 'Personas',
      primaryValue: personas
    };
  }

  return {
    primaryLabel: 'Cantidad',
    primaryValue: reserva.cantidad_reservada
  };
}

function buildInitialRefundInputs(pagos: PagoReservaConReembolsos[]) {
  return pagos.reduce<Record<string, string>>((acc, pago) => {
    if (pago.estado === 'completado' && pago.importe_reembolsable > 0) {
      acc[pago.id] = pago.importe_reembolsable.toFixed(2);
    }
    return acc;
  }, {});
}

export default function ModalDetalleReserva({
  isOpen,
  reserva,
  onClose,
  onActualizarEstado,
  onReservaActualizada
}: ModalDetalleReservaProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [pagoPendiente, setPagoPendiente] = useState<{
    id: string;
    concepto: string;
    importe: number;
    metodo: string;
    id_cliente: string;
  } | null>(null);
  const [isLoadingPago, setIsLoadingPago] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [pagosReserva, setPagosReserva] = useState<PagoReservaConReembolsos[]>([]);
  const [isLoadingPagosReserva, setIsLoadingPagosReserva] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [refundInputs, setRefundInputs] = useState<Record<string, string>>({});
  const [cancelComment, setCancelComment] = useState('');
  const [itemDeletingId, setItemDeletingId] = useState<string | null>(null);
  const [showDeleteTramoModal, setShowDeleteTramoModal] = useState(false);
  const [tramoAEliminar, setTramoAEliminar] = useState<{ id: string; inicio: string } | null>(null);
  const [reservaDetalle, setReservaDetalle] = useState<Reserva | null>(reserva);

  const {
    obtenerPagosPendientesReserva,
    obtenerTodosLosPagosReserva,
    obtenerPagosReservaConReembolsos,
    cancelarReservaConReembolsos,
    obtenerReservaPorId,
    eliminarTramoReservaCurso,
    actualizarTicketUrlReserva,
    actualizarEstadoPago
  } = useActividades();
  const { saveTicket } = useTickets();
  const { sendTicketEmail } = useEmailAPI();
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!isOpen || !reserva) {
      return;
    }

    setReservaDetalle(reserva);

    let cancelled = false;

    const cargarPagosReserva = async () => {
      setIsLoadingPagosReserva(true);
      const result = await obtenerPagosReservaConReembolsos(reserva.id);
      if (!cancelled) {
        if (result.success && result.pagos) {
          setPagosReserva(result.pagos);
        } else {
          setPagosReserva([]);
        }
        setIsLoadingPagosReserva(false);
      }
    };

    cargarPagosReserva();

    return () => {
      cancelled = true;
    };
  }, [isOpen, obtenerPagosReservaConReembolsos, reserva]);

  const resumenPagos = useMemo(() => {
    const totalCobrado = pagosReserva
      .filter((pago) => pago.estado === 'completado')
      .reduce((total, pago) => total + pago.importe, 0);
    const totalReembolsado = pagosReserva.reduce((total, pago) => total + pago.importe_reembolsado, 0);
    const totalReembolsable = pagosReserva.reduce((total, pago) => total + pago.importe_reembolsable, 0);
    const pagosPendientes = pagosReserva.filter((pago) => pago.estado === 'pendiente');

    return {
      totalCobrado,
      totalReembolsado,
      totalReembolsable,
      pagosPendientes,
      pagosCompletados: pagosReserva.filter((pago) => pago.estado === 'completado')
    };
  }, [pagosReserva]);
  const showRefundReadModel = reserva?.estado === 'cancelada';

  const refundValidation = useMemo(() => {
    const errores: Record<string, string> = {};
    let total = 0;

    for (const pago of resumenPagos.pagosCompletados) {
      const rawValue = refundInputs[pago.id];
      if (rawValue === undefined || rawValue.trim() === '') {
        continue;
      }

      const importe = Number(rawValue);
      if (!Number.isFinite(importe)) {
        errores[pago.id] = 'Introduce un importe valido.';
        continue;
      }

      if (importe < 0) {
        errores[pago.id] = 'El importe no puede ser negativo.';
        continue;
      }

      if (importe > pago.importe_reembolsable) {
        errores[pago.id] = `Maximo ${formatearImporte(pago.importe_reembolsable)}.`;
        continue;
      }

      total += importe;
    }

    return {
      errores,
      total: Number(total.toFixed(2))
    };
  }, [refundInputs, resumenPagos.pagosCompletados]);

  const reservaEstado = reserva?.estado;
  const canOpenRefundFlow = resumenPagos.pagosCompletados.length > 0 || resumenPagos.pagosPendientes.length > 0 || reservaEstado !== 'cancelada';
  const hasRefundableBalance = resumenPagos.totalReembolsable > 0;
  const canRegisterRefundOnCancelled = reservaEstado === 'cancelada' && hasRefundableBalance;
  const hasValidationErrors = Object.keys(refundValidation.errores).length > 0;
  const reservaVisible = reservaDetalle ?? reserva;
  const reservaItems = reservaVisible?.items;
  const sortedItems = useMemo(
    () => [...(reservaItems ?? [])].sort((left, right) => new Date(left.inicio).getTime() - new Date(right.inicio).getTime()),
    [reservaItems]
  );

  const handleEliminarTramo = async (itemId: string, inicio: string) => {
    if (!reservaVisible || !isFutureTramoDay(inicio) || itemDeletingId) {
      return;
    }

    setTramoAEliminar({ id: itemId, inicio });
    setShowDeleteTramoModal(true);
  };

  const confirmarEliminacionTramo = async () => {
    if (!reservaVisible || !tramoAEliminar) {
      return;
    }

    try {
      setItemDeletingId(tramoAEliminar.id);
      const result = await eliminarTramoReservaCurso(reservaVisible.id, tramoAEliminar.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success('Tramo eliminado correctamente');
      const refreshed = await obtenerReservaPorId(reservaVisible.id);
      if (refreshed.success && refreshed.reserva) {
        setReservaDetalle(refreshed.reserva);
      }
      await Promise.resolve(onReservaActualizada());
    } finally {
      setItemDeletingId(null);
      setTramoAEliminar(null);
      setShowDeleteTramoModal(false);
    }
  };

  if (!isOpen || !reserva) return null;

  const obtenerEmailCliente = async (clienteId: string): Promise<string | null> => {
    if (!clienteId || clienteId.trim() === '') {
      return null;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clienteId)) {
      return null;
    }

    try {
      const { data, error } = await supabase.from('cliente').select('email').eq('id', clienteId).single();

      if (error) {
        console.error('Error obteniendo email del cliente:', error);
        return null;
      }

      return data?.email || null;
    } catch (error) {
      console.error('Error obteniendo email del cliente:', error);
      return null;
    }
  };

  const mostrarCliente = () => {
    if (!reservaVisible?.cliente) return 'Cliente no establecido';
    return `${reservaVisible.cliente.nombre} ${reservaVisible.cliente.apellidos}`;
  };

  const mostrarActividad = () => reservaVisible?.actividad?.nombre || 'Actividad no encontrada';
  const mostrarEmpresa = () => reservaVisible?.empresa?.nombre || 'Empresa no establecida';
  const cantidadDetalle = getCantidadDetalle(reservaVisible ?? reserva);
  const campamentoMetadata = getCampamentoMetadata(reservaVisible?.metadata);
  const showAssignmentProgress = (reservaVisible?.estado_asignacion_tramos ?? 'no_aplica') !== 'no_aplica';
  const assignmentStateLabel = getEstadoAsignacionTramosLabel(reservaVisible?.estado_asignacion_tramos);
  const multiTramoFechaLabel = sortedItems.length > 1
    ? (() => {
        const inicio = formatearFecha(reservaVisible?.fecha_inicio ?? reserva.fecha_inicio);
        const fin = formatearFecha(reservaVisible?.fecha_fin ?? reserva.fecha_fin);
        return inicio === fin ? inicio : `${inicio} - ${fin}`;
      })()
    : null;
  const fechaReservaLabel = campamentoMetadata
    ? buildCampamentoDateRangeLabel(campamentoMetadata)
    : showAssignmentProgress && sortedItems.length === 0
      ? 'Pendiente de planificar'
      : multiTramoFechaLabel ?? formatearFecha(reservaVisible?.fecha_inicio ?? reserva.fecha_inicio);
  const horarioReservaLabel = campamentoMetadata
    ? buildCampamentoHorarioSummary(campamentoMetadata)
    : showAssignmentProgress && sortedItems.length === 0
      ? 'Sin tramos'
      : sortedItems.length > 1
      ? `${sortedItems.length} tramos`
      : `${formatearHora(reservaVisible?.fecha_inicio ?? reserva.fecha_inicio)} - ${formatearHora(reservaVisible?.fecha_fin ?? reserva.fecha_fin)}`;

  const refreshResumenPagos = async () => {
    if (!reserva) return;
    setIsLoadingPagosReserva(true);
    const result = await obtenerPagosReservaConReembolsos(reserva.id);
    if (result.success && result.pagos) {
      setPagosReserva(result.pagos);
    }
    setIsLoadingPagosReserva(false);
    return result;
  };

  const handleConfirmarPago = async () => {
    try {
      setIsLoadingPago(true);

      const resultadoTodos = await obtenerTodosLosPagosReserva(reserva.id);

      if (!resultadoTodos.success || !resultadoTodos.pagos) {
        toast.error('Error al obtener información de pagos');
        return;
      }

      if (resultadoTodos.pagos.length <= 1) {
        if (resultadoTodos.pagos.length === 1) {
          const pagoUnico = resultadoTodos.pagos[0];
          const resultadoActualizacion = await actualizarEstadoPago(pagoUnico.id, 'completado');

          if (!resultadoActualizacion.success) {
            toast.error('Error al actualizar el estado del pago');
            return;
          }
        }

        if (!reserva.ticket_url_reserva && reserva.ticket_url) {
          const clienteEmail = await obtenerEmailCliente(reserva.id_cliente || '');

          if (clienteEmail) {
            try {
              const ticketData = {
                cartItems: [{
                  id: 'reserva-actividad',
                  name: reserva.actividad?.nombre || 'Actividad',
                  price: reserva.precio,
                  quantity: reserva.cantidad_reservada,
                  image: ''
                }],
                subtotal: reserva.precio,
                descuento: 0,
                discountPercentage: 0,
                iva: 0,
                total: reserva.precio,
                metodoPago: 'efectivo',
                fecha: new Date(reserva.fecha_inicio),
                pedidoId: undefined,
                clienteId: clienteEmail,
                estadoPago: 'completado' as const
              };

              const emailResult = await sendTicketEmail(
                {
                  id: clienteEmail,
                  nombre: reserva.cliente?.nombre || 'Cliente',
                  apellidos: reserva.cliente?.apellidos || '',
                  email: clienteEmail
                },
                ticketData,
                reserva.ticket_url,
                'completado'
              );

              if (emailResult.success && !emailResult.skipped) {
                toast.success('Reserva confirmada y ticket enviado por correo al cliente');
              } else if (emailResult.success) {
                toast.success(emailResult.message || 'Reserva confirmada correctamente');
              } else {
                toast.success('Reserva confirmada, pero hubo un error al enviar el correo');
              }
            } catch (emailError) {
              console.error('Error enviando email:', emailError);
              toast.success('Reserva confirmada, pero hubo un error al enviar el correo');
            }
          } else {
            toast.success('Reserva confirmada correctamente');
          }
        } else {
          toast.success('Reserva confirmada correctamente');
        }

        await Promise.resolve(onActualizarEstado(reserva, 'confirmada'));
        return;
      }

      const resultadoPendientes = await obtenerPagosPendientesReserva(reserva.id);

      if (!resultadoPendientes.success || !resultadoPendientes.pagos || resultadoPendientes.pagos.length === 0) {
        toast.error('No se encontraron pagos pendientes para esta reserva');
        return;
      }

      const pago = resultadoPendientes.pagos[0];
      setPagoPendiente({
        id: pago.id,
        concepto: pago.concepto,
        importe: pago.importe,
        metodo: pago.metodo,
        id_cliente: pago.cliente?.id || ''
      });
      setShowTicketModal(true);
    } catch (error) {
      console.error('Error al buscar pagos:', error);
      toast.error('Error al buscar información de pagos');
    } finally {
      setIsLoadingPago(false);
    }
  };

  const handleGuardarTicket = async () => {
    if (!pagoPendiente) return;

    setIsSavingTicket(true);
    try {
      const ticketData = {
        cartItems: [{
          id: 'pago-pendiente',
          name: pagoPendiente.concepto,
          price: pagoPendiente.importe,
          quantity: 1,
          image: ''
        }],
        subtotal: pagoPendiente.importe,
        descuento: 0,
        discountPercentage: 0,
        iva: 0,
        total: pagoPendiente.importe,
        metodoPago: pagoPendiente.metodo,
        fecha: new Date(),
        pedidoId: undefined,
        clienteId: pagoPendiente.id_cliente,
        estadoPago: 'pendiente' as const
      };

      const result = await saveTicket(ticketData);

      if (result.success && result.url) {
        const updateReservaResult = await actualizarTicketUrlReserva(reserva.id, result.url);
        const updatePagoResult = await actualizarEstadoPago(pagoPendiente.id, 'completado');

        if (updateReservaResult.success && updatePagoResult.success) {
          const clienteEmail = await obtenerEmailCliente(pagoPendiente.id_cliente);

          if (clienteEmail) {
            try {
              const emailResult = await sendTicketEmail(
                {
                  id: clienteEmail,
                  nombre: reserva.cliente?.nombre || 'Cliente',
                  apellidos: reserva.cliente?.apellidos || '',
                  email: clienteEmail
                },
                ticketData,
                result.url,
                'completado'
              );

              if (emailResult.success && !emailResult.skipped) {
                toast.success('Ticket de pago pendiente generado y enviado por correo al cliente');
              } else if (emailResult.success) {
                toast.success(emailResult.message || 'Ticket de pago pendiente generado correctamente');
              } else {
                toast.success('Ticket de pago pendiente generado, pero hubo un error al enviar el correo');
              }
            } catch (emailError) {
              console.error('Error enviando email:', emailError);
              toast.success('Ticket de pago pendiente generado, pero hubo un error al enviar el correo');
            }
          } else {
            toast.success('Ticket de pago pendiente generado correctamente');
          }

          await Promise.resolve(onActualizarEstado(reserva, 'confirmada'));
          setShowTicketModal(false);
          setPagoPendiente(null);
          onClose();
        } else {
          toast.error('Error al actualizar la reserva o el pago');
        }
      } else {
        toast.error(`Error al generar el ticket: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al guardar el ticket:', error);
      toast.error('Error al guardar el ticket');
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleOpenCancelFlow = async () => {
    const result = await refreshResumenPagos();
    if (result && !result.success) {
      toast.error(result.message);
      return;
    }

    setRefundInputs(buildInitialRefundInputs(result?.pagos ?? pagosReserva));
    setCancelComment('');
    setShowCancelModal(true);
  };

  const handleConfirmCancelFlow = async () => {
    if (hasValidationErrors) {
      toast.error('Revisa los importes del reembolso antes de continuar.');
      return;
    }

    if (reserva.estado === 'cancelada' && refundValidation.total <= 0) {
      toast.error('Introduce al menos un importe a reembolsar.');
      return;
    }

    const reembolsos = resumenPagos.pagosCompletados
      .map((pago) => ({
        pagoId: pago.id,
        importe: Number(refundInputs[pago.id] ?? 0)
      }))
      .filter((reembolso) => Number.isFinite(reembolso.importe) && reembolso.importe > 0);

    try {
      setIsSubmittingCancel(true);

      const result = await cancelarReservaConReembolsos({
        reservaId: reserva.id,
        reembolsos,
        comentario: cancelComment.trim() || undefined,
        cancelarPendientes: true
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const totalReembolsado = result.data?.totalReembolsado ?? 0;
      const pagosPendientesCancelados = result.data?.pagosPendientesCancelados ?? 0;
      const baseMessage =
        totalReembolsado > 0
          ? `Reserva cancelada y reembolso registrado por ${formatearImporte(totalReembolsado)}.`
          : 'Reserva cancelada sin reembolso.';
      const detailMessage =
        pagosPendientesCancelados > 0 ? ` ${pagosPendientesCancelados} pago(s) pendiente(s) anulados.` : '';

      toast.success(`${baseMessage}${detailMessage}`);
      await Promise.resolve(onReservaActualizada());
      setShowCancelModal(false);
      onClose();
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
      toast.error('Error al cancelar la reserva');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const cancelActionLabel =
    reserva.estado === 'cancelada'
      ? `Registrar reembolso de ${formatearImporte(refundValidation.total)}`
      : refundValidation.total > 0
        ? `Cancelar reserva y reembolsar ${formatearImporte(refundValidation.total)}`
        : 'Cancelar reserva sin reembolso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl">
        <div className="primary-gradient flex items-center justify-between rounded-t-2xl p-5 text-white">
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">Detalles de la reserva</h2>
          <button
            type="button"
            className="cursor-pointer rounded-md text-white transition hover:text-gray-200"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar</span>
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Cliente</label>
                <p className="mt-1 font-semibold text-on-surface">{mostrarCliente()}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Estado</label>
                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoColor(reserva.estado)}`}>
                  {formatearEstado(reserva.estado)}
                </span>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Actividad</label>
                <p className="mt-1 font-medium text-on-surface">{mostrarActividad()}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Empresa</label>
                <p className="mt-1 font-medium text-on-surface">{mostrarEmpresa()}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">{campamentoMetadata ? 'Rango' : 'Fecha'}</label>
                <p className="mt-1 font-medium text-on-surface">{fechaReservaLabel}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Horario</label>
                <p className="mt-1 font-medium text-on-surface">{horarioReservaLabel}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">{cantidadDetalle.primaryLabel}</label>
                <p className="mt-1 font-medium text-on-surface">{cantidadDetalle.primaryValue}</p>
              </div>
              {cantidadDetalle.secondaryLabel && cantidadDetalle.secondaryValue ? (
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">{cantidadDetalle.secondaryLabel}</label>
                  <p className="mt-1 font-medium text-on-surface">{cantidadDetalle.secondaryValue}</p>
                </div>
              ) : null}
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Precio</label>
                <p className="mt-1 font-bold text-on-surface">{formatearImporte(reserva.precio)}</p>
              </div>
            </div>

            {showAssignmentProgress ? (
              <section className="space-y-4 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">Asignación de horas</h3>
                    <p className="text-sm text-on-surface-variant">Control operativo de las horas ya planificadas para este curso.</p>
                  </div>
                  {assignmentStateLabel ? (
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoAsignacionTramosColor(reservaVisible?.estado_asignacion_tramos)}`}>
                      {assignmentStateLabel}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Total</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">{formatearDuracionMinutos(reservaVisible?.duracion_total_min ?? 0)}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Asignadas</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">{formatearDuracionMinutos(reservaVisible?.duracion_asignada_min ?? 0)}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Restantes</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">{formatearDuracionMinutos(reservaVisible?.duracion_restante_min ?? 0)}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {reserva.nota ? (
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Notas</label>
                <p className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3 text-sm text-on-surface-variant">{reserva.nota}</p>
              </div>
            ) : null}

            {showAssignmentProgress || sortedItems.length > 1 ? (
              <section className="space-y-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">{showAssignmentProgress ? 'Tramos asignados' : 'Tramos de la reserva'}</h3>
                    <p className="text-sm text-on-surface-variant">
                      {showAssignmentProgress
                        ? 'Estos son los horarios ya asignados a la reserva.'
                        : 'Esta reserva agrupa varios horarios independientes.'}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                    {sortedItems.length} tramos
                  </span>
                </div>

                {sortedItems.length > 0 ? (
                  <div className="space-y-2">
                    {sortedItems.map((item, index) => (
                      <div key={item.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-on-surface">Tramo {index + 1}</p>
                            <p className="text-sm text-on-surface-variant">
                              {formatearFecha(item.inicio)} · {formatearHora(item.inicio)} - {formatearHora(item.fin)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-on-surface-variant">
                              Duración: {formatearDuracionMinutos(calculateReservaItemDurationMinutes(item.inicio, item.fin))}
                            </p>
                          </div>
                          {showAssignmentProgress && isFutureTramoDay(item.inicio) ? (
                            <button
                              type="button"
                              onClick={() => handleEliminarTramo(item.id, item.inicio)}
                              disabled={itemDeletingId === item.id}
                              className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            >
                              {itemDeletingId === item.id ? 'Eliminando...' : 'Eliminar tramo'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-lowest px-4 py-6 text-sm text-on-surface-variant">
                    Esta reserva todavía no tiene ningún tramo asignado.
                  </div>
                )}
              </section>
            ) : null}

            <section className="space-y-4 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Pagos vinculados</h3>
                  <p className="text-sm text-on-surface-variant">Cobros, pendientes y devoluciones registradas para esta reserva.</p>
                </div>
                {isLoadingPagosReserva ? <span className="text-sm text-on-surface-variant">Cargando...</span> : null}
              </div>

              <div className={`grid grid-cols-1 gap-3 ${showRefundReadModel ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Cobrado</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalCobrado)}</p>
                </div>
                {showRefundReadModel ? (
                  <>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Reembolsado</p>
                      <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalReembolsado)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Saldo reembolsable</p>
                      <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalReembolsable)}</p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Completados</p>
                    <p className="mt-1 text-lg font-bold text-on-surface">{resumenPagos.pagosCompletados.length}</p>
                  </div>
                )}
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Pendientes</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{resumenPagos.pagosPendientes.length}</p>
                </div>
              </div>

              {pagosReserva.length > 0 ? (
                <div className="space-y-3">
                  {pagosReserva.map((pago) => (
                    <div key={pago.id} className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-on-surface">{pago.concepto}</p>
                          <p className="text-sm text-on-surface-variant">{formatearMetodoPago(pago.metodo)} · {formatearFecha(pago.created_at || reserva.fecha_inicio)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoPagoColor(pago.estado)}`}>
                            {formatearEstado(pago.estado)}
                          </span>
                          {showRefundReadModel ? (
                            <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoReembolsoColor(pago.estado_reembolso)}`}>
                              {getEstadoReembolsoLabel(pago.estado_reembolso)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={`mt-3 grid grid-cols-1 gap-3 ${showRefundReadModel ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Importe cobrado</p>
                          <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe)}</p>
                        </div>
                        {showRefundReadModel ? (
                          <>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Ya reembolsado</p>
                              <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe_reembolsado)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Pendiente de devolver</p>
                              <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe_reembolsable)}</p>
                            </div>
                          </>
                        ) : (
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Estado del cobro</p>
                            <p className="mt-1 font-semibold text-on-surface">{formatearEstado(pago.estado)}</p>
                          </div>
                        )}
                      </div>

                      {showRefundReadModel && pago.reembolsos.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Reembolsos registrados</p>
                          <div className="mt-2 space-y-2">
                            {pago.reembolsos.map((reembolso) => (
                              <div key={reembolso.id} className="flex items-center justify-between gap-3 text-sm">
                                <span className="text-on-surface-variant">{formatearFecha(reembolso.fecha_operacion)} · {formatearMetodoPago(reembolso.metodo)}</span>
                                <span className="font-semibold text-on-surface">{formatearImporte(reembolso.importe)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : !isLoadingPagosReserva ? (
                <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                  No hay pagos vinculados a esta reserva.
                </div>
              ) : null}
            </section>

            <div className="mt-2 flex flex-wrap gap-2 border-t border-outline-variant/25 pt-4">
              {reserva.estado !== 'confirmada' ? (
                <button
                  type="button"
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  onClick={handleConfirmarPago}
                  disabled={isLoadingPago}
                >
                  {isLoadingPago ? 'Buscando pagos...' : 'Confirmar pago'}
                </button>
              ) : null}

              {reserva.estado !== 'cancelada' ? (
                <button
                  type="button"
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  onClick={handleOpenCancelFlow}
                  disabled={!canOpenRefundFlow || isLoadingPagosReserva}
                >
                  Cancelar
                </button>
              ) : canRegisterRefundOnCancelled ? (
                <button
                  type="button"
                  className="flex-1 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  onClick={handleOpenCancelFlow}
                  disabled={isLoadingPagosReserva}
                >
                  Registrar reembolso
                </button>
              ) : null}

              <Button
                variant="outline"
                className="flex-1 rounded-full border-outline-variant/45 bg-surface-container-low py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-2xl">
            <div className="primary-gradient flex items-center justify-between rounded-t-2xl p-5 text-white">
              <div>
                <h3 className="font-headline text-xl font-extrabold tracking-tight">
                  {reserva.estado === 'cancelada' ? 'Registrar reembolso' : 'Cancelar reserva'}
                </h3>
                <p className="mt-1 text-sm text-white/80">{mostrarActividad()} · {mostrarCliente()}</p>
              </div>
              <button
                type="button"
                className="rounded-md text-white transition hover:text-gray-200"
                onClick={() => setShowCancelModal(false)}
              >
                <span className="sr-only">Cerrar modal de cancelacion</span>
                ✕
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                {reserva.estado === 'cancelada'
                  ? 'La reserva ya esta cancelada. Puedes registrar un reembolso adicional siempre que siga quedando saldo pendiente de devolver.'
                  : 'Puedes cancelar la reserva sin devolver importe, o registrar un reembolso total/parcial de los pagos ya cobrados. Los pagos pendientes se anularan automaticamente.'}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Cobrado</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalCobrado)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Ya devuelto</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalReembolsado)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Saldo a devolver</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{formatearImporte(resumenPagos.totalReembolsable)}</p>
                </div>
                <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Pendientes a anular</p>
                  <p className="mt-1 text-lg font-bold text-on-surface">{resumenPagos.pagosPendientes.length}</p>
                </div>
              </div>

              {resumenPagos.pagosCompletados.length > 0 ? (
                <div className="space-y-3">
                  {resumenPagos.pagosCompletados.map((pago) => (
                    <div key={pago.id} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-on-surface">{pago.concepto}</p>
                          <p className="text-sm text-on-surface-variant">{formatearMetodoPago(pago.metodo)}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoReembolsoColor(pago.estado_reembolso)}`}>
                          {getEstadoReembolsoLabel(pago.estado_reembolso)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Cobrado</p>
                          <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Ya reembolsado</p>
                          <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe_reembolsado)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Maximo disponible</p>
                          <p className="mt-1 font-semibold text-on-surface">{formatearImporte(pago.importe_reembolsable)}</p>
                        </div>
                        <label className="block text-sm text-on-surface">
                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-outline">Reembolsar ahora</span>
                          <input
                            type="number"
                            min="0"
                            max={pago.importe_reembolsable}
                            step="0.01"
                            value={refundInputs[pago.id] ?? ''}
                            onChange={(event) => setRefundInputs((prev) => ({ ...prev, [pago.id]: event.target.value }))}
                            className="mt-1 h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                            disabled={isSubmittingCancel || pago.importe_reembolsable <= 0}
                          />
                          {refundValidation.errores[pago.id] ? (
                            <p className="mt-1 text-xs text-red-600">{refundValidation.errores[pago.id]}</p>
                          ) : null}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  No hay pagos completados para reembolsar.
                </div>
              )}

              <label className="block text-sm text-on-surface">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">Comentario interno</span>
                <textarea
                  rows={3}
                  value={cancelComment}
                  onChange={(event) => setCancelComment(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  placeholder="Motivo de la cancelacion o del reembolso"
                  disabled={isSubmittingCancel}
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/25 pt-5 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isSubmittingCancel}
                  className="rounded-full border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                >
                  Volver
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmCancelFlow}
                  disabled={isSubmittingCancel || hasValidationErrors || (reserva.estado === 'cancelada' && refundValidation.total <= 0)}
                  className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Procesando...' : cancelActionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ModalConfirmacion
        isOpen={showDeleteTramoModal}
        onClose={() => {
          setShowDeleteTramoModal(false);
          setTramoAEliminar(null);
        }}
        onConfirm={confirmarEliminacionTramo}
        titulo="Eliminar tramo"
        mensaje={`Vas a eliminar un tramo futuro de la reserva${tramoAEliminar ? ` (${formatearFecha(tramoAEliminar.inicio)} · ${formatearHora(tramoAEliminar.inicio)})` : ''}. Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar tramo"
        textoCancelar="Cancelar"
        variante="actividades-v2"
      />

      {showTicketModal && pagoPendiente ? (
        <TicketCompra
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setPagoPendiente(null);
          }}
          onGuardar={handleGuardarTicket}
          cartItems={[{
            id: 'pago-pendiente',
            name: pagoPendiente.concepto,
            price: pagoPendiente.importe,
            quantity: 1,
            image: ''
          }]}
          subtotal={pagoPendiente.importe}
          descuento={0}
          discountPercentage={0}
          iva={0}
          total={pagoPendiente.importe}
          metodoPago={pagoPendiente.metodo}
          fecha={new Date()}
          pedidoId={undefined}
          clienteId={pagoPendiente.id_cliente}
          estadoPago="pendiente"
          isSaving={isSavingTicket}
        />
      ) : null}
    </div>
  );
}
