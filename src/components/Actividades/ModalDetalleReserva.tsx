'use client';

import { Button } from '@/shared/components';

interface Reserva {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
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
  estado: string;
  precio: number;
  cantidad_reservada: number;
  nota?: string;
}

interface ModalDetalleReservaProps {
  isOpen: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onActualizarEstado: (reserva: Reserva, nuevoEstado: string) => void;
}

export default function ModalDetalleReserva({ 
  isOpen, 
  reserva, 
  onClose, 
  onActualizarEstado 
}: ModalDetalleReservaProps) {
  if (!isOpen || !reserva) return null;

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
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Madrid'
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card-bg dark:bg-card-bg border border-card-border dark:border-card-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header con fondo azul */}
        <div className="bg-primary text-white p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold">Detalles de la Reserva</h2>
          <button 
            className="text-white hover:text-gray-200 cursor-pointer text-xl font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{mostrarCliente(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <span className={`inline-block mt-1 text-sm px-2 py-1 rounded-full ${getEstadoColor(reserva.estado)}`}>
                  {formatearEstado(reserva.estado)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Actividad</label>
                <p className="text-gray-900 dark:text-gray-100">{mostrarActividad(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</label>
                <p className="text-gray-900 dark:text-gray-100">{mostrarEmpresa(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                <p className="text-gray-900 dark:text-gray-100">{formatearFecha(reserva.fecha_inicio)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Horario</label>
                <p className="text-gray-900 dark:text-gray-100">{formatearHora(reserva.fecha_inicio)} - {formatearHora(reserva.fecha_fin)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                <p className="text-gray-900 dark:text-gray-100">{reserva.cantidad_reservada}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Precio</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{reserva.precio} €</p>
              </div>
            </div>
            
            {reserva.nota && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</label>
                <p className="text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded">{reserva.nota}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex flex-wrap gap-2">
              {reserva.estado !== 'confirmada' && (
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => onActualizarEstado(reserva, 'confirmada')}
                >
                  Confirmar
                </Button>
              )}
              {reserva.estado !== 'completada' && (
                <Button 
                  variant="primary" 
                  className="flex-1"
                  onClick={() => onActualizarEstado(reserva, 'completada')}
                >
                  Completar
                </Button>
              )}
              {reserva.estado !== 'cancelada' && (
                <button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                  onClick={() => onActualizarEstado(reserva, 'cancelada')}
                >
                  Cancelar
                </button>
              )}
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
