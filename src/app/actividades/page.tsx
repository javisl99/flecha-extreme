'use client';

import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Toast } from '@/shared/components';
import { useActividades, type Reserva } from '@/hooks/useActividades';
import FiltrosReservas, { type FiltrosReservaState } from '@/components/Actividades/FiltrosReservas';
import ModalNuevaReserva from '@/components/Actividades/ModalNuevaReserva';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import VistaCalendario from '@/components/Actividades/VistaCalendario';
import ModalDetalleReserva from '@/components/Actividades/ModalDetalleReserva';
import ModalDetalleCampamentoPrograma from '@/components/Actividades/ModalDetalleCampamentoPrograma';
import ModalSeleccionTicket from '@/components/Actividades/ModalSeleccionTicket';
import ModalPendientesTramosCurso from '@/components/Actividades/ModalPendientesTramosCurso';
import PaginationControls from '@/components/shared/PaginationControls';
import {
  buildCampamentoDateRangeLabel,
  buildCampamentoHorarioSummary,
  buildCampamentoProgramaMetadata,
  getCampamentoMetadata,
  type ReservaServicioItemMetadata
} from '@/lib/campamento';

const RESERVAS_POR_PAGINA = 10;

// Icono para nueva reserva
const NewReservationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const PendingReservationIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LoadingSkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-surface-container-high ${className}`}>
    <div className="actividades-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

const LoadingSkeletonPill = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-full bg-surface-container-high ${className}`}>
    <div className="actividades-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

