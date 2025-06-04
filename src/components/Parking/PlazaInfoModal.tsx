import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReservaForm from './ReservaForm';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface PlazaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  plaza: {
    id: string;
    codigo: string;
    tipo: string;
    disponible?: boolean;
    reservada?: boolean;
  };
  reservaInfo?: {
    id_cliente: string;
    id_tarifa: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  tarifas: TarifaParking[];
  onEliminarReserva?: () => void;
  onCrearReserva?: (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
  }) => void;
}

export default function PlazaInfoModal({ 
  isOpen, 
  onClose, 
  plaza, 
  reservaInfo,
  tarifas,
  onEliminarReserva,
  onCrearReserva 
}: PlazaInfoModalProps) {
  const [showReservaForm, setShowReservaForm] = useState(false);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  };

  const getEstadoColor = () => {
    if (plaza.disponible && !plaza.reservada) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (plaza.reservada) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleCrearReserva = (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
  }) => {
    onCrearReserva?.(data);
    setShowReservaForm(false);
  };

  const getTarifaInfo = () => {
    if (!reservaInfo?.id_tarifa) return null;
    return tarifas.find(t => t.id === reservaInfo.id_tarifa);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 flex items-center justify-center">
            <div className="flex min-h-full w-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                  {/* Header */}
                  <div className={`px-6 py-4 border-b ${getEstadoColor()}`}>
                    <div className="flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-xl font-semibold">
                        Plaza {plaza.codigo}
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-lg p-1 hover:bg-black/10 transition-colors"
                        onClick={onClose}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Tipo
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {plaza.tipo.charAt(0).toUpperCase() + plaza.tipo.slice(1)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Estado
                          </p>
                          <span className={`inline-flex rounded-md px-2 py-1 text-sm font-medium ${getEstadoColor()}`}>
                            {plaza.disponible && !plaza.reservada ? 'Disponible' :
                             plaza.reservada ? 'Reservada' : 'Ocupada'}
                          </span>
                        </div>
                      </div>

                      {reservaInfo && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Información de la Reserva
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Inicio
                              </p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {formatearFecha(reservaInfo.fecha_inicio)}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Fin
                              </p>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {formatearFecha(reservaInfo.fecha_fin)}
                              </p>
                            </div>
                            {getTarifaInfo() && (
                              <>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Periodo
                                  </p>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {getTarifaInfo()?.periodo === 'mes' ? 'Mensual' : 'Quincenal'}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Precio
                                  </p>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {formatearPrecio(getTarifaInfo()?.precio || 0)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer con botones */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                      {plaza.reservada ? (
                        <button
                          type="button"
                          onClick={onEliminarReserva}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        >
                          Eliminar Reserva
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowReservaForm(true)}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
                        >
                          Añadir Reserva
                        </button>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <ReservaForm
        isOpen={showReservaForm}
        onClose={() => setShowReservaForm(false)}
        onSubmit={handleCrearReserva}
        plazaCodigo={plaza.codigo}
        tipoPlaza={plaza.tipo}
        tarifas={tarifas}
      />
    </>
  );
} 