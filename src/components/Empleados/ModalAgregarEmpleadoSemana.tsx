import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import type { Empleado } from '@/hooks/useEmpleados';

interface ModalAgregarEmpleadoSemanaProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (empleadoId: string) => Promise<void>;
  empleadosDisponibles: Empleado[];
  loading?: boolean;
}

export default function ModalAgregarEmpleadoSemana({
  isOpen,
  onClose,
  onSubmit,
  empleadosDisponibles,
  loading = false,
}: ModalAgregarEmpleadoSemanaProps) {
  const sortedEmployees = useMemo(
    () => [...empleadosDisponibles].sort((left, right) => `${left.nombre} ${left.apellidos}`.localeCompare(`${right.nombre} ${right.apellidos}`, 'es')),
    [empleadosDisponibles],
  );
  const [empleadoId, setEmpleadoId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEmpleadoId(sortedEmployees[0]?.id ?? '');
  }, [isOpen, sortedEmployees]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!empleadoId) return;
    await onSubmit(empleadoId);
  };

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
                    <UserPlusIcon className="h-5 w-5 text-white" />
                    <Dialog.Title as="h3" className="font-headline text-xl font-extrabold text-white">
                      Añadir empleado
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
                    <label htmlFor="empleado-semana-select" className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Empleado
                    </label>
                    <select
                      id="empleado-semana-select"
                      value={empleadoId}
                      onChange={(event) => setEmpleadoId(event.target.value)}
                      className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      disabled={loading || sortedEmployees.length === 0}
                    >
                      {sortedEmployees.length === 0 ? (
                        <option value="">No hay empleados disponibles</option>
                      ) : null}
                      {sortedEmployees.map((empleado) => (
                        <option key={empleado.id} value={empleado.id}>
                          {empleado.nombre} {empleado.apellidos}
                        </option>
                      ))}
                    </select>
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
                      disabled={!empleadoId}
                    >
                      Añadir
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
