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
}

const ModalConfirmacion = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar'
}: ModalConfirmacionProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header azul */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white"
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
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mensaje}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
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