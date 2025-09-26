'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Toast } from '@/shared/components';
import { useActividades } from '@/hooks/useActividades';
import FiltrosReservas, { type FiltrosReservaState } from '@/components/Actividades/FiltrosReservas';
import ModalNuevaReserva from '@/components/Actividades/ModalNuevaReserva';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import SurfSpinner from '@/components/shared/SurfSpinner';
import SwitchVistaActividades, { type VistaActividadesTipo } from '@/components/Actividades/SwitchVistaActividades';
import VistaCalendario from '@/components/Actividades/VistaCalendario';
import ModalDetalleReserva from '@/components/Actividades/ModalDetalleReserva';
import ModalSeleccionTicket from '@/components/Actividades/ModalSeleccionTicket';

// Definir tipo específico para Reserva
interface Reserva {
  id: string;
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
  fecha_inicio: string;
  fecha_fin: string;
  precio: number;
  estado: string;
  cantidad_reservada: number;
  ticket_url?: string;
  ticket_url_reserva?: string;
}

// Icono para nueva reserva
const NewReservationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function ReservasPage() {
  const [vistaActual, setVistaActual] = useState<VistaActividadesTipo>('calendario');
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
  const [reservaAEliminar, setReservaAEliminar] = useState<Reserva | null>(null);
  const [showModalReserva, setShowModalReserva] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [showModalSeleccionTicket, setShowModalSeleccionTicket] = useState(false);
  const [reservaParaTicket, setReservaParaTicket] = useState<Reserva | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const [recargandoLista, setRecargandoLista] = useState(false);
  
  const { 
    loading, 
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
    cargarReservas();
  }, [cargarReservas]);

  // Función para manejar el cambio a la vista de lista
  const handleCambioALista = async () => {
    setRecargandoLista(true);
    try {
      await cargarReservas();
    } catch (error) {
      console.error('Error al recargar reservas:', error);
    } finally {
      setRecargandoLista(false);
    }
  };
  
  // Filtrar reservas
  const reservasFiltradas = reservas.filter(reserva => {
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
  
  const formatearEstado = (estado: string) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'completada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
    if (!reserva.cliente) return 'Cliente no establecido';
    return `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`;
  };

  const mostrarActividad = (reserva: Reserva) => {
    if (!reserva.actividad) return 'Actividad no encontrada';
    return reserva.actividad.nombre;
  };

  const mostrarEmpresa = (reserva: Reserva) => {
    if (!reserva.empresa) return 'Empresa no establecida';
    return reserva.empresa.nombre;
  };

  const handleEliminarReserva = (reserva: Reserva) => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Actividades</h1>
        <div className="flex items-center space-x-4">
          {/* Switch de vista */}
          <SwitchVistaActividades 
            vistaActual={vistaActual} 
            onVistaChange={setVistaActual} 
            onCambioALista={handleCambioALista}
          />
          
          {/* Botón Nueva Reserva */}
          <Button 
            variant="primary" 
            icon={<NewReservationIcon />}
            onClick={() => setShowModalReserva(true)}
          >
            Nueva
          </Button>
        </div>
      </div>
      
      {vistaActual === 'lista' ? (
        <Card>
          <FiltrosReservas onFiltrosChange={setFiltros} />
          
          <div className="overflow-x-auto">
            {loading || recargandoLista ? (
              <div className="flex justify-center items-center py-12">
                <SurfSpinner size="lg" showText={true} text="Cargando actividades..." />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-table-head-bg dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actividad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {reservasFiltradas.map((reserva) => (
                    <tr 
                      key={reserva.id} 
                      className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleFilaClick(reserva)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {mostrarCliente(reserva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {mostrarActividad(reserva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {mostrarEmpresa(reserva)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                        {formatearFecha(reserva.fecha_inicio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                        {formatearHora(reserva.fecha_inicio)} - {formatearHora(reserva.fecha_fin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 dark:text-gray-100">
                        {new Intl.NumberFormat('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        }).format(reserva.precio)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`${getEstadoColor(reserva.estado)} px-2 py-1 rounded-md text-xs font-medium`}>
                          {formatearEstado(reserva.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" 
                            title="Ver"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerReserva(reserva);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {(reserva.ticket_url || reserva.ticket_url_reserva) && (
                            <button 
                              className="p-1.5 rounded-full text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer" 
                              title="Descargar ticket"
                              onClick={(e) => handleDescargarTicket(reserva, e)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                          <button 
                            className="p-1.5 rounded-full text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer" 
                            title="Eliminar"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarReserva(reserva);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {reservasFiltradas.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No se encontraron reservas con los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <SurfSpinner size="lg" showText={true} text="Cargando calendario..." />
              </div>
            ) : (
              <VistaCalendario 
                reservas={reservasFiltradas} 
                onActualizarEstado={handleActualizarEstado}
              />
            )}
          </div>
        </Card>
      )}

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
      />

      {/* Modal de detalles de reserva */}
      <ModalDetalleReserva
        isOpen={!!reservaSeleccionada}
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
        onActualizarEstado={handleActualizarEstado}
      />

      {/* Modal Nueva Reserva */}
      <ModalNuevaReserva
        isOpen={showModalReserva}
        onClose={() => setShowModalReserva(false)}
        onSubmit={handleNuevaReserva}
        onToast={handleToast}
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