function formatearDuracionMinutos(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return '0 min';
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

function getEstadoAsignacionLabel(reserva: Reserva) {
  switch (reserva.estado_asignacion_tramos) {
    case 'pendiente':
      return 'Pendiente de asignar';
    case 'parcial':
      return 'Asignación parcial';
    case 'completa':
      return 'Horas completas';
    default:
      return null;
  }
}

function getEstadoAsignacionColor(reserva: Reserva) {
  switch (reserva.estado_asignacion_tramos) {
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

function isReservaPendienteTramos(reserva: Reserva) {
  return reserva.kind !== 'campamento_programa' && ['pendiente', 'parcial'].includes(reserva.estado_asignacion_tramos ?? 'no_aplica');
}

export default function ReservasPage() {
  const [filtros, setFiltros] = useState<FiltrosReservaState>({
    cliente: '',
    actividad: '',
    estado: '',
    empresa: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [programaSeleccionadoId, setProgramaSeleccionadoId] = useState<string | null>(null);
  const [programaParaInscripcion, setProgramaParaInscripcion] = useState<Reserva['campamento_programa'] | null>(null);
  const [reservaAEliminar, setReservaAEliminar] = useState<Reserva | null>(null);
  const [showModalReserva, setShowModalReserva] = useState(false);
  const [showModalPendientes, setShowModalPendientes] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [showModalSeleccionTicket, setShowModalSeleccionTicket] = useState(false);
  const [reservaParaTicket, setReservaParaTicket] = useState<Reserva | null>(null);
  const [showInitialLoadingScreen, setShowInitialLoadingScreen] = useState(true);
  const [paginaReservas, setPaginaReservas] = useState(1);
  const initialLoadingTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const { 
    error, 
    obtenerReservas, 
    actualizarReserva, 
    eliminarReserva 
  } = useActividades();
  
  const cargarReservas = useCallback(async () => {
    try {
      const resultado = await obtenerReservas();
      if (resultado.success && resultado.reservas) {
        setReservas(resultado.reservas);
      } else {
        setToast({ visible: true, message: resultado.message, type: 'error' });
      }
    } catch (error: unknown) {
      console.error('Error al cargar reservas:', error);
      setToast({ visible: true, message: 'Error al cargar las reservas', type: 'error' });
    }
  }, [obtenerReservas]);

  // Cargar reservas al montar el componente
  useEffect(() => {
    let mounted = true;
    const MIN_LOADING_MS = 900;
    const startedAt = Date.now();

    void (async () => {
      await cargarReservas();

      if (!mounted) {
        return;
      }

      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(MIN_LOADING_MS - elapsed, 0);

      if (initialLoadingTimerRef.current !== null) {
        window.clearTimeout(initialLoadingTimerRef.current);
        initialLoadingTimerRef.current = null;
      }

      initialLoadingTimerRef.current = window.setTimeout(() => {
        if (!mounted) return;
        setShowInitialLoadingScreen(false);
        initialLoadingTimerRef.current = null;
      }, remaining);
    })();

    return () => {
      mounted = false;
      if (initialLoadingTimerRef.current !== null) {
        window.clearTimeout(initialLoadingTimerRef.current);
        initialLoadingTimerRef.current = null;
      }
    };
  }, [cargarReservas]);
  
  // Filtrar reservas
  const reservasFiltradas = useMemo(() => {
    return reservas.filter(reserva => {
      const cumpleCliente = !filtros.cliente || (
        reserva.cliente ?
        `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`.toLowerCase().includes(filtros.cliente.toLowerCase()) :
        'Cliente no establecido'.toLowerCase().includes(filtros.cliente.toLowerCase())
      );
      const cumpleActividad = !filtros.actividad || (
        reserva.actividad ?
        reserva.actividad.nombre.toLowerCase().includes(filtros.actividad.toLowerCase()) :
        'Actividad no encontrada'.toLowerCase().includes(filtros.actividad.toLowerCase())
      );
      const cumpleEstado = !filtros.estado || reserva.estado === filtros.estado;
      const cumpleEmpresa = !filtros.empresa || (
        reserva.empresa ?
        reserva.empresa.nombre === filtros.empresa :
        false
      );
      // Filtros de fecha
      let cumpleFechaDesde = true;
      let cumpleFechaHasta = true;

      if (filtros.fechaDesde) {
        const fechaInicio = new Date(reserva.fecha_inicio);
        const fechaDesde = new Date(filtros.fechaDesde);
        cumpleFechaDesde = fechaInicio >= fechaDesde;
      }

      if (filtros.fechaHasta) {
        const fechaInicio = new Date(reserva.fecha_inicio);
        const fechaHasta = new Date(filtros.fechaHasta);
        cumpleFechaHasta = fechaInicio <= fechaHasta;
      }

      return cumpleCliente && cumpleActividad && cumpleEstado && cumpleEmpresa && cumpleFechaDesde && cumpleFechaHasta;
    });
  }, [filtros, reservas]);
  const reservasPendientesTramos = reservas.filter(isReservaPendienteTramos);
  const totalPaginasReservas = Math.max(1, Math.ceil(reservasFiltradas.length / RESERVAS_POR_PAGINA));
  const paginaReservasActiva = Math.min(paginaReservas, totalPaginasReservas);
  const reservasPaginadas = useMemo(() => {
    const inicio = (paginaReservasActiva - 1) * RESERVAS_POR_PAGINA;
    return reservasFiltradas.slice(inicio, inicio + RESERVAS_POR_PAGINA);
  }, [paginaReservasActiva, reservasFiltradas]);

  useEffect(() => {
    setPaginaReservas(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaReservas((paginaActual) => Math.min(paginaActual, totalPaginasReservas));
  }, [totalPaginasReservas]);

  const ReservaTablaSkeleton = () => (
    <tr className="border-b border-outline-variant/10 bg-white">
      <td className="px-6 py-4">
        <LoadingSkeletonBlock className="h-4 w-full rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <LoadingSkeletonBlock className="h-4 w-5/6 rounded-full" />
          <LoadingSkeletonPill className="h-5 w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <LoadingSkeletonBlock className="h-4 w-4/5 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <LoadingSkeletonBlock className="mx-auto h-4 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <LoadingSkeletonBlock className="mx-auto h-4 w-24 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <LoadingSkeletonBlock className="mx-auto h-4 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <LoadingSkeletonPill className="mx-auto h-6 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-end gap-2">
          <LoadingSkeletonPill className="h-8 w-8" />
          <LoadingSkeletonPill className="h-8 w-8" />
          <LoadingSkeletonPill className="h-8 w-8" />
        </div>
      </td>
    </tr>
  );

  const ReservaTarjetaSkeleton = () => (
    <div className="rounded-[1.25rem] border border-outline-variant/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <LoadingSkeletonBlock className="h-4 w-4/5 rounded-full" />
          <LoadingSkeletonBlock className="h-3 w-3/5 rounded-full" />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <LoadingSkeletonPill className="h-5 w-20" />
            <LoadingSkeletonPill className="h-5 w-24" />
          </div>
        </div>
        <LoadingSkeletonPill className="h-6 w-16" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <LoadingSkeletonBlock className="h-10 rounded-xl" />
        <LoadingSkeletonBlock className="h-10 rounded-xl" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <LoadingSkeletonPill className="h-8 w-8" />
        <LoadingSkeletonPill className="h-8 w-8" />
        <LoadingSkeletonPill className="h-8 w-8" />
      </div>
    </div>
  );

  const formatearEstado = (estado: string) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const getEstadoVisualReserva = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa') {
      return reserva.estado;
    }

    if (reserva.estado !== 'confirmada') {
      return reserva.estado;
    }

    return new Date(reserva.fecha_fin).getTime() < new Date().getTime() ? 'completada' : reserva.estado;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-100 text-green-700';
      case 'pendiente': return 'bg-amber-100 text-amber-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      case 'completada': return 'bg-blue-100 text-blue-700';
      default: return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const formatearFecha = (fecha: string) => {
    // La fecha viene en UTC desde la base de datos, convertir a zona horaria local
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Madrid' // Especificar zona horaria local
    });
  };

  const formatearHora = (fecha: string) => {
    // La hora viene en UTC desde la base de datos, convertir a zona horaria local
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid' // Especificar zona horaria local
    });
  };

  const mostrarCliente = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa') {
      return 'Programa de campamento';
    }
    if (!reserva.cliente) return 'Cliente no establecido';
    return `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`;
  };

  const mostrarActividad = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa' && reserva.campamento_programa) {
      const turno = reserva.campamento_programa.turno_label || reserva.campamento_programa.turno_codigo;
      return turno ? `${reserva.campamento_programa.servicio_nombre} · ${turno}` : reserva.campamento_programa.servicio_nombre;
    }
    if (!reserva.actividad) return 'Actividad no encontrada';
    return reserva.actividad.nombre;
  };

  const mostrarEmpresa = (reserva: Reserva) => {
    if (!reserva.empresa) return 'Empresa no establecida';
    return reserva.empresa.nombre;
  };

  const formatearFechaReserva = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa' && reserva.campamento_programa) {
      return buildCampamentoDateRangeLabel(buildCampamentoProgramaMetadata(reserva.campamento_programa));
    }

    const campamentoMetadata = getCampamentoMetadata(reserva.metadata);
    if (campamentoMetadata) {
      return buildCampamentoDateRangeLabel(campamentoMetadata);
    }

    if ((reserva.estado_asignacion_tramos ?? 'no_aplica') !== 'no_aplica' && (reserva.numero_tramos ?? 0) === 0) {
      return 'Pendiente de planificar';
    }

    if ((reserva.numero_tramos ?? 0) > 1) {
      const inicio = formatearFecha(reserva.fecha_inicio);
      const fin = formatearFecha(reserva.fecha_fin);
      return inicio === fin ? inicio : `${inicio} - ${fin}`;
    }

    return formatearFecha(reserva.fecha_inicio);
  };

  const formatearHorarioReserva = (reserva: Reserva) => {
    if ((reserva.estado_asignacion_tramos ?? 'no_aplica') !== 'no_aplica' && (reserva.numero_tramos ?? 0) === 0) {
      return 'Sin tramos';
    }

    if ((reserva.numero_tramos ?? 0) > 1) {
      return `${reserva.numero_tramos} tramos`;
    }

    if (reserva.kind === 'campamento_programa' && reserva.campamento_programa) {
      return buildCampamentoHorarioSummary(buildCampamentoProgramaMetadata(reserva.campamento_programa));
    }

    const campamentoMetadata = getCampamentoMetadata(reserva.metadata);
    if (campamentoMetadata) {
      return buildCampamentoHorarioSummary(campamentoMetadata);
    }

    return `${formatearHora(reserva.fecha_inicio)} - ${formatearHora(reserva.fecha_fin)}`;
  };

  const handleEliminarReserva = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa') {
      return;
    }
    setReservaAEliminar(reserva);
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!reservaAEliminar) return;
    
    try {
      const result = await eliminarReserva(reservaAEliminar.id);
      if (result.success) {
        setToast({ visible: true, message: 'Reserva eliminada correctamente', type: 'success' });
        setReservaAEliminar(null);
        setIsModalConfirmacionOpen(false);
        await cargarReservas();
      } else {
        setToast({ visible: true, message: 'Error al eliminar la reserva', type: 'error' });
      }
    } catch (error: unknown) {
      console.error('Error al eliminar reserva:', error);
      setToast({ visible: true, message: 'Error al eliminar la reserva', type: 'error' });
    }
  };

  const handleVerReserva = (reserva: Reserva) => {
    if (reserva.kind === 'campamento_programa') {
      setProgramaSeleccionadoId(reserva.id);
      return;
    }
    setReservaSeleccionada(reserva);
  };

  const handleFilaClick = (reserva: Reserva) => {
    handleVerReserva(reserva);
  };

  const handleDescargarTicket = async (reserva: Reserva, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Verificar si la reserva tiene ticket_url_reserva (ticket del pago de actividad)
    if (reserva.ticket_url_reserva) {
      // Si tiene ticket_url_reserva, mostrar modal de selección
      setReservaParaTicket(reserva);
      setShowModalSeleccionTicket(true);
      return;
    }
    
    // Si no tiene ticket_url_reserva pero sí tiene ticket_url, descargar directamente
    if (!reserva.ticket_url) {
      setToast({ visible: true, message: 'Esta reserva no tiene ticket disponible', type: 'error' });
      return;
    }

    try {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = reserva.ticket_url;
      link.download = `ticket_${reserva.id}_${new Date(reserva.fecha_inicio).toISOString().split('T')[0]}.pdf`;
      link.target = '_blank';
      
      // Añadir el enlace al DOM, hacer clic y removerlo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToast({ visible: true, message: 'Descargando ticket...', type: 'success' });
    } catch (error) {
      console.error('Error descargando ticket:', error);
      setToast({ visible: true, message: 'Error al descargar el ticket', type: 'error' });
    }
  };

  const handleActualizarEstado = async (reserva: Reserva, nuevoEstado: string) => {
    try {
      const result = await actualizarReserva(reserva.id, { estado: nuevoEstado as 'pendiente' | 'confirmada' | 'cancelada' });
      if (result.success) {
        // Recargar todas las reservas para obtener los datos completos incluyendo tickets
        await cargarReservas();
        setReservaSeleccionada(null);
        // Mostrar toast después de cerrar el modal
        setTimeout(() => {
          setToast({ visible: true, message: 'Estado de reserva actualizado correctamente', type: 'success' });
        }, 300);
      } else {
        setToast({ visible: true, message: 'Error al actualizar el estado de la reserva', type: 'error' });
      }
    } catch (error: unknown) {
      console.error('Error al actualizar estado:', error);
      setToast({ visible: true, message: 'Error al actualizar el estado de la reserva', type: 'error' });
    }
  };


  const handleNuevaReserva = () => {
    // Recargar las reservas después de crear una nueva
    setProgramaParaInscripcion(null);
    cargarReservas();
  };

  const handleToast = (toastData: { visible: boolean; message: string; type: 'success' | 'error' }) => {
    setToast(toastData);
  };

  const handleSeleccionarTicketReserva = async () => {
    if (!reservaParaTicket) return;
    
    try {
      // Descargar ticket de la reserva (ticket_url)
      const link = document.createElement('a');
      link.href = reservaParaTicket.ticket_url || '';
      link.download = `ticket_reserva_${reservaParaTicket.id}_${new Date(reservaParaTicket.fecha_inicio).toISOString().split('T')[0]}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToast({ visible: true, message: 'Descargando ticket de la reserva...', type: 'success' });
    } catch (error) {
      console.error('Error descargando ticket de reserva:', error);
      setToast({ visible: true, message: 'Error al descargar el ticket de la reserva', type: 'error' });
    } finally {
      setShowModalSeleccionTicket(false);
      setReservaParaTicket(null);
    }
  };

  const handleSeleccionarTicketPago = async () => {
    if (!reservaParaTicket) return;
    
    try {
      // Descargar ticket del pago de actividad (ticket_url_reserva)
      const link = document.createElement('a');
      link.href = reservaParaTicket.ticket_url_reserva || '';
      link.download = `ticket_pago_${reservaParaTicket.id}_${new Date(reservaParaTicket.fecha_inicio).toISOString().split('T')[0]}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToast({ visible: true, message: 'Descargando ticket del pago de actividad...', type: 'success' });
    } catch (error) {
      console.error('Error descargando ticket de pago:', error);
      setToast({ visible: true, message: 'Error al descargar el ticket del pago', type: 'error' });
    } finally {
      setShowModalSeleccionTicket(false);
      setReservaParaTicket(null);
    }
  };
  
  if (error) {
    return (
      <div className="flex min-h-screen-safe items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="page-container space-y-6">
      <style jsx global>{`
        @keyframes actividades-loading-shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }

        .actividades-loading-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 45%,
            rgba(255, 255, 255, 0.24) 50%,
            rgba(255, 255, 255, 0.12) 55%,
            transparent 100%
          );
          animation: actividades-loading-shimmer 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Actividades</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowModalPendientes(true)}
            aria-label={`Pendientes (${reservasPendientesTramos.length})`}
            title="Reservas pendientes de asignar tramos"
            className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-light/10 primary-gradient text-white shadow-lg shadow-primary/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface-container-lowest cursor-pointer"
          >
            <PendingReservationIcon className="h-5 w-5" />
            {reservasPendientesTramos.length > 0 ? (
              <span className="absolute -bottom-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-amber-300 bg-amber-500 px-1.5 text-[10px] font-black text-white shadow-md shadow-amber-500/30 ring-2 ring-surface-container-lowest">
                {reservasPendientesTramos.length}
              </span>
            ) : null}
          </button>
          <Button
            variant="primary"
            icon={<NewReservationIcon />}
            onClick={() => {
              setProgramaParaInscripcion(null);
              setShowModalReserva(true);
            }}
            className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
          >
            Nueva
          </Button>
        </div>
      </div>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-card-ambient sm:p-6">
        <VistaCalendario
          loading={showInitialLoadingScreen}
          reservas={reservasFiltradas}
          onActualizarEstado={handleActualizarEstado}
          onReservaActualizada={cargarReservas}
          onSeleccionarReserva={handleVerReserva}
        />
      </section>

      <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
        <div className="border-b border-outline-variant/20 bg-surface-container-low/45 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-outline">Listado</p>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary-dark">Reservas registradas</h2>
              <p className="text-sm text-on-surface-variant">Filtros compactos y una tabla más limpia para leer cada reserva con menos ruido visual.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex w-fit items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-primary-dark shadow-sm">
                {reservasFiltradas.length} reserva{reservasFiltradas.length === 1 ? '' : 's'}
              </span>
              <FiltrosReservas onFiltrosChange={setFiltros} />
            </div>
          </div>
        </div>

        <div className="hidden bg-surface-container-low/25 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 md:block">
          <div className="overflow-hidden rounded-[1.25rem] border border-outline-variant/20 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#edf1ff] backdrop-blur-md">
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Cliente</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Actividad</th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Empresa</th>
                    <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Fecha</th>
                    <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Horario</th>
                    <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Precio</th>
                    <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Estado</th>
                    <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {showInitialLoadingScreen
                    ? Array.from({ length: RESERVAS_POR_PAGINA }).map((_, index) => <ReservaTablaSkeleton key={index} />)
                    : reservasPaginadas.map((reserva) => {
                        const estadoVisual = getEstadoVisualReserva(reserva);
                        return (
                          <tr
                            key={reserva.id}
                            className="cursor-pointer border-b border-outline-variant/10 bg-white transition hover:bg-[#f7faff]"
                            onClick={() => handleFilaClick(reserva)}
                          >
                            <td className="px-6 py-4 text-sm font-semibold text-on-surface">{mostrarCliente(reserva)}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-primary-dark">
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{mostrarActividad(reserva)}</span>
                                {(reserva.numero_tramos ?? 0) > 1 ? (
                                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                                    {reserva.numero_tramos} tramos
                                  </span>
                                ) : null}
                                {getEstadoAsignacionLabel(reserva) ? (
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoAsignacionColor(reserva)}`}>
                                    {getEstadoAsignacionLabel(reserva)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-on-surface-variant">{mostrarEmpresa(reserva)}</td>
                            <td className="px-6 py-4 text-center text-sm font-medium text-on-surface-variant">
                              {formatearFechaReserva(reserva)}
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-medium text-primary">
                              <div>
                                <div>{formatearHorarioReserva(reserva)}</div>
                                {isReservaPendienteTramos(reserva) ? (
                                  <div className="mt-1 text-xs font-semibold text-amber-700">
                                    Restan {formatearDuracionMinutos(reserva.duracion_restante_min ?? 0)}
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-bold text-on-surface">
                              {new Intl.NumberFormat('es-ES', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              }).format(reserva.precio)}{' '}
                              €
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`${getEstadoColor(estadoVisual)} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                                {formatearEstado(estadoVisual)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                                  title={reserva.kind === 'campamento_programa' ? 'Ver programa' : 'Ver'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerReserva(reserva);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>

                                {reserva.kind !== 'campamento_programa' && (reserva.ticket_url || reserva.ticket_url_reserva) ? (
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                                    title="Descargar ticket"
                                    onClick={(e) => handleDescargarTicket(reserva, e)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>
                                ) : null}

                                {reserva.kind !== 'campamento_programa' ? (
                                  <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                                    title="Eliminar"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEliminarReserva(reserva);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                  {!showInitialLoadingScreen && reservasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm font-medium text-outline">
                        No se encontraron reservas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-surface-container-low/25 px-4 pb-4 pt-5 sm:px-6 sm:pb-6 md:hidden">
          {showInitialLoadingScreen
            ? Array.from({ length: RESERVAS_POR_PAGINA }).map((_, index) => <ReservaTarjetaSkeleton key={index} />)
            : reservasFiltradas.length === 0
              ? (
                <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                  No se encontraron reservas con los filtros seleccionados.
                </div>
                )
              : reservasPaginadas.map((reserva) => {
                  const estadoVisual = getEstadoVisualReserva(reserva);
                  return (
                    <div
                      key={reserva.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleFilaClick(reserva)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleFilaClick(reserva);
                        }
                      }}
                      className="w-full rounded-[1.25rem] border border-primary/10 bg-white px-4 py-4 text-left shadow-sm transition hover:bg-[#f8faff]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{mostrarCliente(reserva)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-primary-dark">{mostrarActividad(reserva)}</p>
                            {(reserva.numero_tramos ?? 0) > 1 ? (
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                                {reserva.numero_tramos} tramos
                              </span>
                            ) : null}
                            {getEstadoAsignacionLabel(reserva) ? (
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getEstadoAsignacionColor(reserva)}`}>
                                {getEstadoAsignacionLabel(reserva)}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-on-surface-variant">{mostrarEmpresa(reserva)}</p>
                        </div>
                        <span className={`${getEstadoColor(estadoVisual)} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                          {formatearEstado(estadoVisual)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-on-surface-variant">
                        <p>{formatearFechaReserva(reserva)}</p>
                        <div className="text-right text-primary">
                          <p>{formatearHorarioReserva(reserva)}</p>
                          {isReservaPendienteTramos(reserva) ? (
                            <p className="mt-1 text-xs font-semibold text-amber-700">
                              Restan {formatearDuracionMinutos(reserva.duracion_restante_min ?? 0)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-bold text-on-surface">
                        {new Intl.NumberFormat('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        }).format(reserva.precio)}{' '}
                        €
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          className="min-h-11 flex-1 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerReserva(reserva);
                          }}
                        >
                          {reserva.kind === 'campamento_programa' ? 'Ver programa' : 'Ver'}
                        </button>

                        {reserva.kind !== 'campamento_programa' && (reserva.ticket_url || reserva.ticket_url_reserva) ? (
                          <button
                            type="button"
                            className="min-h-11 flex-1 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            onClick={(e) => handleDescargarTicket(reserva, e)}
                          >
                            Ticket
                          </button>
                        ) : null}

                        {reserva.kind !== 'campamento_programa' ? (
                          <button
                            type="button"
                            className="min-h-11 flex-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarReserva(reserva);
                            }}
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
        </div>

        <PaginationControls
          currentPage={paginaReservasActiva}
          totalPages={totalPaginasReservas}
          totalItems={reservasFiltradas.length}
          pageSize={RESERVAS_POR_PAGINA}
          onPageChange={setPaginaReservas}
          className="bg-surface-container-low/25 px-4 py-0 sm:px-6"
        />
      </section>

      <ModalConfirmacion
        isOpen={isModalConfirmacionOpen}
        onClose={() => {
          setIsModalConfirmacionOpen(false);
          setReservaAEliminar(null);
        }}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Reserva"
        mensaje={`¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variante="actividades-v2"
      />

      {/* Modal de detalles de reserva */}
      <ModalDetalleReserva
        isOpen={!!reservaSeleccionada}
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
        onActualizarEstado={handleActualizarEstado}
        onReservaActualizada={cargarReservas}
      />

      <ModalDetalleCampamentoPrograma
        isOpen={!!programaSeleccionadoId}
        programaId={programaSeleccionadoId}
        onClose={() => setProgramaSeleccionadoId(null)}
        onAddInscripcion={(programa) => {
          setProgramaSeleccionadoId(null);
          setProgramaParaInscripcion(programa);
          setShowModalReserva(true);
        }}
      />

      {/* Modal Nueva Reserva */}
      <ModalNuevaReserva
        isOpen={showModalReserva}
        onClose={() => {
          setShowModalReserva(false);
          setProgramaParaInscripcion(null);
        }}
        campamentoProgramaContext={programaParaInscripcion ?? undefined}
        onSubmit={handleNuevaReserva}
        onToast={handleToast}
      />

      <ModalPendientesTramosCurso
        isOpen={showModalPendientes}
        onClose={() => setShowModalPendientes(false)}
        reservas={reservasPendientesTramos}
        onReservaActualizada={cargarReservas}
      />

      {/* Modal de selección de ticket */}
      <ModalSeleccionTicket
        isOpen={showModalSeleccionTicket}
        onClose={() => {
          setShowModalSeleccionTicket(false);
          setReservaParaTicket(null);
        }}
        onSeleccionarTicketReserva={handleSeleccionarTicketReserva}
        onSeleccionarTicketPago={handleSeleccionarTicketPago}
      />

      {/* Toast de notificación */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'success' })}
      />
    </div>
  );
}
