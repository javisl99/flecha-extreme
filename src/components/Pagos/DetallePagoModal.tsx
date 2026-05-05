import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Pago } from '@/hooks/usePagos';
import { toast } from 'react-hot-toast';

interface DetallePagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pago: Pago | null;
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
    bizum_maria: 'Bizum María',
    bizum_jm: 'Bizum JM',
    angeles: 'Ángeles'
  };
  return metodosFormateados[metodo] || metodo;
};

const formatearEstado = (estado: Pago['estado']) => estado.charAt(0).toUpperCase() + estado.slice(1);

const getEstadoColor = (estado: Pago['estado']) => {
  const colores = {
    completado: 'bg-emerald-100 text-emerald-700',
    pendiente: 'bg-amber-100 text-amber-700',
    cancelado: 'bg-red-100 text-red-700'
  };

  return colores[estado] || 'bg-surface-container-high text-on-surface-variant';
};

const formatearImporte = (importe: number) => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(importe)} €`;
};

export default function DetallePagoModal({ isOpen, onClose, pago, onCompletarPago, onCancelarPago }: DetallePagoModalProps) {
  const [isCompletando, setIsCompletando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);

  if (!pago) return null;

  const handleCompletarPago = async () => {
    if (!onCompletarPago) return;

    try {
      setIsCompletando(true);
      await onCompletarPago(pago);
      toast.success('Pago completado correctamente');
    } catch (error) {
      console.error('Error al completar el pago:', error);
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
      console.error('Error al cancelar el pago:', error);
      toast.error('Error al cancelar el pago');
    } finally {
      setIsCancelando(false);
    }
  };

  const mostrarCliente = pago.cliente
    ? `${pago.cliente.nombre} ${pago.cliente.apellidos}`
    : 'Cliente no establecido';

  const mostrarOrigen = pago.origen_tipo.charAt(0).toUpperCase() + pago.origen_tipo.slice(1);

  const dataLabelClassName = 'text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const dataValueClassName = 'mt-1 text-sm font-semibold text-on-surface';

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl border border-outline-variant/35 bg-surface-container-lowest shadow-xl transition-all">
                <div className="primary-gradient flex items-center justify-between px-6 py-4">
                  <Dialog.Title as="h3" className="font-headline text-xl font-extrabold tracking-tight text-white">
                    Detalle del Pago
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Cliente</p>
                      <p className={dataValueClassName}>{mostrarCliente}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Origen</p>
                      <p className={dataValueClassName}>{mostrarOrigen}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                    <p className={dataLabelClassName}>Concepto</p>
                    <p className={dataValueClassName}>{pago.concepto}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Importe</p>
                      <p className={dataValueClassName}>{formatearImporte(pago.importe)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Método de pago</p>
                      <p className={dataValueClassName}>{formatearMetodoPago(pago.metodo)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Estado</p>
                      <span className={`${getEstadoColor(pago.estado)} mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                        {formatearEstado(pago.estado)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <p className={dataLabelClassName}>Fecha de creación</p>
                      <p className={dataValueClassName}>{new Date(pago.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-outline-variant/25 px-6 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                  >
                    Cerrar
                  </button>

                  {pago.estado === 'pendiente' && onCompletarPago ? (
                    <button
                      type="button"
                      onClick={handleCompletarPago}
                      disabled={isCompletando || isCancelando}
                      className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isCompletando ? 'Completando...' : 'Completar Pago'}
                    </button>
                  ) : null}

                  {pago.estado === 'pendiente' && onCancelarPago ? (
                    <button
                      type="button"
                      onClick={handleCancelarPago}
                      disabled={isCompletando || isCancelando}
                      className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
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
