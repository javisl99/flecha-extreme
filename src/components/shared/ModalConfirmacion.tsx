import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'default' | 'actividades-v2' | 'clientes-v2' | 'pagos-v2';
}

const ModalConfirmacion = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'default',
}: ModalConfirmacionProps) => {
  const esV2 = variante !== 'default';

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className={`fixed inset-0 backdrop-blur-sm ${esV2 ? 'bg-black/35' : 'bg-white/10 dark:bg-black/10'}`} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-md transform overflow-hidden rounded-2xl text-left align-middle shadow-xl transition-all ${
                esV2
                  ? 'border border-outline-variant/35 bg-surface-container-lowest'
                  : 'bg-white dark:bg-gray-800'
              }`}>
                <div className={`${esV2 ? 'primary-gradient' : 'bg-primary'} flex items-center justify-between px-6 py-4`}>
                  <Dialog.Title
                    as="h3"
                    className={`leading-6 text-white ${esV2 ? 'font-headline text-xl font-extrabold tracking-tight' : 'text-lg font-medium'}`}
                  >
                    {titulo}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 cursor-pointer"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className={`${esV2 ? 'p-6' : 'p-6'}`}>
                  <div className="mb-6">
                    <p className={esV2 ? 'text-sm leading-relaxed text-on-surface-variant' : 'text-sm text-gray-500 dark:text-gray-400'}>
                      {mensaje}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    {esV2 ? (
                      <>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                        >
                          {textoCancelar}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onConfirm();
                            onClose();
                          }}
                          className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          {textoConfirmar}
                        </button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={onClose}
                        >
                          {textoCancelar}
                        </Button>
                        <Button
                          variant="accent"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            onConfirm();
                            onClose();
                          }}
                        >
                          {textoConfirmar}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ModalConfirmacion; 
