'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronLeftIcon, CreditCardIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PagoReservaModal from '@/components/Actividades/PagoReservaModal';
import { SelectorParticipante } from '@/components/Actividades/SelectorParticipante';
import ModalNuevoParticipanteCampamento from '@/components/Actividades/ModalNuevoParticipanteCampamento';
import { useActividades, type TarifaActividad } from '@/hooks/useActividades';
import { useCampamentoParticipantes } from '@/hooks/useCampamentoParticipantes';
import type { CampamentoParticipanteCatalogo, CampamentoPrograma } from '@/lib/campamento';
import { formatPrice } from '@/lib/formatUtils';

interface ModalNuevaReservaCampamentoInscripcionProps {
  isOpen: boolean;
  programa: CampamentoPrograma;
  onClose: () => void;
  onSubmit: (data: {
    empresa: 'Flecha Extreme' | 'Rober';
    tipoActividad: 'campamento';
    actividad: string;
    cantidadReservada: number;
    numeroPersonas: number;
    precio: number;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    nota?: string;
  }) => void | Promise<void>;
  onToast: (toast: { visible: boolean; message: string; type: 'success' | 'error' }) => void;
}

interface ParticipanteDraft {
  participanteId: string | null;
  nombre: string;
  dni: string;
}

function buildDefaultParticipantes(count: number): ParticipanteDraft[] {
  return Array.from({ length: count }, () => ({
    participanteId: null,
    nombre: '',
    dni: ''
  }));
}

function formatProgramDateRange(programa: CampamentoPrograma) {
  return `${new Date(`${programa.fecha_inicio}T00:00:00`).toLocaleDateString('es-ES')} - ${new Date(`${programa.fecha_fin}T00:00:00`).toLocaleDateString('es-ES')}`;
}

