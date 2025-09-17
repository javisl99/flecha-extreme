'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Toast } from '@/shared/components';
import { useActividades } from '@/hooks/useActividades';
import FiltrosReservas, { type FiltrosReservaState } from '@/components/Actividades/FiltrosReservas';
import ModalNuevaActividad from '@/components/Actividades/ModalNuevaActividad';
import ModalNuevaReserva from '@/components/Actividades/ModalNuevaReserva';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import { toast } from 'react-hot-toast';

// Icono para nueva reserva
const NewReservationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function ReservasPage() {
  const [filtros, setFiltros] = useState<FiltrosReservaState>({
    cliente: '',
    actividad: '',
    estado: '',
    empresa: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  
  const [reservas, setReservas] = useState<any[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<any | null>(null);
  const [reservaAEliminar, setReservaAEliminar] = useState<any | null>(null);
  const [showNuevoMenu, setShowNuevoMenu] = useState(false);
  const [showModalActividad, setShowModalActividad] = useState(false);
  const [showModalReserva, setShowModalReserva] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { 
    loading, 
    error, 
    obtenerReservas, 
    actualizarReserva, 
    eliminarReserva 
  } = useActividades();
  
  // Cargar reservas al montar el componente
  useEffect(() => {
    cargarReservas();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNuevoMenu(false);
      }
    };

    if (showNuevoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNuevoMenu]);

  const cargarReservas = async () => {
    try {
      const resultado = await obtenerReservas();
      if (resultado.success && resultado.reservas) {
        setReservas(resultado.reservas);
      } else {
        setToast({ visible: true, message: resultado.message, type: 'error' });
      }
    } catch (error: any) {
      console.error('Error al cargar reservas:', error);
      setToast({ visible: true, message: 'Error al cargar las reservas', type: 'error' });
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

  const mostrarCliente = (reserva: any) => {
    if (!reserva.cliente) return 'Cliente no establecido';
    return `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`;
  };

  const mostrarActividad = (reserva: any) => {
    if (!reserva.actividad) return 'Actividad no encontrada';
    return reserva.actividad.nombre;
  };

  const mostrarEmpresa = (reserva: any) => {
    if (!reserva.empresa) return 'Empresa no establecida';
    return reserva.empresa.nombre;
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

  const handleEliminarReserva = (reserva: any) => {
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
    } catch (error: any) {
      console.error('Error al eliminar reserva:', error);
      setToast({ visible: true, message: 'Error al eliminar la reserva', type: 'error' });
    }
  };

  const handleVerReserva = (reserva: any) => {
    setReservaSeleccionada(reserva);
  };

  const handleFilaClick = (reserva: any) => {
    handleVerReserva(reserva);
  };

  const handleActualizarEstado = async (reserva: any, nuevoEstado: string) => {
    try {
      const result = await actualizarReserva(reserva.id, { estado: nuevoEstado as any });
      if (result.success) {
        setToast({ visible: true, message: 'Estado de reserva actualizado correctamente', type: 'success' });
        await cargarReservas();
        setReservaSeleccionada((prev: any) => prev ? { ...prev, estado: nuevoEstado } : null);
      } else {
        setToast({ visible: true, message: 'Error al actualizar el estado de la reserva', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      setToast({ visible: true, message: 'Error al actualizar el estado de la reserva', type: 'error' });
    }
  };

  const handleNuevaActividad = (data: {
    nombre: string;
    tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
    requiereReserva: boolean;
    precioReserva?: number;
  }) => {
    console.log('Nueva actividad creada:', data);
    // La actividad ya se ha guardado en la base de datos desde el modal
    // Aquí podrías actualizar la lista de actividades si fuera necesario
  };

  const handleNuevaReserva = (data: {
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
  }) => {
    console.log('Nueva reserva creada:', data);
    // Recargar las reservas después de crear una nueva
    cargarReservas();
  };

  const handleToast = (toastData: { visible: boolean; message: string; type: 'success' | 'error' }) => {
    setToast(toastData);
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
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Reservas</h1>
        <div className="flex space-x-2">
          {/* Botón con menú desplegable */}
          <div className="relative" ref={menuRef}>
            <Button 
              variant="primary" 
              icon={<NewReservationIcon />}
              onClick={() => setShowNuevoMenu(!showNuevoMenu)}
            >
              Nueva
            </Button>
            
            {showNuevoMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowNuevoMenu(false);
                      setShowModalReserva(true);
                    }}
                  >
                    Reserva
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowNuevoMenu(false);
                      setShowModalActividad(true);
                    }}
                  >
                    Actividad
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Card>
        <FiltrosReservas onFiltrosChange={setFiltros} />
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton columns={8} rows={5} />
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
      {reservaSeleccionada && (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg dark:bg-card-bg border border-card-border dark:border-card-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-primary-dark dark:text-primary-light">Detalles de la Reserva</h2>
              <button 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setReservaSeleccionada(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{mostrarCliente(reservaSeleccionada)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                  <span className={`inline-block mt-1 text-sm px-2 py-1 rounded-full ${getEstadoColor(reservaSeleccionada.estado)}`}>
                    {formatearEstado(reservaSeleccionada.estado)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Actividad</label>
                  <p className="text-gray-900 dark:text-gray-100">{mostrarActividad(reservaSeleccionada)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</label>
                  <p className="text-gray-900 dark:text-gray-100">{mostrarEmpresa(reservaSeleccionada)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatearFecha(reservaSeleccionada.fecha_inicio)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Horario</label>
                  <p className="text-gray-900 dark:text-gray-100">{formatearHora(reservaSeleccionada.fecha_inicio)} - {formatearHora(reservaSeleccionada.fecha_fin)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                  <p className="text-gray-900 dark:text-gray-100">{reservaSeleccionada.cantidad_reservada}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Precio</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{reservaSeleccionada.precio} €</p>
                </div>
              </div>
              
              {reservaSeleccionada.nota && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded">{reservaSeleccionada.nota}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex flex-wrap gap-2">
                {reservaSeleccionada.estado !== 'confirmada' && (
                  <Button 
                    variant="primary" 
                    className="flex-1"
                    onClick={() => handleActualizarEstado(reservaSeleccionada, 'confirmada')}
                  >
                    Confirmar
                  </Button>
                )}
                {reservaSeleccionada.estado !== 'completada' && (
                  <Button 
                    variant="accent" 
                    className="flex-1"
                    onClick={() => handleActualizarEstado(reservaSeleccionada, 'completada')}
                  >
                    Completar
                  </Button>
                )}
                {reservaSeleccionada.estado !== 'cancelada' && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleActualizarEstado(reservaSeleccionada, 'cancelada')}
                  >
                    Cancelar
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={() => setReservaSeleccionada(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Actividad */}
      <ModalNuevaActividad
        isOpen={showModalActividad}
        onClose={() => setShowModalActividad(false)}
        onSubmit={handleNuevaActividad}
        onToast={handleToast}
      />

      {/* Modal Nueva Reserva */}
      <ModalNuevaReserva
        isOpen={showModalReserva}
        onClose={() => setShowModalReserva(false)}
        onSubmit={handleNuevaReserva}
        onToast={handleToast}
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