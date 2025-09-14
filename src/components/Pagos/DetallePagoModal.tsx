import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Pago } from '@/hooks/usePagos';
import { Button } from '@/shared/components';
import { toast } from 'react-hot-toast';

interface DetallePagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: Pago | null;
  onCompletarPago?: (pago: Pago) => Promise<void>;
  onCancelarPago?: (pago: Pago) => Promise<void>;
}

const formatearMetodoPago = (metodo: Pago['metodo']) => {
  const metodosFormateados: Record<Pago['metodo'], string> = {
    'efectivo': 'Efectivo',
    'tpv': 'Tarjeta',
    'tpv_online': 'Tarjeta Online',
    'bizum_alfonso': 'Bizum Alfonso',
    'bizum_robe': 'Bizum Robe',
    'bizum_alba': 'Bizum Alba',
    'bizum_maria': 'Bizum María',
    'bizum_jm': 'Bizum JM',
    'angeles': 'Ángeles'
  };
  return metodosFormateados[metodo] || metodo;
};

const formatearEstado = (estado: Pago['estado']) => {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
};

const getEstadoColor = (estado: Pago['estado']) => {
  const colores = {
    'completado': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'cancelado': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };
  return colores[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

export default function DetallePagoModal({ isOpen, onClose, pago, onCompletarPago, onCancelarPago }: DetallePagoModalProps) {
  const [isCompletando, setIsCompletando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);

  if (!pago) return null;

  const handleCompletarPago = async () => {
    if (!onCompletarPago) return;
    
    try {
      setIsCompletando(true);
      await onCompletarPago(pago);
      toast.success('Pago completado correctamente');
    } catch (error) {
      console.error('Error al completar el pago:', error);
      toast.error('Error al completar el pago');
    } finally {
      setIsCompletando(false);
    }
  };

  const handleCancelarPago = async () => {
    if (!onCancelarPago) return;
    
    try {
      setIsCancelando(true);
      await onCancelarPago(pago);
      toast.success('Pago cancelado correctamente');
    } catch (error) {
      console.error('Error al cancelar el pago:', error);
      toast.error('Error al cancelar el pago');
    } finally {
      setIsCancelando(false);
    }
  };

  const shouldRender = isOpen;
  const isVisible = shouldRender;

  const modalClasses = `fixed inset-0 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30 transition-opacity ${
    isVisible ? 'opacity-100' : 'opacity-0'
  }`;

  return (
    <div className={modalClasses} onClick={onClose}>
      <Transition.Root show={shouldRender} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Detalles del Pago
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
                            Cliente
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {pago.cliente ? `${pago.cliente.nombre} ${pago.cliente.apellidos}` : 'Cliente no establecido'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Origen
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {pago.origen_tipo.charAt(0).toUpperCase() + pago.origen_tipo.slice(1)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Concepto
                        </p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {pago.concepto}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Importe
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('es-ES', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2
                            }).format(pago.importe)} €
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Método de Pago
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {formatearMetodoPago(pago.metodo)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Estado
                        </p>
                        <span className={`inline-flex rounded-md px-2 py-1 text-sm font-medium ${getEstadoColor(pago.estado)}`}>
                          {formatearEstado(pago.estado)}
                        </span>
                      </div>

                      {pago.created_at && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Fecha de Creación
                          </p>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(pago.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      )}

                      {pago.estado === 'pendiente' && (
                        <div className="mt-6 flex justify-end space-x-3">
                          {onCompletarPago && (
                            <Button
                              variant="accent"
                              onClick={handleCompletarPago}
                              loading={isCompletando}
                              className="!bg-green-600 hover:!bg-green-700 focus:ring-green-500 text-white"
                            >
                              Completar Pago
                            </Button>
                          )}
                          {onCancelarPago && (
                            <Button
                              variant="accent"
                              onClick={handleCancelarPago}
                              loading={isCancelando}
                              className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500 text-white"
                            >
                              Cancelar Pago
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 