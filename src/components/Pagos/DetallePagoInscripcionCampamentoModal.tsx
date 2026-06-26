import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import type { Pago } from '@/hooks/usePagos';
import type { Reserva } from '@/hooks/useActividades';
import type { CampamentoInscripcion, CampamentoPrograma } from '@/lib/campamento';

interface DetallePagoInscripcionCampamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: Pago | null;
  reserva: Reserva | null;
  programa: CampamentoPrograma | null;
  inscripcion: CampamentoInscripcion | null;
  onCompletarPago?: (pago: Pago) => Promise<void>;
  onCancelarPago?: (pago: Pago) => Promise<void>;
}

const formatearMetodoPago = (metodo: Pago['metodo']) => {
  const metodosFormateados: Record<Pago['metodo'], string> = {
    efectivo: 'Efectivo',
    tpv: 'Tarjeta',
    tpv_online: 'Tarjeta Online',
    transferencia: 'Transferencia',
    bizum_alfonso: 'Bizum Alfonso',
    bizum_robe: 'Bizum Robe',
    bizum_alba: 'Bizum Alba',
    bizum_maria: 'Bizum Maria',
    bizum_jm: 'Bizum JM',
    angeles: 'Angeles'
  };
  return metodosFormateados[metodo] || metodo;
};

const formatearEstado = (estado: Pago['estado']) => estado.charAt(0).toUpperCase() + estado.slice(1);

const getEstadoColor = (estado: Pago['estado']) => {
  switch (estado) {
    case 'completado':
      return 'bg-emerald-100 text-emerald-700';
    case 'pendiente':
      return 'bg-amber-100 text-amber-700';
    case 'cancelado':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-surface-container-high text-on-surface-variant';
  }
};

const formatearEstadoReserva = (estado: string) => estado.charAt(0).toUpperCase() + estado.slice(1);

const formatearImporte = (importe: number) => `${new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
}).format(importe)} €`;

const formatearFecha = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('es-ES');
};

const formatearFechaDia = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-ES');
};

function buildDiscountGroups(
  pago: Pago,
  inscripcion: CampamentoInscripcion | null
) {
  if (pago.descuentos_snapshot && pago.descuentos_snapshot.length > 0) {
    const grouped = new Map<string, {
      participanteNombre: string;
      items: Array<{ id: string; descuento_nombre: string; importe_aplicado: number }>;
      total: number;
    }>();

    pago.descuentos_snapshot.forEach((snapshot) => {
      const current = grouped.get(snapshot.participante_nombre) ?? {
        participanteNombre: snapshot.participante_nombre,
        items: [],
        total: 0
      };
      current.items.push({
        id: snapshot.id,
        descuento_nombre: snapshot.descuento_nombre,
        importe_aplicado: snapshot.importe_aplicado
      });
      current.total += snapshot.importe_aplicado;
      grouped.set(snapshot.participante_nombre, current);
    });

    return Array.from(grouped.values());
  }

  const grouped = new Map<string, {
    participanteNombre: string;
    items: Array<{ id: string; descuento_nombre: string; importe_aplicado: number }>;
    total: number;
  }>();

  (inscripcion?.participantes ?? []).forEach((participante) => {
    if (!participante.descuentos_aplicados?.length) {
      return;
    }

    grouped.set(participante.nombre, {
      participanteNombre: participante.nombre,
      items: participante.descuentos_aplicados.map((descuento) => ({
        id: descuento.id,
        descuento_nombre: descuento.nombre,
        importe_aplicado: descuento.importe_aplicado
      })),
      total: participante.descuentos_aplicados.reduce((total, descuento) => total + descuento.importe_aplicado, 0)
    });
  });

  return Array.from(grouped.values());
}

