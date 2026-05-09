'use client';

import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface ReservaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: ReservaDraft) => void;
  plazaCodigo: string;
  tarifas: TarifaParking[];
}

const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
const inputClassName =
  'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 cursor-pointer';

function formatPrecio(precio: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(precio);
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcularFechaFin(fechaInicio: string, periodo?: 'mes' | 'quincena') {
  if (!fechaInicio || !periodo) return '';

  const baseDate = new Date(`${fechaInicio}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) return '';

  if (periodo === 'mes') {
    baseDate.setMonth(baseDate.getMonth() + 1);
  } else {
    baseDate.setDate(baseDate.getDate() + 15);
  }

  return formatDateInput(baseDate);
}

export default function ReservaForm({ isOpen, onClose, onContinue, plazaCodigo, tarifas }: ReservaFormProps) {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    id_tarifa: ''
  });

  const tarifaSeleccionada = useMemo(
    () => tarifas.find((tarifa) => tarifa.id === formData.id_tarifa) ?? null,
    [formData.id_tarifa, tarifas]
  );

  const fechaFinCalculada = useMemo(
    () => calcularFechaFin(formData.fecha_inicio, tarifaSeleccionada?.periodo),
    [formData.fecha_inicio, tarifaSeleccionada]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada) {
      return;
    }

    onContinue({
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: fechaFinCalculada,
      id_tarifa: formData.id_tarifa
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className="flex min-h-full w-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-xl transform overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all">
                <form onSubmit={handleSubmit}>
                  <div className="primary-gradient flex items-center justify-between px-6 py-4">
                    <Dialog.Title as="h3" className="font-headline text-xl font-extrabold tracking-tight text-white">
                      Nueva Reserva · Plaza {plazaCodigo}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                      onClick={onClose}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-5 p-6">
                    <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Datos de reserva</h4>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label htmlFor="tarifa" className={labelClassName}>
                            Tarifa
                          </label>
                          <select
                            id="tarifa"
                            className={inputClassName}
                            value={formData.id_tarifa}
                            onChange={(e) => setFormData((prev) => ({ ...prev, id_tarifa: e.target.value }))}
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
                          <label htmlFor="fecha_inicio" className={labelClassName}>
                            Fecha de inicio
                          </label>
                          <input
                            type="date"
                            id="fecha_inicio"
                            className={inputClassName}
                            value={formData.fecha_inicio}
                            onChange={(e) => setFormData((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="fecha_fin" className={labelClassName}>
                            Fecha de fin
                          </label>
                          <input
                            type="date"
                            id="fecha_fin"
                            className={`${inputClassName} text-on-surface-variant`}
                            value={fechaFinCalculada}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </section>

                    {tarifaSeleccionada ? (
                      <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                        <h4 className="font-headline text-lg font-extrabold text-primary-dark">Resumen</h4>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <p className={labelClassName}>Periodo</p>
                            <p className="text-sm font-semibold text-on-surface">
                              {tarifaSeleccionada.periodo === 'mes' ? 'Mensual' : 'Quincenal'}
                            </p>
                          </div>
                          <div>
                            <p className={labelClassName}>Importe</p>
                            <p className="text-sm font-semibold text-on-surface">{formatPrecio(tarifaSeleccionada.precio)}</p>
                          </div>
                          <div>
                            <p className={labelClassName}>Fin previsto</p>
                            <p className="text-sm font-semibold text-on-surface">
                              {fechaFinCalculada || '--'}
                            </p>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-3 border-t border-outline-variant/25 px-6 py-4">
                    <button
                      type="button"
                      className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada}
                      className="primary-gradient rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      Continuar al pago
                    </button>
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
