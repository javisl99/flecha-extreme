import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReservaForm from './ReservaForm';

type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';
type EstadoPlazaVisual = 'disponible' | 'reservada' | 'ocupada';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
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
  reservaInfo?: {
    id: string;
    id_cliente: string;
    id_tarifa: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  pagoInfo?: PagoParking;
  clienteInfo?: { nombre: string; apellidos: string } | null;
  tarifas: TarifaParking[];
  onEliminarReserva?: () => void;
  onCrearReserva?: (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    id_cliente: string | null;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => void;
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

export default function PlazaInfoModal({
  isOpen,
  onClose,
  plaza,
  reservaInfo,
  pagoInfo,
  clienteInfo,
  tarifas,
  onEliminarReserva,
  onCrearReserva
}: PlazaInfoModalProps) {
  const [showReservaForm, setShowReservaForm] = useState(false);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  };

  const getMetodoPagoLabel = (metodo: MetodoPago) => {
    const labels: Record<MetodoPago, string> = {
      efectivo: 'Efectivo',
      tpv: 'Tarjeta (TPV)',
      bizum_alfonso: 'Bizum Alfonso',
      bizum_robe: 'Bizum Robe',
      bizum_alba: 'Bizum Alba',
      bizum_maria: 'Bizum María',
      bizum_jm: 'Bizum JM',
      angeles: 'Ángeles'
    };
    return labels[metodo] || metodo;
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

  const handleCrearReserva = (data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    id_cliente: string | null;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => {
    onCrearReserva?.(data);
    setShowReservaForm(false);
  };

  const getTarifaInfo = () => {
    if (!reservaInfo?.id_tarifa) return null;
    return tarifas.find((tarifa) => tarifa.id === reservaInfo.id_tarifa);
  };

  const estadoPlaza = getEstadoPlaza(plaza);
  const estadoPlazaStyles = ESTADO_PLAZA_STYLES[estadoPlaza];
  const tipoPlazaLabel = plaza.tipo.charAt(0).toUpperCase() + plaza.tipo.slice(1);

  const dataLabelClassName = 'text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const dataValueClassName = 'mt-1 text-sm font-semibold text-on-surface';

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                          className="rounded-md text-white transition hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                          onClick={onClose}
                        >
                          <span className="sr-only">Cerrar</span>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>

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
                        <h4 className="font-headline text-lg font-extrabold text-primary-dark">Información de la Reserva</h4>
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

                          {getTarifaInfo() ? (
                            <div>
                              <p className={dataLabelClassName}>Tarifa</p>
                              <p className={dataValueClassName}>
                                {getTarifaInfo()?.periodo === 'mes' ? 'Mensual' : 'Quincenal'} -{' '}
                                {formatearPrecio(getTarifaInfo()?.precio || 0)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {pagoInfo ? (
                      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                        <h4 className="font-headline text-lg font-extrabold text-primary-dark">Información del Pago</h4>
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

                  <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/25 px-6 py-4">
                    <button
                      type="button"
                      className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                      onClick={onClose}
                    >
                      Cerrar
                    </button>

                    {!plaza.reservada ? (
                      <button
                        type="button"
                        className="primary-gradient rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                        onClick={() => setShowReservaForm(true)}
                      >
                        Crear Reserva
                      </button>
                    ) : null}

                    {plaza.reservada && onEliminarReserva ? (
                      <button
                        type="button"
                        className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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

      {showReservaForm ? (
        <ReservaForm
          isOpen={showReservaForm}
          onClose={() => setShowReservaForm(false)}
          onSubmit={handleCrearReserva}
          plazaCodigo={plaza.codigo}
          tarifas={tarifas}
        />
      ) : null}
    </>
  );
}