export default function DetallePagoInscripcionCampamentoModal({
  isOpen,
  onClose,
  pago,
  reserva,
  programa,
  inscripcion,
  onCompletarPago,
  onCancelarPago
}: DetallePagoInscripcionCampamentoModalProps) {
  const [isCompletando, setIsCompletando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);

  if (!pago || !reserva) {
    return null;
  }

  const clienteLabel = pago.cliente
    ? `${pago.cliente.nombre} ${pago.cliente.apellidos}`
    : 'Cliente no establecido';
  const dataLabelClassName = 'text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const dataValueClassName = 'mt-1 text-sm font-semibold text-on-surface';
  const tarifaLabel = inscripcion?.tarifa_nombre || inscripcion?.tarifa_codigo || 'Tarifa';
  const grossAmount = inscripcion?.precio_bruto ?? reserva.total_bruto ?? reserva.precio;
  const discountAmount = inscripcion?.descuento_total ?? reserva.total_descuento ?? 0;
  const netAmount = inscripcion?.precio_total_neto ?? inscripcion?.precio_total ?? reserva.total_neto ?? reserva.precio;
  const discountGroups = buildDiscountGroups(pago, inscripcion);

  const handleCompletarPago = async () => {
    if (!onCompletarPago) return;
    try {
      setIsCompletando(true);
      await onCompletarPago(pago);
      toast.success('Pago completado correctamente');
    } catch (error) {
      console.error('Error al completar pago de campamento:', error);
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
      console.error('Error al cancelar pago de campamento:', error);
      toast.error('Error al cancelar el pago');
    } finally {
      setIsCancelando(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="max-h-[90svh] w-full max-w-4xl transform overflow-y-auto rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all sm:rounded-2xl">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <Dialog.Title as="h3" className="font-headline text-xl font-extrabold tracking-tight text-white">
                    Pago de Inscripcion de Campamento
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Cliente pagador</p>
                      <p className={dataValueClassName}>{clienteLabel}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Importe</p>
                      <p className={dataValueClassName}>{formatearImporte(pago.importe)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Estado del pago</p>
                      <span className={`${getEstadoColor(pago.estado)} mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                        {formatearEstado(pago.estado)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Concepto</p>
                      <p className={dataValueClassName}>{pago.concepto}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Metodo de pago</p>
                      <p className={dataValueClassName}>{formatearMetodoPago(pago.metodo)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Programa</p>
                      <p className={dataValueClassName}>{programa?.servicio_nombre || reserva.actividad?.nombre || 'Campamento'}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {programa ? `${formatearFechaDia(programa.fecha_inicio)} - ${formatearFechaDia(programa.fecha_fin)}` : 'Programa no disponible'}
                      </p>
                      {programa ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {programa.turno_label || programa.turno_codigo || 'Turno'} · {programa.hora_inicio.slice(0, 5)} - {programa.hora_fin.slice(0, 5)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Inscripcion</p>
                      <p className={dataValueClassName}>{tarifaLabel}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {formatearFecha(inscripcion?.fecha_inicio)} - {formatearFecha(inscripcion?.fecha_fin)}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {inscripcion?.cantidad_participantes ?? reserva.cantidad_reservada} participante(s) · {formatearEstadoReserva(inscripcion?.estado || reserva.estado)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Precio unitario</p>
                      <p className={dataValueClassName}>{formatearImporte(inscripcion?.precio_unitario ?? 0)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Total bruto</p>
                      <p className={dataValueClassName}>{formatearImporte(grossAmount)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Descuento total</p>
                      <p className={dataValueClassName}>{formatearImporte(discountAmount)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4 md:col-span-3">
                      <p className={dataLabelClassName}>Total neto inscripcion</p>
                      <p className={dataValueClassName}>{formatearImporte(netAmount)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <p className={dataLabelClassName}>Participantes</p>
                    {inscripcion?.participantes && inscripcion.participantes.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {inscripcion.participantes.map((participante) => (
                          <div key={participante.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2">
                            <p className="text-sm font-semibold text-on-surface">{participante.nombre}</p>
                            <p className="text-xs text-on-surface-variant">DNI: {participante.dni || '-'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`${dataValueClassName} text-on-surface-variant`}>
                        No hay participantes registrados para esta inscripcion.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <p className={dataLabelClassName}>Descuentos aplicados</p>
                    {discountGroups.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {discountGroups.map((group) => (
                          <div key={group.participanteNombre} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-on-surface">{group.participanteNombre}</p>
                              <span className="text-xs font-black uppercase tracking-[0.08em] text-primary">
                                -{formatearImporte(group.total)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                                  <span>{item.descuento_nombre}</span>
                                  <span>-{formatearImporte(item.importe_aplicado)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`${dataValueClassName} text-on-surface-variant`}>
                        No se aplicaron descuentos en esta inscripción.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <p className={dataLabelClassName}>Fecha del pago</p>
                    <p className={dataValueClassName}>{formatearFecha(pago.created_at)}</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/25 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                  >
                    Cerrar
                  </button>

                  {pago.estado === 'pendiente' && onCompletarPago ? (
                    <button
                      type="button"
                      onClick={handleCompletarPago}
                      disabled={isCompletando || isCancelando}
                      className="min-h-11 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCompletando ? 'Completando...' : 'Completar Pago'}
                    </button>
                  ) : null}

                  {pago.estado === 'pendiente' && onCancelarPago ? (
                    <button
                      type="button"
                      onClick={handleCancelarPago}
                      disabled={isCompletando || isCancelando}
                      className="min-h-11 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCancelando ? 'Cancelando...' : 'Cancelar Pago'}
                    </button>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
