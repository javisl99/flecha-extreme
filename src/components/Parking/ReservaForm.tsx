'use client';

import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'dia' | 'semana' | 'quincena' | 'mes';
  precio: number;
}

interface PlazaDisponible {
  id: string;
  codigo: string;
  disponible: boolean;
  reservada: boolean;
}

interface ReservaDraft {
  fecha_inicio: string;
  fecha_fin: string;
  id_tarifa: string;
  plaza_id: string;
  plaza_codigo: string;
}

interface ReservaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (data: ReservaDraft) => void;
  tipoLabel: string;
  tarifas: TarifaParking[];
  onBuscarPlazasDisponibles: (data: {
    fechaInicio: string;
    fechaFin: string;
    idTarifa: string;
  }) => Promise<PlazaDisponible[]>;
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

function getPeriodoLabel(periodo: TarifaParking['periodo']) {
  const labels: Record<TarifaParking['periodo'], string> = {
    dia: 'Diaria',
    semana: 'Semanal',
    quincena: 'Quincenal',
    mes: 'Mensual'
  };

  return labels[periodo];
}

function calcularFechaFin(fechaInicio: string, periodo?: TarifaParking['periodo']) {
  if (!fechaInicio || !periodo) return '';

  const baseDate = new Date(`${fechaInicio}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) return '';

  if (periodo === 'dia') {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (periodo === 'semana') {
    baseDate.setDate(baseDate.getDate() + 7);
  } else if (periodo === 'quincena') {
    baseDate.setDate(baseDate.getDate() + 15);
  } else {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }

  return formatDateInput(baseDate);
}

export default function ReservaForm({
  isOpen,
  onClose,
  onContinue,
  tipoLabel,
  tarifas,
  onBuscarPlazasDisponibles
}: ReservaFormProps) {
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_tarifa: '',
    plaza_id: ''
  });
  const [plazasDisponibles, setPlazasDisponibles] = useState<PlazaDisponible[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlazasModal, setShowPlazasModal] = useState(false);

  const tarifaSeleccionada = useMemo(
    () => tarifas.find((tarifa) => tarifa.id === formData.id_tarifa) ?? null,
    [formData.id_tarifa, tarifas]
  );

  const fechaFinSugerida = useMemo(
    () => calcularFechaFin(formData.fecha_inicio, tarifaSeleccionada?.periodo),
    [formData.fecha_inicio, tarifaSeleccionada]
  );
  const fechaFinCalculada = formData.fecha_fin || fechaFinSugerida;
  const rangoValido = Boolean(
    formData.fecha_inicio &&
      fechaFinCalculada &&
      fechaFinCalculada > formData.fecha_inicio
  );

  const plazaSeleccionada = useMemo(
    () => plazasDisponibles.find((plaza) => plaza.id === formData.plaza_id) ?? null,
    [formData.plaza_id, plazasDisponibles]
  );

  const handleUpdateTarifa = (tarifaId: string) => {
    const tarifa = tarifas.find((item) => item.id === tarifaId) ?? null;
    setFormData((prev) => ({
      ...prev,
      id_tarifa: tarifaId,
      fecha_fin: calcularFechaFin(prev.fecha_inicio, tarifa?.periodo),
      plaza_id: ''
    }));
    setPlazasDisponibles([]);
  };

  const handleUpdateFechaInicio = (fechaInicio: string) => {
    setFormData((prev) => ({
      ...prev,
      fecha_inicio: fechaInicio,
      fecha_fin: calcularFechaFin(fechaInicio, tarifaSeleccionada?.periodo),
      plaza_id: ''
    }));
    setPlazasDisponibles([]);
  };

  const handleUpdateFechaFin = (fechaFin: string) => {
    setFormData((prev) => ({
      ...prev,
      fecha_fin: fechaFin,
      plaza_id: ''
    }));
    setPlazasDisponibles([]);
  };

  const handleBuscarPlazas = async () => {
    if (!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada || !rangoValido) {
      return;
    }

    setIsSearching(true);
    setFormData((prev) => ({ ...prev, plaza_id: '' }));

    try {
      const availablePlazas = await onBuscarPlazasDisponibles({
        fechaInicio: formData.fecha_inicio,
        fechaFin: fechaFinCalculada,
        idTarifa: formData.id_tarifa
      });

      setPlazasDisponibles(availablePlazas);
      setShowPlazasModal(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada || !plazaSeleccionada || !rangoValido) {
      return;
    }

    onContinue({
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: fechaFinCalculada,
      id_tarifa: formData.id_tarifa,
      plaza_id: plazaSeleccionada.id,
      plaza_codigo: plazaSeleccionada.codigo
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
              <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all">
                <form onSubmit={handleSubmit}>
                  <div className="primary-gradient flex items-center justify-between px-6 py-4">
                    <Dialog.Title as="h3" className="font-headline text-xl font-extrabold tracking-tight text-white">
                      Nueva Reserva · {tipoLabel}
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
                            onChange={(e) => handleUpdateTarifa(e.target.value)}
                            required
                          >
                            <option value="">Selecciona una tarifa</option>
                            {tarifas.map((tarifa) => (
                              <option key={tarifa.id} value={tarifa.id}>
                                {getPeriodoLabel(tarifa.periodo)} - {formatPrecio(tarifa.precio)}
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
                            onChange={(e) => handleUpdateFechaInicio(e.target.value)}
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
                            min={formData.fecha_inicio || undefined}
                            className={inputClassName}
                            value={fechaFinCalculada}
                            onChange={(e) => handleUpdateFechaFin(e.target.value)}
                          />
                          <p className="mt-1 text-xs text-on-surface-variant">Se calcula automáticamente, pero puedes editarla.</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleBuscarPlazas}
                          disabled={!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada || !rangoValido || isSearching}
                          className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          {isSearching ? 'Buscando plazas...' : 'Ver plazas'}
                        </button>
                      </div>
                    </section>

                    <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Plaza seleccionada</h4>
                      <div className="mt-4">
                        <p className="text-sm text-on-surface-variant">
                          {plazaSeleccionada
                            ? `Plaza ${plazaSeleccionada.codigo}`
                            : 'Aún no hay plaza seleccionada. Pulsa “Ver plazas”.'}
                        </p>
                        {plazasDisponibles.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setShowPlazasModal(true)}
                            className="mt-3 rounded-full border border-outline-variant/45 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                          >
                            Abrir mapa de plazas
                          </button>
                        ) : null}
                      </div>
                    </section>

                    {tarifaSeleccionada ? (
                      <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                        <h4 className="font-headline text-lg font-extrabold text-primary-dark">Resumen</h4>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <p className={labelClassName}>Periodo</p>
                            <p className="text-sm font-semibold text-on-surface">{getPeriodoLabel(tarifaSeleccionada.periodo)}</p>
                          </div>
                          <div>
                            <p className={labelClassName}>Importe</p>
                            <p className="text-sm font-semibold text-on-surface">{formatPrecio(tarifaSeleccionada.precio)}</p>
                          </div>
                          <div>
                            <p className={labelClassName}>Fin previsto</p>
                            <p className="text-sm font-semibold text-on-surface">{fechaFinCalculada || '--'}</p>
                          </div>
                          <div>
                            <p className={labelClassName}>Plaza</p>
                            <p className="text-sm font-semibold text-on-surface">{plazaSeleccionada?.codigo || '--'}</p>
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
                      disabled={!formData.id_tarifa || !formData.fecha_inicio || !fechaFinCalculada || !rangoValido || !formData.plaza_id}
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

      <Transition.Root show={showPlazasModal} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={() => setShowPlazasModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl">
                <div className="primary-gradient flex items-center justify-between px-4 py-3">
                  <Dialog.Title className="font-headline text-xl font-extrabold tracking-tight text-white">
                    Plazas · {tipoLabel}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                    onClick={() => setShowPlazasModal(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Disponible</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Reservada en el rango</span>
                  </div>

                  {plazasDisponibles.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No hay plazas para mostrar en este rango.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {plazasDisponibles.map((plaza) => {
                        const isSelected = plaza.id === formData.plaza_id;
                        const isAvailable = plaza.disponible && !plaza.reservada;

                        return (
                          <button
                            key={plaza.id}
                            type="button"
                            onClick={() => {
                              if (!isAvailable) return;
                              setFormData((prev) => ({ ...prev, plaza_id: plaza.id }));
                            }}
                            className={`aspect-square cursor-pointer rounded-xl border-2 p-2 text-base font-bold transition ${
                              isAvailable
                                ? isSelected
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border-amber-300 bg-amber-50 text-amber-800'
                            }`}
                            title={isAvailable ? 'Disponible' : 'Reservada en el rango'}
                          >
                            {plaza.codigo}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-outline-variant/25 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setShowPlazasModal(false)}
                    className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={!plazaSeleccionada}
                    onClick={() => setShowPlazasModal(false)}
                    className="primary-gradient rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Usar plaza seleccionada
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </Transition.Root>
  );
}
