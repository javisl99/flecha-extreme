'use client';

import { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ModalDetalleReserva from './ModalDetalleReserva';

// Configurar moment en español
moment.locale('es', {
  months: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthsShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  weekdays: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  weekdaysShort: [
    'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
  ],
  weekdaysMin: [
    'D', 'L', 'M', 'X', 'J', 'V', 'S'
  ],
  week: {
    dow: 1 // Lunes como primer día de la semana (1 = Lunes)
  }
});

const localizer = momentLocalizer(moment);

// Mensajes en español para el calendario
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango de fechas.',
  showMore: (total: number) => `+ Ver más (${total})`
};

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
  const [view, setView] = useState<View>(Views.MONTH);
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

  const handleView = (newView: View) => {
    setView(newView);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    // Cambiar a vista de día cuando se hace clic en un día
    setView(Views.DAY);
    setDate(slotInfo.start);
  };

  return (
    <div className="h-full">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs">
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
      
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] calendar-wrapper">
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
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={getEventStyle}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          messages={messages}
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
        
        /* Hacer clickeables todos los elementos de día */
        .calendar-wrapper .rbc-month-view .rbc-date-cell,
        .calendar-wrapper .rbc-month-view .rbc-day-bg,
        .calendar-wrapper .rbc-time-view .rbc-time-slot {
          cursor: pointer !important;
        }
        
        .calendar-wrapper .rbc-date-cell {
          @apply text-gray-700 dark:text-gray-300 font-medium;
          cursor: pointer !important;
        }
        
        /* Días del mes */
        .calendar-wrapper .rbc-day-bg {
          @apply border border-gray-200 dark:border-gray-600;
          cursor: pointer !important;
        }
        
        .calendar-wrapper .rbc-off-range-bg {
          @apply bg-gray-50 dark:bg-gray-700;
        }
        
        /* Eventos */
        .calendar-wrapper .rbc-event {
          @apply rounded border-0 text-xs font-medium px-1 py-0.5 cursor-pointer transition-all duration-200 hover:opacity-80 hover:-translate-y-0.5;
          margin: 1px !important;
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
          
          .calendar-wrapper .rbc-header {
            @apply text-xs py-2 px-1;
          }
          
          .calendar-wrapper .rbc-date-cell {
            @apply text-xs;
          }
          
          .calendar-wrapper .rbc-event {
            @apply text-xs px-1 py-0.5;
          }
          
          .calendar-wrapper .rbc-event-content {
            @apply text-xs;
          }
        }
        
        @media (max-width: 640px) {
          .calendar-wrapper .rbc-toolbar {
            @apply gap-1;
          }
          
          .calendar-wrapper .rbc-btn-group button {
            @apply px-2 py-1 text-xs;
          }
          
          .calendar-wrapper .rbc-header {
            @apply text-xs py-1 px-0.5;
          }
          
          .calendar-wrapper .rbc-date-cell {
            @apply text-xs p-1;
          }
          
          .calendar-wrapper .rbc-event {
            @apply text-xs px-0.5 py-0.5;
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
        
        /* Separación entre eventos en vistas de semana y día */
        .calendar-wrapper .rbc-time-view .rbc-event {
          margin: 1px 0 !important;
          border-radius: 3px !important;
          border: 2px solid white !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        /* Ancho específico para vista de semana */
        .calendar-wrapper .rbc-time-view .rbc-events-container .rbc-event {
          width: calc(100% - 2px) !important;
          min-width: calc(100% - 2px) !important;
          max-width: calc(100% - 2px) !important;
          box-sizing: border-box !important;
        }
        
        /* Distribución proporcional para múltiples eventos en vista de semana */
        .calendar-wrapper .rbc-time-view .rbc-events-container:has(.rbc-event:nth-child(2):not(.rbc-event:nth-child(3))) .rbc-event {
          width: calc(50% - 1px) !important;
          min-width: calc(50% - 1px) !important;
          max-width: calc(50% - 1px) !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-events-container:has(.rbc-event:nth-child(3):not(.rbc-event:nth-child(4))) .rbc-event {
          width: calc(33.333% - 1px) !important;
          min-width: calc(33.333% - 1px) !important;
          max-width: calc(33.333% - 1px) !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-events-container:has(.rbc-event:nth-child(4):not(.rbc-event:nth-child(5))) .rbc-event {
          width: calc(25% - 1px) !important;
          min-width: calc(25% - 1px) !important;
          max-width: calc(25% - 1px) !important;
        }
        
        /* Ancho específico para vista de día */
        .calendar-wrapper .rbc-day-view .rbc-events-container .rbc-event {
          width: calc(100% - 2px) !important;
          min-width: calc(100% - 2px) !important;
          max-width: calc(100% - 2px) !important;
          box-sizing: border-box !important;
        }
        
        /* Distribución proporcional para múltiples eventos en vista de día */
        .calendar-wrapper .rbc-day-view .rbc-events-container:has(.rbc-event:nth-child(2):not(.rbc-event:nth-child(3))) .rbc-event {
          width: calc(50% - 1px) !important;
          min-width: calc(50% - 1px) !important;
          max-width: calc(50% - 1px) !important;
        }
        
        .calendar-wrapper .rbc-day-view .rbc-events-container:has(.rbc-event:nth-child(3):not(.rbc-event:nth-child(4))) .rbc-event {
          width: calc(33.333% - 1px) !important;
          min-width: calc(33.333% - 1px) !important;
          max-width: calc(33.333% - 1px) !important;
        }
        
        .calendar-wrapper .rbc-day-view .rbc-events-container:has(.rbc-event:nth-child(4):not(.rbc-event:nth-child(5))) .rbc-event {
          width: calc(25% - 1px) !important;
          min-width: calc(25% - 1px) !important;
          max-width: calc(25% - 1px) !important;
        }
        
        /* Ajuste para múltiples eventos en la misma celda */
        .calendar-wrapper .rbc-time-view .rbc-events-container {
          width: 100% !important;
          overflow: visible !important;
        }
        
        /* Distribución de eventos múltiples */
        .calendar-wrapper .rbc-time-view .rbc-events-container .rbc-event + .rbc-event {
          margin-top: 2px !important;
        }
        
        /* Contenedor con flexbox para distribución horizontal */
        .calendar-wrapper .rbc-time-view .rbc-events-container {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 2px !important;
          align-items: flex-start !important;
        }
        
        /* Eventos con flex para distribución proporcional */
        .calendar-wrapper .rbc-time-view .rbc-event {
          flex: 1 1 auto !important;
          margin: 0 !important;
        }
        
        /* Separación adicional en vista de día */
        .calendar-wrapper .rbc-time-view .rbc-events-container {
          margin-right: 1px;
        }
        
        /* Separación en vista de semana */
        .calendar-wrapper .rbc-time-view .rbc-events-container .rbc-event {
          margin-bottom: 1px !important;
        }
        
        /* Bordes blancos para todos los tipos de eventos */
        .calendar-wrapper .rbc-time-view .rbc-event[style*="background-color: rgb(34, 197, 94)"] {
          border-color: white !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-event[style*="background-color: rgb(59, 130, 246)"] {
          border-color: white !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-event[style*="background-color: rgb(168, 85, 247)"] {
          border-color: white !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-event[style*="background-color: rgb(245, 158, 11)"] {
          border-color: white !important;
        }
        
        .calendar-wrapper .rbc-time-view .rbc-event[style*="background-color: rgb(239, 68, 68)"] {
          border-color: white !important;
        }
        
        /* Borde blanco por defecto para eventos sin color específico */
        .calendar-wrapper .rbc-time-view .rbc-event:not([style*="background-color"]) {
          border-color: white !important;
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
