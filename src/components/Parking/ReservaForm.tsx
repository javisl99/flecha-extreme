import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface ReservaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => void;
  plazaCodigo: string;
  tarifas: TarifaParking[];
}

export default function ReservaForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  plazaCodigo,
  tarifas 
}: ReservaFormProps) {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_tarifa: '',
    pago: {
      concepto: '',
      metodo: 'efectivo' as MetodoPago,
      estado: 'pendiente' as EstadoPago
    }
  });

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const metodosPago: { value: MetodoPago; label: string }[] = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tpv', label: 'Tarjeta (TPV)' },
    { value: 'bizum_alfonso', label: 'Bizum Alfonso' },
    { value: 'bizum_robe', label: 'Bizum Robe' },
    { value: 'bizum_alba', label: 'Bizum Alba' },
    { value: 'bizum_maria', label: 'Bizum María' },
    { value: 'bizum_jm', label: 'Bizum JM' },
    { value: 'angeles', label: 'Ángeles' }
  ];

  const estadosPago: { value: EstadoPago; label: string }[] = [
    { value: 'completado', label: 'Completado' },
    { value: 'pendiente', label: 'Pendiente' }
  ];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
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
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Nueva Reserva - Plaza {plazaCodigo}
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
                      <div>
                        <label htmlFor="tarifa" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Tarifa
                        </label>
                        <select
                          id="tarifa"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={formData.id_tarifa}
                          onChange={(e) => setFormData({ ...formData, id_tarifa: e.target.value })}
                          required
                        >
                          <option value="">Selecciona una tarifa</option>
                          {tarifas.map((tarifa) => (
                            <option key={tarifa.id} value={tarifa.id}>
                              {tarifa.periodo === 'mes' ? 'Mensual' : 'Quincenal'} - {formatPrecio(tarifa.precio)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="fecha_inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fecha de inicio
                        </label>
                        <input
                          type="datetime-local"
                          id="fecha_inicio"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={formData.fecha_inicio}
                          onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="fecha_fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fecha de fin
                        </label>
                        <input
                          type="datetime-local"
                          id="fecha_fin"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          value={formData.fecha_fin}
                          onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                          required
                        />
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Información del Pago
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Concepto (opcional)
                            </label>
                            <input
                              type="text"
                              id="concepto"
                              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={formData.pago.concepto}
                              onChange={(e) => setFormData({
                                ...formData,
                                pago: { ...formData.pago, concepto: e.target.value }
                              })}
                              placeholder="Introduce un concepto para el pago"
                            />
                          </div>

                          <div>
                            <label htmlFor="metodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Método de pago
                            </label>
                            <select
                              id="metodo"
                              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={formData.pago.metodo}
                              onChange={(e) => setFormData({
                                ...formData,
                                pago: { ...formData.pago, metodo: e.target.value as MetodoPago }
                              })}
                              required
                            >
                              {metodosPago.map((metodo) => (
                                <option key={metodo.value} value={metodo.value}>
                                  {metodo.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Estado del pago
                            </label>
                            <select
                              id="estado"
                              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={formData.pago.estado}
                              onChange={(e) => setFormData({
                                ...formData,
                                pago: { ...formData.pago, estado: e.target.value as EstadoPago }
                              })}
                              required
                            >
                              {estadosPago.map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                  {estado.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
                      >
                        Crear Reserva
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 