export default function ModalNuevaReservaCampamentoInscripcion({
  isOpen,
  programa,
  onClose,
  onSubmit,
  onToast
}: ModalNuevaReservaCampamentoInscripcionProps) {
  const { obtenerTarifasActividad, loadingActividades } = useActividades();
  const {
    participantes: participantesCatalogo,
    loading: loadingParticipantesCatalogo,
    refreshParticipantes
  } = useCampamentoParticipantes();
  const [tarifas, setTarifas] = useState<TarifaActividad[]>([]);
  const [tarifaId, setTarifaId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(programa.fecha_inicio);
  const [fechaFin, setFechaFin] = useState(programa.fecha_fin);
  const [numeroPersonas, setNumeroPersonas] = useState(1);
  const [participantes, setParticipantes] = useState<ParticipanteDraft[]>(buildDefaultParticipantes(1));
  const [nota, setNota] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showNuevoParticipanteModal, setShowNuevoParticipanteModal] = useState(false);
  const [participanteIndexNuevo, setParticipanteIndexNuevo] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTarifaId('');
    setFechaInicio(programa.fecha_inicio);
    setFechaFin(programa.fecha_fin);
    setNumeroPersonas(1);
    setParticipantes(buildDefaultParticipantes(1));
    setNota('');
    setShowPagoModal(false);
    setPaymentCompleted(false);
    setShowNuevoParticipanteModal(false);
    setParticipanteIndexNuevo(null);
    setErrors({});
  }, [isOpen, programa]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const loadTarifas = async () => {
      const result = await obtenerTarifasActividad(programa.servicio_id);
      if (!cancelled) {
        setTarifas(result);
        if (result.length === 1) {
          setTarifaId(result[0].id);
        }
      }
    };

    loadTarifas();

    return () => {
      cancelled = true;
    };
  }, [isOpen, obtenerTarifasActividad, programa.servicio_id]);

  useEffect(() => {
    setParticipantes((prev) => {
      if (prev.length === numeroPersonas) {
        return prev;
      }

      if (prev.length > numeroPersonas) {
        return prev.slice(0, numeroPersonas);
      }

      return [...prev, ...buildDefaultParticipantes(numeroPersonas - prev.length)];
    });
  }, [numeroPersonas]);

  const tarifaSeleccionada = useMemo(
    () => tarifas.find((tarifa) => tarifa.id === tarifaId) ?? null,
    [tarifaId, tarifas]
  );

  const total = useMemo(() => {
    if (!tarifaSeleccionada) return 0;
    return Number((tarifaSeleccionada.precio * numeroPersonas).toFixed(2));
  }, [numeroPersonas, tarifaSeleccionada]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!tarifaId) {
      nextErrors.tarifa = 'Debes seleccionar una tarifa';
    }

    if (!fechaInicio) {
      nextErrors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!fechaFin) {
      nextErrors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (fechaInicio && fechaInicio < programa.fecha_inicio) {
      nextErrors.fechaInicio = 'La inscripción no puede empezar antes del programa';
    }

    if (fechaFin && fechaFin > programa.fecha_fin) {
      nextErrors.fechaFin = 'La inscripción no puede terminar después del programa';
    }

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      nextErrors.fechaFin = 'La fecha de fin debe ser igual o posterior a la de inicio';
    }

    if (!numeroPersonas || numeroPersonas < 1) {
      nextErrors.numeroPersonas = 'Debes indicar al menos 1 participante';
    }

    const seen = new Set<string>();
    participantes.forEach((participante, index) => {
      if (!participante.nombre.trim()) {
        nextErrors[`participante-${index}`] = 'Debes seleccionar o crear un participante';
        return;
      }

      const duplicateKey = participante.participanteId
        ? `id:${participante.participanteId}`
        : `raw:${participante.nombre.trim().toLowerCase()}|${participante.dni.trim().toUpperCase()}`;

      if (seen.has(duplicateKey)) {
        nextErrors[`participante-${index}`] = 'Este participante ya está añadido en la inscripción';
        return;
      }

      seen.add(duplicateKey);
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSeleccionParticipante = (
    index: number,
    participante: CampamentoParticipanteCatalogo | null
  ) => {
    setParticipantes((prev) => prev.map((item, idx) => {
      if (idx !== index) {
        return item;
      }

      if (!participante) {
        return {
          participanteId: null,
          nombre: '',
          dni: ''
        };
      }

      return {
        participanteId: participante.id,
        nombre: participante.nombre,
        dni: participante.dni ?? ''
      };
    }));

    setErrors((prev) => ({ ...prev, [`participante-${index}`]: '' }));
  };

  const handleAbrirNuevoParticipante = (index: number) => {
    setParticipanteIndexNuevo(index);
    setShowNuevoParticipanteModal(true);
  };

  const handleNuevoParticipanteSuccess = async (participante: CampamentoParticipanteCatalogo) => {
    if (participanteIndexNuevo === null) {
      return;
    }

    handleSeleccionParticipante(participanteIndexNuevo, participante);
    try {
      await refreshParticipantes();
    } finally {
      setShowNuevoParticipanteModal(false);
      setParticipanteIndexNuevo(null);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    setShowPagoModal(true);
    setPaymentCompleted(false);
  };

  const handlePagoSubmit = async () => {
    await onSubmit({
      empresa: 'Flecha Extreme',
      tipoActividad: 'campamento',
      actividad: programa.servicio_nombre,
      cantidadReservada: numeroPersonas,
      numeroPersonas,
      precio: total,
      fechaInicio,
      fechaFin,
      horaInicio: programa.hora_inicio.slice(0, 5),
      horaFin: programa.hora_fin.slice(0, 5),
      nota: nota || undefined
    });

    onToast({
      visible: true,
      message: 'Inscripción de campamento creada correctamente',
      type: 'success'
    });
    setPaymentCompleted(true);
  };

  const handleClosePago = () => {
    if (paymentCompleted) {
      setShowPagoModal(false);
      onClose();
      return;
    }

    setShowPagoModal(false);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/45" />
          </Transition.Child>

          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
                    <div>
                      <Dialog.Title className="text-xl font-black text-on-surface">
                        Nueva inscripción
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {programa.servicio_nombre} · {formatProgramDateRange(programa)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-outline-variant/30 p-2 text-on-surface-variant transition hover:border-primary/30 hover:text-primary cursor-pointer"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Programa</p>
                        <p className="mt-2 text-lg font-black text-on-surface">{programa.servicio_nombre}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {programa.turno_label || programa.turno_codigo || 'Turno'} · {programa.hora_inicio.slice(0, 5)} - {programa.hora_fin.slice(0, 5)}
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-1">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tarifa *
                          </label>
                          <select
                            value={tarifaId}
                            onChange={(event) => {
                              setTarifaId(event.target.value);
                              setErrors((prev) => ({ ...prev, tarifa: '' }));
                            }}
                            disabled={loadingActividades}
                            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.tarifa ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer`}
                          >
                            <option value="">
                              {loadingActividades ? 'Cargando tarifas...' : 'Selecciona una tarifa'}
                            </option>
                            {tarifas.map((tarifa) => (
                              <option key={tarifa.id} value={tarifa.id}>
                                {tarifa.nombre_tarifa || tarifa.codigo} · {tarifa.precio}€
                              </option>
                            ))}
                          </select>
                          {errors.tarifa ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tarifa}</p> : null}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fecha inicio *
                          </label>
                          <input
                            type="date"
                            value={fechaInicio}
                            min={programa.fecha_inicio}
                            max={programa.fecha_fin}
                            onChange={(event) => {
                              setFechaInicio(event.target.value);
                              setErrors((prev) => ({ ...prev, fechaInicio: '' }));
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.fechaInicio ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                          />
                          {errors.fechaInicio ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaInicio}</p> : null}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Fecha fin *
                          </label>
                          <input
                            type="date"
                            value={fechaFin}
                            min={programa.fecha_inicio}
                            max={programa.fecha_fin}
                            onChange={(event) => {
                              setFechaFin(event.target.value);
                              setErrors((prev) => ({ ...prev, fechaFin: '' }));
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.fechaFin ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                          />
                          {errors.fechaFin ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fechaFin}</p> : null}
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Participantes *
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={numeroPersonas}
                            onChange={(event) => {
                              const nextValue = Math.max(1, Number(event.target.value || 1));
                              setNumeroPersonas(nextValue);
                              setErrors((prev) => ({ ...prev, numeroPersonas: '' }));
                            }}
                            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
                              errors.numeroPersonas ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                          />
                          {errors.numeroPersonas ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.numeroPersonas}</p> : null}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Participantes</p>
                            <p className="mt-1 text-sm text-on-surface-variant">
                              Busca por nombre o DNI. Si no existe, créalo y quedará guardado para próximas reservas.
                            </p>
                          </div>
                          <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                            {numeroPersonas} persona{numeroPersonas === 1 ? '' : 's'}
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {participantes.map((participante, index) => (
                            <div key={index} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3">
                              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                                <div>
                                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Participante {index + 1} *
                                  </label>
                                  <SelectorParticipante
                                    selectedParticipanteId={participante.participanteId}
                                    onParticipanteChange={(value) => handleSeleccionParticipante(index, value)}
                                    placeholder="Buscar participante por nombre o DNI"
                                    participantesOverride={participantesCatalogo}
                                    loadingOverride={loadingParticipantesCatalogo}
                                    selectedDisplayName={participante.nombre}
                                  />
                                  {participante.dni ? (
                                    <p className="mt-1 text-xs text-on-surface-variant">DNI: {participante.dni}</p>
                                  ) : null}
                                  {errors[`participante-${index}`] ? (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`participante-${index}`]}</p>
                                  ) : null}
                                </div>

                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirNuevoParticipante(index)}
                                    className="inline-flex items-center rounded-md border border-primary/40 bg-white px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 dark:bg-gray-800 cursor-pointer"
                                  >
                                    <PlusIcon className="mr-1.5 h-4 w-4" />
                                    Crear participante
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nota
                        </label>
                        <textarea
                          value={nota}
                          onChange={(event) => setNota(event.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Observaciones de la inscripción..."
                        />
                      </div>

                      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Resumen económico</p>
                            <p className="mt-1 text-sm text-primary-dark">
                              {tarifaSeleccionada?.nombre_tarifa || 'Selecciona una tarifa'} · {numeroPersonas} participante{numeroPersonas === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-primary/80">Total</p>
                            <p className="text-2xl font-black text-primary-dark">{formatPrice(total)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-outline-variant/20 px-6 py-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                    >
                      <ChevronLeftIcon className="mr-2 h-4 w-4" />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 cursor-pointer"
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      Continuar al pago
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <ModalNuevoParticipanteCampamento
        isOpen={showNuevoParticipanteModal}
        onClose={() => {
          setShowNuevoParticipanteModal(false);
          setParticipanteIndexNuevo(null);
        }}
        onSuccess={handleNuevoParticipanteSuccess}
      />

      <PagoReservaModal
        isOpen={showPagoModal}
        onClose={handleClosePago}
        onSubmit={handlePagoSubmit}
        requireCliente={true}
        actividad={{
          id: programa.servicio_id,
          nombre: programa.servicio_nombre,
          precio: total,
          cantidad: numeroPersonas,
          duracion: tarifaSeleccionada?.nombre_tarifa || tarifaSeleccionada?.codigo || 'Campamento',
          empresa: 'Flecha Extreme',
          numeroPersonas,
          fechaInicio,
          fechaFin,
          horaInicio: programa.hora_inicio.slice(0, 5),
          horaFin: programa.hora_fin.slice(0, 5),
          nota: nota || undefined,
          modoPrecio: 'por_persona',
          resumenHorario: `${programa.hora_inicio.slice(0, 5)} - ${programa.hora_fin.slice(0, 5)}`,
          resumenFechas: `${fechaInicio} - ${fechaFin}`,
          campamentoProgramaId: programa.id,
          tarifaId: tarifaSeleccionada?.id,
          participantes: participantes.map((participante) => ({
            participanteId: participante.participanteId ?? undefined,
            nombre: participante.nombre.trim(),
            dni: participante.dni.trim() || undefined
          }))
        }}
      />
    </>
  );
}
