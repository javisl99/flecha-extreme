import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import type { Empleado } from '@/hooks/useEmpleados';
import { formatDateInputValue, getStartOfWeekMonday } from '@/lib/empleadoHorarios';

interface ModalSemanaHorarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { semanaInicio: string; employeeIds: string[] }) => Promise<void>;
  empleados: Empleado[];
  initialWeekStart: string;
  loading?: boolean;
}

export default function ModalSemanaHorario({
  isOpen,
  onClose,
  onSubmit,
  empleados,
  initialWeekStart,
  loading = false,
}: ModalSemanaHorarioProps) {
  const [semanaInicio, setSemanaInicio] = useState(initialWeekStart);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setSemanaInicio(initialWeekStart);
    setSelectedEmployeeIds([]);
  }, [initialWeekStart, isOpen]);

  const sortedEmployees = useMemo(
    () => [...empleados].sort((left, right) => `${left.nombre} ${left.apellidos}`.localeCompare(`${right.nombre} ${right.apellidos}`, 'es')),
    [empleados],
  );

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((current) => (
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    ));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      semanaInicio: formatDateInputValue(getStartOfWeekMonday(semanaInicio)),
      employeeIds: selectedEmployeeIds,
    });
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
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest text-left align-middle shadow-xl transition-all sm:rounded-2xl">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-white" />
                    <Dialog.Title as="h3" className="font-headline text-xl font-extrabold text-white">
                      Crear semana de horarios
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
                    <label htmlFor="semana-horario-inicio" className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Semana
                    </label>
                    <input
                      id="semana-horario-inicio"
                      type="date"
                      value={semanaInicio}
                      onChange={(event) => setSemanaInicio(event.target.value)}
                      className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                      disabled={loading}
                      required
                    />
                    <p className="mt-2 text-xs text-on-surface-variant">
                      La fecha se normaliza automáticamente al lunes de esa semana.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4 text-primary" />
                      <label className="block text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                        Empleados iniciales
                      </label>
                    </div>
                    <div className="max-h-72 space-y-2 overflow-y-auto rounded-[1.25rem] border border-outline-variant/30 bg-surface-container-low p-3">
                      {sortedEmployees.length === 0 ? (
                        <p className="px-2 py-4 text-sm text-on-surface-variant">
                          No hay empleados disponibles.
                        </p>
                      ) : (
                        sortedEmployees.map((empleado) => {
                          const checked = selectedEmployeeIds.includes(empleado.id);
                          return (
                            <label
                              key={empleado.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                                checked
                                  ? 'border-primary/30 bg-primary/10'
                                  : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/20 hover:bg-surface-container-high'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEmployee(empleado.id)}
                                className="mt-1 h-4 w-4 rounded border-outline-variant/45 text-primary focus:ring-primary/20"
                                disabled={loading}
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-on-surface">
                                  {empleado.nombre} {empleado.apellidos}
                                </span>
                                <span className="block text-xs text-on-surface-variant">
                                  {empleado.email || 'Sin email'} · {empleado.movil || 'Sin móvil'}
                                </span>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
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
                      Crear semana
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
