'use client';

import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ReceiptPercentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SelectorClienteCompacto } from '@/components/Tienda/SelectorClienteCompacto';
import { ACTIVE_PAYMENT_METHOD_OPTIONS } from '@/lib/contabilidadCatalogos';
import { formatPrice } from '@/lib/formatUtils';

type MetodoPago = 'efectivo' | 'tpv' | 'transferencia' | 'bizum_alfonso';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface ReservaDraft {
  fecha_inicio: string;
  fecha_fin: string;
  id_tarifa: string;
}

interface PagoReservaParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSubmit: (data: {
    id_cliente: string | null;
    pago: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => void;
  plazaCodigo: string;
  reservaDraft: ReservaDraft;
  tarifa: TarifaParking | null;
}

export default function PagoReservaParkingModal({
  isOpen,
  onClose,
  onBack,
  onSubmit,
  plazaCodigo,
  reservaDraft,
  tarifa
}: PagoReservaParkingModalProps) {
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pendiente');
  const [concepto, setConcepto] = useState('');

  const metodosPago: { value: MetodoPago; label: string }[] = useMemo(
    () => ACTIVE_PAYMENT_METHOD_OPTIONS as Array<{ value: MetodoPago; label: string }>,
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      id_cliente: selectedClienteId,
      pago: {
        concepto: concepto.trim() || `Reserva parking ${plazaCodigo}`,
        metodo: metodoPago,
        estado: estadoPago
      }
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-end justify-center sm:items-center">
          <div className="flex min-h-full w-full items-end justify-center p-4 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative max-h-[90svh] w-full max-w-4xl transform overflow-hidden rounded-t-[1.5rem] bg-white shadow-lg transition-transform dark:bg-gray-800 sm:rounded-xl">
                <form onSubmit={handleSubmit}>
                  <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <ReceiptPercentIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Procesar Pago Parking
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Plaza {plazaCodigo}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer rounded-lg p-1 transition-colors hover:bg-black/10"
                        onClick={onClose}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[calc(90svh-200px)] overflow-y-auto px-4 py-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="space-y-6">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cliente
                          </label>
                          <SelectorClienteCompacto
                            selectedClienteId={selectedClienteId}
                            onClienteChange={setSelectedClienteId}
                            placeholder="Seleccionar cliente"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label htmlFor="concepto" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Concepto
                          </label>
                          <input
                            type="text"
                            id="concepto"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            placeholder={`Reserva parking ${plazaCodigo}`}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label htmlFor="metodo" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Metodo de pago
                            </label>
                            <select
                              id="metodo"
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              value={metodoPago}
                              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
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
                            <label htmlFor="estado" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Estado del pago
                            </label>
                            <select
                              id="estado"
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              value={estadoPago}
                              onChange={(e) => setEstadoPago(e.target.value as EstadoPago)}
                              required
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completado">Completado</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Resumen de la reserva</h4>

                        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900">
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Plaza</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{plazaCodigo}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Tarifa</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {tarifa ? (tarifa.periodo === 'mes' ? 'Mensual' : 'Quincenal') : '--'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Inicio</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{reservaDraft.fecha_inicio || '--'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Fin</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{reservaDraft.fecha_fin || '--'}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-3 dark:border-gray-600">
                              <div className="flex items-center justify-between text-lg font-bold">
                                <span className="text-gray-900 dark:text-gray-100">TOTAL</span>
                                <span className="text-primary">{formatPrice(tarifa?.precio ?? 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-3">
                      <button
                        type="button"
                        className="min-h-11 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-75 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={onBack}
                      >
                        Volver
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-75 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={onClose}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="min-h-11 rounded-md bg-green-600 px-6 py-2 text-sm font-bold text-white transition-colors duration-75 hover:bg-green-700"
                      >
                        <span className="font-bold">{`Procesar Pago - ${formatPrice(tarifa?.precio ?? 0)}`}</span>
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
