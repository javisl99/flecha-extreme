'use client';

import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ModalDetalleReserva from './ModalDetalleReserva';

// Configurar moment en español
moment.locale('es');

const localizer = momentLocalizer(moment);

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

interface VistaCalendarioProps {
  reservas: Reserva[];
  onActualizarEstado?: (reserva: Reserva, nuevoEstado: string) => void;
}

interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Reserva;
}

export default function VistaCalendario({ reservas, onActualizarEstado }: VistaCalendarioProps) {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);

  // Convertir reservas a eventos del calendario
  const eventos = useMemo(() => {
    return reservas.map((reserva): EventoCalendario => {
      const fechaInicio = new Date(reserva.fecha_inicio);
      const fechaFin = new Date(reserva.fecha_fin);
      
      // Crear título del evento
      const cliente = reserva.cliente 
        ? `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`
        : 'Cliente no establecido';
      
      const actividad = reserva.actividad?.nombre || 'Actividad no encontrada';
      const empresa = reserva.empresa?.nombre || 'Empresa no establecida';
      
      const title = `${actividad} - ${cliente} (${empresa})`;

      return {
        id: reserva.id,
        title,
        start: fechaInicio,
        end: fechaFin,
        resource: reserva
      };
    });
  }, [reservas]);

  // Función para obtener el color del evento según el estado
  const getEventStyle = (event: EventoCalendario) => {
    const estado = event.resource.estado;
    let backgroundColor = '#3174ad'; // Color por defecto
    
    switch (estado) {
      case 'confirmada':
        backgroundColor = '#10b981'; // Verde
        break;
      case 'pendiente':
        backgroundColor = '#f59e0b'; // Amarillo
        break;
      case 'cancelada':
        backgroundColor = '#ef4444'; // Rojo
        break;
      case 'completada':
        backgroundColor = '#3b82f6'; // Azul
        break;
      default:
        backgroundColor = '#6b7280'; // Gris
    }

    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSelectEvent = (event: EventoCalendario) => {
    setReservaSeleccionada(event.resource);
  };

  const handleActualizarEstado = (reserva: Reserva, nuevoEstado: string) => {
    if (onActualizarEstado) {
      onActualizarEstado(reserva, nuevoEstado);
    }
    setReservaSeleccionada(null);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleView = (newView: any) => {
    setView(newView);
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-primary dark:text-primary-light mb-2">
          Calendario de Reservas
        </h2>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Confirmada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Pendiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Cancelada</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Completada</span>
          </div>
        </div>
      </div>
      
      <div className="h-[600px] calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onView={handleView}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={getEventStyle}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay reservas en este rango de fechas',
            showMore: (total: number) => `+ Ver ${total} más`
          }}
          popup
          showMultiDayTimes
          step={30}
          timeslots={2}
        />
      </div>
      
      <style jsx global>{`
        /* Estilos personalizados para react-big-calendar con Tailwind */
        .calendar-wrapper .rbc-calendar {
          @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm;
        }
        
        /* Header del calendario */
        .calendar-wrapper .rbc-header {
          @apply bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-2;
        }
        
        /* Botones de navegación */
        .calendar-wrapper .rbc-btn-group button {
          background-color: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          padding: 8px 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
        }
        
        .calendar-wrapper .rbc-btn-group button:hover {
          background-color: #dbeafe !important;
          color: #003f88 !important;
        }
        
        .calendar-wrapper .rbc-btn-group button:active,
        .calendar-wrapper .rbc-btn-group button:focus {
          background-color: #003f88 !important;
          color: white !important;
          border-color: #003f88 !important;
          outline: none !important;
        }
        
        .calendar-wrapper .rbc-btn-group button.rbc-active {
          background-color: #003f88 !important;
          color: white !important;
          border-color: #003f88 !important;
        }
        
        /* Modo oscuro */
        .dark .calendar-wrapper .rbc-btn-group button {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          color: #f9fafb !important;
        }
        
        .dark .calendar-wrapper .rbc-btn-group button:hover {
          background-color: rgba(0, 102, 204, 0.3) !important;
          color: #66b3ff !important;
        }
        
        .dark .calendar-wrapper .rbc-btn-group button:active,
        .dark .calendar-wrapper .rbc-btn-group button:focus {
          background-color: #0066cc !important;
          color: white !important;
          border-color: #0066cc !important;
          outline: none !important;
        }
        
        .dark .calendar-wrapper .rbc-btn-group button.rbc-active {
          background-color: #0066cc !important;
          color: white !important;
          border-color: #0066cc !important;
        }
        
        /* Celdas del calendario */
        .calendar-wrapper .rbc-month-view,
        .calendar-wrapper .rbc-time-view {
          @apply border border-gray-200 dark:border-gray-600;
        }
        
        .calendar-wrapper .rbc-date-cell {
          @apply text-gray-700 dark:text-gray-300 font-medium;
        }
        
        /* Días del mes */
        .calendar-wrapper .rbc-day-bg {
          @apply border border-gray-200 dark:border-gray-600;
        }
        
        .calendar-wrapper .rbc-off-range-bg {
          @apply bg-gray-50 dark:bg-gray-700;
        }
        
        /* Eventos */
        .calendar-wrapper .rbc-event {
          @apply rounded border-0 text-xs font-medium px-1 py-0.5 cursor-pointer transition-all duration-200 hover:opacity-80 hover:-translate-y-0.5;
        }
        
        .calendar-wrapper .rbc-event-content {
          @apply text-xs leading-tight overflow-hidden text-ellipsis whitespace-nowrap;
        }
        
        /* Popup de eventos */
        .calendar-wrapper .rbc-overlay {
          @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50;
        }
        
        /* Toolbar del calendario */
        .calendar-wrapper .rbc-toolbar {
          @apply mb-4 flex justify-between items-center flex-wrap gap-2;
        }
        
        .calendar-wrapper .rbc-toolbar-label {
          @apply text-lg font-semibold text-gray-900 dark:text-white;
        }
        
        /* Vista de tiempo */
        .calendar-wrapper .rbc-time-header {
          @apply border-b border-gray-200 dark:border-gray-600;
        }
        
        .calendar-wrapper .rbc-time-slot {
          @apply text-gray-500 dark:text-gray-400 text-xs;
        }
        
        /* Líneas de tiempo */
        .calendar-wrapper .rbc-timeslot-group {
          @apply border-b border-gray-100 dark:border-gray-700;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .calendar-wrapper .rbc-toolbar {
            @apply flex-col items-stretch;
          }
          
          .calendar-wrapper .rbc-toolbar .rbc-btn-group {
            @apply justify-center mt-2;
          }
          
          .calendar-wrapper .rbc-toolbar-label {
            @apply text-center mb-2;
          }
        }
        
        /* Estilos específicos para el día actual */
        .calendar-wrapper .rbc-today {
          @apply bg-blue-50 dark:bg-blue-900/20;
        }
        
        /* Estilos para el día seleccionado */
        .calendar-wrapper .rbc-selected {
          @apply bg-blue-100 dark:bg-blue-800/30;
        }
        
        /* Estilos para eventos en vista de mes */
        .calendar-wrapper .rbc-event-label {
          @apply text-xs font-medium;
        }
        
        /* Estilos para la vista de agenda */
        .calendar-wrapper .rbc-agenda-view table {
          @apply w-full border-collapse;
        }
        
        .calendar-wrapper .rbc-agenda-view .rbc-agenda-date-cell,
        .calendar-wrapper .rbc-agenda-view .rbc-agenda-time-cell {
          @apply border-b border-gray-200 dark:border-gray-600 p-2 text-sm;
        }
        
        .calendar-wrapper .rbc-agenda-view .rbc-agenda-event-cell {
          @apply border-b border-gray-200 dark:border-gray-600 p-2;
        }
      `}</style>
      
      {/* Modal de detalles de reserva */}
      <ModalDetalleReserva
        isOpen={!!reservaSeleccionada}
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
        onActualizarEstado={handleActualizarEstado}
      />
    </div>
  );
}
