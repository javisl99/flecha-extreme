'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Toast } from '@/shared/components';
import { reservasMock } from '@/components/Actividades/data';
import { Reserva } from '@/shared/types';
import { FiltrosReserva } from '@/components/Actividades/types';
import ModalNuevaActividad from '@/components/Actividades/ModalNuevaActividad';

// Icono para nueva reserva
const NewReservationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function ReservasPage() {
  const [filtros, setFiltros] = useState<FiltrosReserva>({
    fecha: '',
    estado: undefined,
    pagado: undefined
  });
  
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [showNuevoMenu, setShowNuevoMenu] = useState(false);
  const [showModalActividad, setShowModalActividad] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  });
  const menuRef = useRef<HTMLDivElement>(null);
  
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
  
  // Filtrar reservas
  const reservasFiltradas = reservasMock.filter((reserva) => {
    if (filtros.fecha && reserva.fecha !== filtros.fecha) return false;
    if (filtros.estado && reserva.estado !== filtros.estado) return false;
    if (filtros.pagado !== undefined && reserva.pagado !== filtros.pagado) return false;
    return true;
  });
  
  // Organizar las reservas por fecha para la vista de lista
  const reservasPorFecha = reservasFiltradas.reduce((grupos, reserva) => {
    const fecha = reserva.fecha;
    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }
    grupos[fecha].push(reserva);
    return grupos;
  }, {} as Record<string, Reserva[]>);
  
  const fechasOrdenadas = Object.keys(reservasPorFecha).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  const getStatusColor = (estado: Reserva['estado']) => {
    switch (estado) {
      case 'Confirmada': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300';
      case 'Pendiente': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300';
      case 'Cancelada': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';
      case 'Completada': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
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

  const handleToast = (toastData: { visible: boolean; message: string; type: 'success' | 'error' }) => {
    setToast(toastData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Actividades</h1>
         <div className="flex space-x-2">
           <Button 
             variant={vistaCalendario ? 'outline' : 'secondary'}
             size="sm"
             onClick={() => setVistaCalendario(false)}
           >
             Lista
           </Button>
           <Button 
             variant={vistaCalendario ? 'secondary' : 'outline'}
             size="sm"
             onClick={() => setVistaCalendario(true)}
           >
             Calendario
           </Button>
           
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
                       // Aquí iría la lógica para crear nueva reserva
                       console.log('Crear nueva reserva');
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
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.fecha}
              onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.estado || ''}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as Reserva['estado'] || undefined })}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pago</label>
            <select
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filtros.pagado === undefined ? '' : filtros.pagado ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value;
                setFiltros({ ...filtros, pagado: value === '' ? undefined : value === 'true' });
              }}
            >
              <option value="">Todos</option>
              <option value="true">Pagado</option>
              <option value="false">Pendiente de pago</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline"
              onClick={() => setFiltros({ fecha: '', estado: undefined, pagado: undefined })}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
        
        {!vistaCalendario ? (
          // Vista de lista
          <div className="space-y-6">
            {fechasOrdenadas.length > 0 ? (
              fechasOrdenadas.map((fecha) => (
                <div key={fecha} className="space-y-2">
                  <h3 className="text-lg font-medium text-primary-dark dark:text-primary-light">
                    {new Date(fecha).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reservasPorFecha[fecha].map((reserva) => (
                      <div
                        key={reserva.id}
                        className="border border-card-border dark:border-card-border rounded-lg p-4 bg-card-bg dark:bg-card-bg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setReservaSeleccionada(reserva)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{reserva.actividad}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reserva.estado)}`}>
                            {reserva.estado}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {reserva.horaInicio} - {reserva.horaFin}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {reserva.cliente?.nombre} {reserva.cliente?.apellidos}
                            </span>
                          </div>
                          <div className={`text-xs font-medium ${reserva.pagado ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                            {reserva.pagado ? 'Pagado' : 'Pendiente'} · {reserva.precio} €
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay reservas que coincidan con los filtros seleccionados
              </div>
            )}
          </div>
        ) : (
          // Vista de calendario (simplificada para el MVP)
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">Vista de calendario en desarrollo</p>
            <p className="text-gray-500 dark:text-gray-400">Esta funcionalidad estará disponible próximamente</p>
          </div>
        )}
      </Card>
      
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
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Actividad</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{reservaSeleccionada.actividad}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                  <span className={`inline-block mt-1 text-sm px-2 py-1 rounded-full ${getStatusColor(reservaSeleccionada.estado)}`}>
                    {reservaSeleccionada.estado}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                  <p className="text-gray-900 dark:text-gray-100">{new Date(reservaSeleccionada.fecha).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Horario</label>
                  <p className="text-gray-900 dark:text-gray-100">{reservaSeleccionada.horaInicio} - {reservaSeleccionada.horaFin}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
                  <p className="text-gray-900 dark:text-gray-100">{reservaSeleccionada.cliente?.nombre} {reservaSeleccionada.cliente?.apellidos}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Contacto</label>
                  <p className="text-gray-900 dark:text-gray-100">{reservaSeleccionada.cliente?.movil}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Precio</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{reservaSeleccionada.precio} €</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Pago</label>
                  <p className={reservaSeleccionada.pagado ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                    {reservaSeleccionada.pagado ? 'Pagado' : 'Pendiente de pago'}
                  </p>
                </div>
              </div>
              
              {reservaSeleccionada.notas && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded">{reservaSeleccionada.notas}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex flex-wrap gap-2">
                <Button variant="primary" className="flex-1">
                  Editar Reserva
                </Button>
                {!reservaSeleccionada.pagado && (
                  <Button variant="accent" className="flex-1">
                    Registrar Pago
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