'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useActividades, type CampamentoProgramaDetalle } from '@/hooks/useActividades';
import {
  buildCampamentoDaysLabel,
  formatDateInputForDisplay
} from '@/lib/campamento';

interface ModalDetalleCampamentoProgramaProps {
  isOpen: boolean;
  programaId: string | null;
  onClose: () => void;
  onAddInscripcion: (programa: CampamentoProgramaDetalle) => void;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid'
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function getEstadoClass(estado: string) {
  switch (estado) {
    case 'confirmada':
    case 'activo':
      return 'bg-green-100 text-green-700';
    case 'pendiente':
      return 'bg-amber-100 text-amber-700';
    case 'cancelada':
    case 'cerrado':
      return 'bg-red-100 text-red-700';
    case 'completada':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-surface-container-high ${className}`} />;
}

function ModalDetalleCampamentoProgramaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="mt-4 h-5 w-3/4" />
          <SkeletonBlock className="mt-2 h-3 w-1/2" />
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
          <SkeletonBlock className="h-3 w-14" />
          <SkeletonBlock className="mt-4 h-7 w-24 rounded-full" />
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-4 h-8 w-16" />
        </div>
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-4 h-8 w-20" />
          <SkeletonBlock className="mt-2 h-3 w-28" />
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <SkeletonBlock className="mt-3 h-4 w-5/6" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-64" />
        </div>
        <SkeletonBlock className="h-11 w-40 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/20">
        <div className="grid grid-cols-6 gap-0 bg-surface-container-low/70 px-4 py-3">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="h-3 w-14 rounded-full" />
        </div>
        <div className="space-y-0">
          <div className="grid grid-cols-6 gap-0 border-t border-outline-variant/10 bg-surface-container-lowest px-4 py-5">
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-36 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-6 gap-0 border-t border-outline-variant/10 bg-surface-container-low px-4 py-5">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-full" />
            <SkeletonBlock className="h-4 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModalDetalleCampamentoPrograma({
  isOpen,
  programaId,
  onClose,
  onAddInscripcion
}: ModalDetalleCampamentoProgramaProps) {
  const { obtenerDetalleProgramaCampamento } = useActividades();
  const [programa, setPrograma] = useState<CampamentoProgramaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isOpen || !programaId) {
      setPrograma(null);
      setLoadError(null);
      setLoading(false);
      setShowSkeleton(false);
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    setPrograma(null);
    setLoadError(null);
    setLoading(true);
    setShowSkeleton(true);

    const load = async () => {
      const result = await obtenerDetalleProgramaCampamento(programaId);
      if (!cancelled) {
        if (result.success && result.programa) {
          setPrograma(result.programa);
          setLoadError(null);
        } else {
          setPrograma(null);
          setLoadError(result.message || 'No se pudo cargar el programa de campamento');
        }
        setLoading(false);
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, 300 - elapsed);
        window.setTimeout(() => {
          if (!cancelled) {
            setShowSkeleton(false);
          }
        }, remaining);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, obtenerDetalleProgramaCampamento, programaId]);

  const resumenHorario = useMemo(() => {
    if (!programa) return '';
    return `${buildCampamentoDaysLabel(programa.dias_semana)} · ${programa.hora_inicio.slice(0, 5)} - ${programa.hora_fin.slice(0, 5)}`;
  }, [programa]);

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
          <div className="fixed inset-0 bg-black/45" />
        </Transition.Child>

        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-6 py-5">
                <div>
                  <Dialog.Title className="text-xl font-black text-on-surface">
                    {programa?.servicio_nombre ?? 'Programa de campamento'}
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {programa
                      ? `${formatDateInputForDisplay(programa.fecha_inicio)} - ${formatDateInputForDisplay(programa.fecha_fin)}`
                      : 'Cargando detalle del programa...'}
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

              <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
                {loading || showSkeleton ? (
                  <ModalDetalleCampamentoProgramaSkeleton />
                ) : loadError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
                    {loadError}
                  </div>
                ) : !programa ? (
                  <div className="rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
                    No se encontró el programa.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Horario</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{resumenHorario}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {programa.turno_label || programa.turno_codigo || 'Turno sin etiqueta'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Estado</p>
                        <span className={`${getEstadoClass(programa.estado)} mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]`}>
                          {programa.estado}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Inscripciones</p>
                        <p className="mt-2 text-2xl font-black text-on-surface">{programa.total_inscripciones ?? 0}</p>
                      </div>
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Participantes</p>
                        <p className="mt-2 text-2xl font-black text-on-surface">{programa.total_participantes ?? 0}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{formatCurrency(programa.total_facturado ?? 0)} facturados</p>
                      </div>
                    </div>

                    {programa.notas ? (
                      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-outline">Notas</p>
                        <p className="mt-2 text-sm text-on-surface">{programa.notas}</p>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black text-on-surface">Inscripciones</h4>
                        <p className="text-sm text-on-surface-variant">
                          Cada inscripción corresponde a una familia o pagador.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddInscripcion(programa)}
                        className="primary-gradient inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 cursor-pointer"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Añadir inscripción
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-outline-variant/20">
                      {programa.inscripciones.length === 0 ? (
                        <div className="bg-surface-container-low px-4 py-10 text-center text-sm text-on-surface-variant">
                          Este programa todavía no tiene inscripciones.
                        </div>
                      ) : (
                        <table className="min-w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-surface-container-low/70">
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Pagador</th>
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Tarifa</th>
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Rango</th>
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Participantes</th>
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Estado</th>
                              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {programa.inscripciones.map((inscripcion, index) => (
                              <tr
                                key={inscripcion.id}
                                className={`border-t border-outline-variant/10 ${index % 2 ? 'bg-surface-container-low/25' : 'bg-surface-container-lowest'}`}
                              >
                                <td className="px-4 py-4">
                                  <p className="text-sm font-semibold text-on-surface">
                                    {inscripcion.cliente
                                      ? `${inscripcion.cliente.nombre} ${inscripcion.cliente.apellidos}`
                                      : 'Sin cliente'}
                                  </p>
                                  {inscripcion.nota ? (
                                    <p className="mt-1 text-xs text-on-surface-variant">{inscripcion.nota}</p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-4 text-sm font-semibold text-primary">
                                  {inscripcion.tarifa_nombre || inscripcion.tarifa_codigo || 'Tarifa'}
                                </td>
                                <td className="px-4 py-4 text-sm text-on-surface-variant">
                                  {formatDateTime(inscripcion.fecha_inicio)}<br />
                                  {formatDateTime(inscripcion.fecha_fin)}
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm font-semibold text-on-surface">{inscripcion.cantidad_participantes}</p>
                                  <p className="mt-1 text-xs text-on-surface-variant">
                                    {inscripcion.participantes.map((participante) => participante.nombre).join(', ')}
                                  </p>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`${getEstadoClass(inscripcion.estado)} inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                                    {inscripcion.estado}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm font-bold text-on-surface">
                                    {formatCurrency(inscripcion.precio_total_neto)}
                                  </p>
                                  {inscripcion.descuento_total > 0 ? (
                                    <p className="mt-1 text-xs text-emerald-700">
                                      Descuento: -{formatCurrency(inscripcion.descuento_total)}
                                    </p>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
