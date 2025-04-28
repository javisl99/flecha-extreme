'use client';

import { useState } from 'react';
import { Card } from '@/shared/components';
import { Reserva } from '@/shared/types';

// Icono para las reservas de hoy
const CalendarDayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM12 11v5M12 11l3 3m-3-3l-3 3" />
  </svg>
);

interface ReservasHoyProps {
  reservas: Reserva[];
}

export default function ReservasHoy({ reservas }: ReservasHoyProps) {
  const [mostrarTodas, setMostrarTodas] = useState(false);
  
  const getStatusColor = (estado: Reserva['estado']) => {
    switch (estado) {
      case 'Confirmada': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'Pendiente': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'Cancelada': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      case 'Completada': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getPaymentStatusStyle = (pagado: boolean) => {
    return pagado 
      ? 'bg-green-800 dark:bg-green-300 text-green-100 dark:text-green-900' 
      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
  };

  const formatHora = (hora: string) => {
    return hora;
  };

  // Mostrar solo las primeras 3 reservas o todas si se ha activado el botón
  const reservasAMostrar = mostrarTodas ? reservas : reservas.slice(0, 3);
  const hayMasReservas = reservas.length > 3;

  return (
    <Card title="Reservas de Hoy" icon={<CalendarDayIcon />} className="h-full">
      <div className="space-y-4">
        {reservas.length > 0 ? (
          <div className="overflow-y-auto">
            {reservasAMostrar.map((reserva) => (
              <div 
                key={reserva.id} 
                className="p-3 mb-2 bg-card-bg rounded-lg border border-card-border hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{reserva.actividad}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatHora(reserva.horaInicio)} - {formatHora(reserva.horaFin)}
                    </p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {reserva.cliente?.nombre} {reserva.cliente?.apellidos}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPaymentStatusStyle(reserva.pagado)}`}>
                      {reserva.pagado ? 'Pagado' : 'Pendiente de pago'}
                    </span>
                  </div>
                </div>
                
                {reserva.notas && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                    {reserva.notas}
                  </p>
                )}
              </div>
            ))}
            
            {!mostrarTodas && hayMasReservas && (
              <div className="text-center mt-3">
                <button 
                  onClick={() => setMostrarTodas(true)}
                  className="text-sm text-primary-dark dark:text-primary-light hover:underline"
                >
                  Ver todas las reservas ({reservas.length})
                </button>
              </div>
            )}
            
            {mostrarTodas && hayMasReservas && (
              <div className="text-center mt-3">
                <button 
                  onClick={() => setMostrarTodas(false)}
                  className="text-sm text-primary-dark dark:text-primary-light hover:underline"
                >
                  Mostrar menos
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No hay reservas para hoy</p>
          </div>
        )}
      </div>
    </Card>
  );
} 