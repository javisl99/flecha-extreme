import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { paymentMethodCodeLabel } from '@/lib/contabilidad';

type MetodoPago = 'efectivo' | 'tpv' | 'transferencia' | 'bizum_alfonso';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';
type EstadoPlazaVisual = 'disponible' | 'reservada' | 'ocupada';
type EstadoReservaParking = 'pendiente' | 'activa' | 'cancelada' | 'finalizada';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'dia' | 'semana' | 'quincena' | 'mes';
  precio: number;
}

interface PagoParking {
  id: string;
  id_cliente: string | null;
  origen_tipo: 'parking';
  origen_id: string;
  concepto: string;
  importe: number;
  metodo: MetodoPago;
  estado: EstadoPago;
}

interface ReservaParkingInfo {
  id: string;
  id_cliente: string;
  id_tarifa: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: EstadoReservaParking;
  cliente?: {
    nombre: string;
    apellidos: string;
  } | null;
}

interface PlazaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  plaza: {
    id: string;
    codigo: string;
    tipo: string;
    disponible?: boolean;
    reservada?: boolean;
  };
  reservaInfo?: ReservaParkingInfo;
  reservasFuturas?: ReservaParkingInfo[];
  pagoInfo?: PagoParking;
  clienteInfo?: { nombre: string; apellidos: string } | null;
  isLoading?: boolean;
  tarifas: TarifaParking[];
  onEliminarReserva?: () => void;
}

const getEstadoPlaza = (plaza: { disponible?: boolean; reservada?: boolean }): EstadoPlazaVisual => {
  if (plaza.disponible !== false && !plaza.reservada) return 'disponible';
  if (plaza.reservada) return 'reservada';
  return 'ocupada';
};

const ESTADO_PLAZA_STYLES: Record<EstadoPlazaVisual, { etiqueta: string; chip: string }> = {
  disponible: {
    etiqueta: 'Disponible',
    chip: 'bg-emerald-100 text-emerald-700'
  },
  reservada: {
    etiqueta: 'Reservada',
    chip: 'bg-amber-100 text-amber-700'
  },
  ocupada: {
    etiqueta: 'Ocupada',
    chip: 'bg-rose-100 text-rose-700'
  }
};

const ESTADO_RESERVA_LABEL: Record<EstadoReservaParking, string> = {
  pendiente: 'Pendiente',
  activa: 'Activa',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada'
};

const ESTADO_RESERVA_CHIP: Record<EstadoReservaParking, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  activa: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-rose-100 text-rose-700',
  finalizada: 'bg-slate-200 text-slate-700'
};

