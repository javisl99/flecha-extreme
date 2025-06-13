import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReservaForm from './ReservaForm';

type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface PagoParking {
  id: string;
  id_cliente: string | null;
  origen_tipo: 'parking';
  origen_id: string;
  concepto: string;
  importe: number;
  metodo: MetodoPago;
  estado: EstadoPago;
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
    id: string;
    id_cliente: string;
    id_tarifa: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  pagoInfo?: PagoParking;
  clienteInfo?: { nombre: string; apellidos: string } | null;
  tarifas: TarifaParking[];
  onEliminarReserva?: () => void;
  onCrearReserva?: (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    id_cliente: string | null;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => void;
}

export default function PlazaInfoModal({ 
  isOpen, 
  onClose, 
  plaza, 
  reservaInfo,
  pagoInfo,
  clienteInfo,
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
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800';
    } else if (plaza.reservada) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800';
    }
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800';
  };

  const getMetodoPagoLabel = (metodo: MetodoPago) => {
    const labels: Record<MetodoPago, string> = {
      'efectivo': 'Efectivo',
      'tpv': 'Tarjeta (TPV)',
      'bizum_alfonso': 'Bizum Alfonso',
      'bizum_robe': 'Bizum Robe',
      'bizum_alba': 'Bizum Alba',
      'bizum_maria': 'Bizum María',
      'bizum_jm': 'Bizum JM',
      'angeles': 'Ángeles'
    };
    return labels[metodo] || metodo;
  };

  const getEstadoPagoLabel = (estado: EstadoPago) => {
    const labels: Record<EstadoPago, string> = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado'
    };
    return labels[estado] || estado;
  };

  const getEstadoPagoColor = (estado: EstadoPago) => {
    const colors: Record<EstadoPago, string> = {
      'completado': 'bg-green-100 text-green-800 border-green-200',
      'pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[estado] || '';
  };

  const handleCrearReserva = (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    id_cliente: string | null;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
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

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
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
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Información de la Reserva
                          </h4>
                          <div className="space-y-4">
                            {clienteInfo && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Cliente
                                </p>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary-light text-white flex items-center justify-center text-sm">
                                    {clienteInfo.nombre.charAt(0)}{clienteInfo.apellidos.charAt(0)}
                                  </div>
                                  <p className="ml-3 text-sm text-gray-900 dark:text-gray-100">
                                    {clienteInfo.nombre} {clienteInfo.apellidos}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Fecha de inicio
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {formatearFecha(reservaInfo.fecha_inicio)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Fecha de fin
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {formatearFecha(reservaInfo.fecha_fin)}
                                </p>
                              </div>
                            </div>

                            {getTarifaInfo() && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Tarifa
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {getTarifaInfo()?.periodo === 'mes' ? 'Mensual' : 'Quincenal'} - {formatearPrecio(getTarifaInfo()?.precio || 0)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {pagoInfo && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Información del Pago
                          </h4>
                          <div className="space-y-4">
                            {pagoInfo.concepto && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Concepto
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {pagoInfo.concepto}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Importe
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {formatearPrecio(pagoInfo.importe)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  Método de pago
                                </p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {getMetodoPagoLabel(pagoInfo.metodo)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Estado del pago
                              </p>
                              <span className={`inline-flex rounded-md px-2 py-1 text-sm font-medium ${getEstadoPagoColor(pagoInfo.estado)}`}>
                                {getEstadoPagoLabel(pagoInfo.estado)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        Cerrar
                      </button>
                      {!plaza.reservada && (
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
                          onClick={() => setShowReservaForm(true)}
                        >
                          Crear Reserva
                        </button>
                      )}
                      {plaza.reservada && onEliminarReserva && (
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          onClick={onEliminarReserva}
                        >
                          Eliminar Reserva
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

      {showReservaForm && (
        <ReservaForm
          isOpen={showReservaForm}
          onClose={() => setShowReservaForm(false)}
          onSubmit={handleCrearReserva}
          plazaCodigo={plaza.codigo}
          tarifas={tarifas}
        />
      )}
    </>
  );
} 