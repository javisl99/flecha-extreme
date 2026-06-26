import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { formatDateInputValue, getStartOfWeekMonday } from '@/lib/empleadoHorarios';

interface ModalCopiarSemanaHorarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { sourceWeekStart: string; targetWeekStart: string }) => Promise<void>;
  initialTargetWeekStart: string;
  loading?: boolean;
}

export default function ModalCopiarSemanaHorario({
  isOpen,
  onClose,
  onSubmit,
  initialTargetWeekStart,
  loading = false,
}: ModalCopiarSemanaHorarioProps) {
  const [sourceWeekStart, setSourceWeekStart] = useState(initialTargetWeekStart);
  const [targetWeekStart, setTargetWeekStart] = useState(initialTargetWeekStart);

  useEffect(() => {
    if (!isOpen) return;
    setSourceWeekStart(initialTargetWeekStart);
    setTargetWeekStart(initialTargetWeekStart);
  }, [initialTargetWeekStart, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      sourceWeekStart: formatDateInputValue(getStartOfWeekMonday(sourceWeekStart)),
      targetWeekStart: formatDateInputValue(getStartOfWeekMonday(targetWeekStart)),
    });
  };

  const inputClassName =
    'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => undefined : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest text-left align-middle shadow-xl transition-all sm:rounded-2xl">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="h-5 w-5 text-white" />
                    <Dialog.Title as="h3" className="font-headline text-xl font-extrabold text-white">
                      Copiar semana
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={onClose}
                    disabled={loading}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                  <div>
                    <label htmlFor="copy-week-source" className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Semana origen
                    </label>
                    <input
                      id="copy-week-source"
                      type="date"
                      value={sourceWeekStart}
                      onChange={(event) => setSourceWeekStart(event.target.value)}
                      className={inputClassName}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="copy-week-target" className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Semana destino
                    </label>
                    <input
                      id="copy-week-target"
                      type="date"
                      value={targetWeekStart}
                      onChange={(event) => setTargetWeekStart(event.target.value)}
                      className={inputClassName}
                      disabled={loading}
                      required
                    />
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Se copiarán empleados, turnos y resumen manual a una semana nueva.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high"
                      onClick={onClose}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                      loading={loading}
                    >
                      Copiar semana
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