export default function PlazaInfoModal({
  isOpen,
  onClose,
  plaza,
  reservaInfo,
  reservasFuturas = [],
  pagoInfo,
  clienteInfo,
  isLoading = false,
  tarifas,
  onEliminarReserva
}: PlazaInfoModalProps) {
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  };

  const getMetodoPagoLabel = (metodo: MetodoPago) => {
    return paymentMethodCodeLabel(metodo);
  };

  const getEstadoPagoLabel = (estado: EstadoPago) => {
    const labels: Record<EstadoPago, string> = {
      completado: 'Completado',
      pendiente: 'Pendiente',
      cancelado: 'Cancelado'
    };
    return labels[estado] || estado;
  };

  const getEstadoPagoColor = (estado: EstadoPago) => {
    const colors: Record<EstadoPago, string> = {
      completado: 'bg-emerald-100 text-emerald-700',
      pendiente: 'bg-amber-100 text-amber-700',
      cancelado: 'bg-rose-100 text-rose-700'
    };
    return colors[estado] || 'bg-surface-container-high text-on-surface-variant';
  };

  const getPeriodoLabel = (periodo: TarifaParking['periodo']) => {
    const labels: Record<TarifaParking['periodo'], string> = {
      dia: 'Diaria',
      semana: 'Semanal',
      quincena: 'Quincenal',
      mes: 'Mensual'
    };

    return labels[periodo];
  };

  const getTarifaInfo = (tarifaId?: string) => {
    if (!tarifaId) return null;
    return tarifas.find((tarifa) => tarifa.id === tarifaId) ?? null;
  };

  const estadoPlaza = getEstadoPlaza(plaza);
  const estadoPlazaStyles = ESTADO_PLAZA_STYLES[estadoPlaza];
  const tipoPlazaLabel = plaza.tipo === 'embarcacion'
    ? 'Zodiak'
    : plaza.tipo.charAt(0).toUpperCase() + plaza.tipo.slice(1);

  const dataLabelClassName = 'text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const dataValueClassName = 'mt-1 text-sm font-semibold text-on-surface';
  const SkeletonBlock = ({ className = '' }: { className?: string }) => (
    <div className={`relative overflow-hidden rounded-lg bg-surface-container-high ${className}`}>
      <div className="skeleton-shimmer absolute inset-y-0 left-0 w-1/2" />
    </div>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <style jsx global>{`
          @keyframes parking-skeleton-shimmer {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(220%);
            }
          }

          .skeleton-shimmer {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.18) 45%,
              rgba(255, 255, 255, 0.38) 50%,
              rgba(255, 255, 255, 0.18) 55%,
              transparent 100%
            );
            animation: parking-skeleton-shimmer 1.3s ease-in-out infinite;
          }

          .dark .skeleton-shimmer {
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.08) 45%,
              rgba(255, 255, 255, 0.16) 50%,
              rgba(255, 255, 255, 0.08) 55%,
              transparent 100%
            );
          }
        `}</style>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all">
                <div className="primary-gradient px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Dialog.Title as="h3" className="font-headline text-xl font-extrabold tracking-tight text-white">
                        Plaza {plaza.codigo}
                      </Dialog.Title>
                      <p className="mt-1 text-xs font-semibold text-white/80">{tipoPlazaLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`${estadoPlazaStyles.chip} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}
                      >
                        {estadoPlazaStyles.etiqueta}
                      </span>
                      <button
                        type="button"
                        className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                        onClick={onClose}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                        <SkeletonBlock className="h-3 w-12" />
                        <SkeletonBlock className="mt-3 h-5 w-24" />
                      </div>
                      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                        <SkeletonBlock className="h-3 w-20" />
                        <SkeletonBlock className="mt-3 h-5 w-28" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <SkeletonBlock className="h-5 w-40" />
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-14" />
                          <SkeletonBlock className="h-10 w-full" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <SkeletonBlock className="h-3 w-28" />
                            <SkeletonBlock className="h-5 w-32" />
                          </div>
                          <div className="space-y-2">
                            <SkeletonBlock className="h-3 w-24" />
                            <SkeletonBlock className="h-5 w-32" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-24" />
                          <SkeletonBlock className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-16" />
                          <SkeletonBlock className="h-5 w-40" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <SkeletonBlock className="h-5 w-36" />
                      <div className="mt-4 space-y-3">
                        <SkeletonBlock className="h-16 w-full rounded-xl" />
                        <SkeletonBlock className="h-16 w-full rounded-xl" />
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <SkeletonBlock className="h-5 w-44" />
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-16" />
                          <SkeletonBlock className="h-5 w-24" />
                        </div>
                        <div className="space-y-2">
                          <SkeletonBlock className="h-3 w-28" />
                          <SkeletonBlock className="h-5 w-28" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Tipo</p>
                      <p className={dataValueClassName}>{tipoPlazaLabel}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Estado actual</p>
                      <span
                        className={`${estadoPlazaStyles.chip} mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}
                      >
                        {estadoPlazaStyles.etiqueta}
                      </span>
                    </div>
                  </div>

                  {reservaInfo ? (
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Reserva actual</h4>
                      <div className="mt-4 space-y-4">
                        {clienteInfo ? (
                          <div>
                            <p className={dataLabelClassName}>Cliente</p>
                            <div className="mt-1 flex items-center">
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-white">
                                {clienteInfo.nombre.charAt(0)}
                                {clienteInfo.apellidos.charAt(0)}
                              </div>
                              <p className="ml-3 text-sm font-semibold text-on-surface">
                                {clienteInfo.nombre} {clienteInfo.apellidos}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className={dataLabelClassName}>Fecha de inicio</p>
                            <p className={dataValueClassName}>{formatearFecha(reservaInfo.fecha_inicio)}</p>
                          </div>
                          <div>
                            <p className={dataLabelClassName}>Fecha de fin</p>
                            <p className={dataValueClassName}>{formatearFecha(reservaInfo.fecha_fin)}</p>
                          </div>
                        </div>

                        {reservaInfo.estado ? (
                          <div>
                            <p className={dataLabelClassName}>Estado reserva</p>
                            <span className={`${ESTADO_RESERVA_CHIP[reservaInfo.estado]} mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                              {ESTADO_RESERVA_LABEL[reservaInfo.estado]}
                            </span>
                          </div>
                        ) : null}

                        {getTarifaInfo(reservaInfo.id_tarifa) ? (
                          <div>
                            <p className={dataLabelClassName}>Tarifa</p>
                            <p className={dataValueClassName}>
                              {getPeriodoLabel(getTarifaInfo(reservaInfo.id_tarifa)!.periodo)} -{' '}
                              {formatearPrecio(getTarifaInfo(reservaInfo.id_tarifa)!.precio)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Reserva actual</h4>
                      <p className="mt-2 text-sm text-on-surface-variant">No hay reserva activa para esta plaza.</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <h4 className="font-headline text-lg font-extrabold text-primary-dark">Reservas futuras</h4>
                    {reservasFuturas.length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">No hay reservas futuras para esta plaza.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {reservasFuturas.map((reservaFutura) => {
                          const tarifa = getTarifaInfo(reservaFutura.id_tarifa);
                          const estado = reservaFutura.estado ?? 'pendiente';

                          return (
                            <article key={reservaFutura.id} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-on-surface">
                                    {formatearFecha(reservaFutura.fecha_inicio)} - {formatearFecha(reservaFutura.fecha_fin)}
                                  </p>
                                  <p className="mt-1 text-xs text-on-surface-variant">
                                    {tarifa ? `${getPeriodoLabel(tarifa.periodo)} · ${formatearPrecio(tarifa.precio)}` : 'Tarifa no disponible'}
                                  </p>
                                  {reservaFutura.cliente ? (
                                    <p className="mt-1 text-xs font-medium text-on-surface-variant">
                                      Cliente: {reservaFutura.cliente.nombre} {reservaFutura.cliente.apellidos}
                                    </p>
                                  ) : null}
                                </div>
                                <span className={`${ESTADO_RESERVA_CHIP[estado]} inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                                  {ESTADO_RESERVA_LABEL[estado]}
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {pagoInfo ? (
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Pago de la reserva actual</h4>
                      <div className="mt-4 space-y-4">
                        {pagoInfo.concepto ? (
                          <div>
                            <p className={dataLabelClassName}>Concepto</p>
                            <p className={dataValueClassName}>{pagoInfo.concepto}</p>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <p className={dataLabelClassName}>Importe</p>
                            <p className={dataValueClassName}>{formatearPrecio(pagoInfo.importe)}</p>
                          </div>
                          <div>
                            <p className={dataLabelClassName}>Método de pago</p>
                            <p className={dataValueClassName}>{getMetodoPagoLabel(pagoInfo.metodo)}</p>
                          </div>
                        </div>

                        <div>
                          <p className={dataLabelClassName}>Estado del pago</p>
                          <span
                            className={`${getEstadoPagoColor(pagoInfo.estado)} mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}
                          >
                            {getEstadoPagoLabel(pagoInfo.estado)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                )}

                <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/25 px-6 py-4">
                  <button
                    type="button"
                    className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary cursor-pointer"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>

                  {reservaInfo && onEliminarReserva ? (
                    <button
                      type="button"
                      className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
                      onClick={onEliminarReserva}
                    >
                      Eliminar Reserva
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
