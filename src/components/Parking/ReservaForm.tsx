import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useClientes } from '@/hooks/useClientes';
import { ACTIVE_PAYMENT_METHOD_OPTIONS } from '@/lib/contabilidadCatalogos';

type MetodoPago = 'efectivo' | 'tpv' | 'transferencia' | 'bizum_alfonso';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface ReservaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
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
  plazaCodigo: string;
  tarifas: TarifaParking[];
}

export default function ReservaForm({ isOpen, onClose, onSubmit, plazaCodigo, tarifas }: ReservaFormProps) {
  const { clientes, loading: loadingClientes } = useClientes();
  const [formData, setFormData] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    id_tarifa: '',
    id_cliente: '',
    pago: {
      concepto: '',
      metodo: 'efectivo' as MetodoPago,
      estado: 'pendiente' as EstadoPago
    }
  });

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id_cliente: formData.id_cliente || null
    });
    onClose();
  };

  const metodosPago: { value: MetodoPago; label: string }[] =
    ACTIVE_PAYMENT_METHOD_OPTIONS as Array<{ value: MetodoPago; label: string }>;

  const estadosPago: { value: EstadoPago; label: string }[] = [
    { value: 'completado', label: 'Completado' },
    { value: 'pendiente', label: 'Pendiente' }
  ];

  const labelClassName = 'mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline';
  const inputClassName =
    'h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';

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
                      Nueva Reserva · Plaza {plazaCodigo}
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
                    <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Datos de reserva</h4>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label htmlFor="cliente" className={labelClassName}>
                            Cliente
                          </label>
                          <select
                            id="cliente"
                            className={inputClassName}
                            value={formData.id_cliente}
                            onChange={(e) => setFormData({ ...formData, id_cliente: e.target.value })}
                          >
                            <option value="">Sin cliente asignado</option>
                            {loadingClientes ? (
                              <option disabled>Cargando clientes...</option>
                            ) : (
                              clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                  {cliente.nombre} {cliente.apellidos}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label htmlFor="tarifa" className={labelClassName}>
                            Tarifa
                          </label>
                          <select
                            id="tarifa"
                            className={inputClassName}
                            value={formData.id_tarifa}
                            onChange={(e) => setFormData({ ...formData, id_tarifa: e.target.value })}
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
                            type="datetime-local"
                            id="fecha_inicio"
                            className={inputClassName}
                            value={formData.fecha_inicio}
                            onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="fecha_fin" className={labelClassName}>
                            Fecha de fin
                          </label>
                          <input
                            type="datetime-local"
                            id="fecha_fin"
                            className={inputClassName}
                            value={formData.fecha_fin}
                            onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
                      <h4 className="font-headline text-lg font-extrabold text-primary-dark">Datos de pago</h4>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label htmlFor="concepto" className={labelClassName}>
                            Concepto (opcional)
                          </label>
                          <input
                            type="text"
                            id="concepto"
                            className={inputClassName}
                            value={formData.pago.concepto}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pago: { ...formData.pago, concepto: e.target.value }
                              })
                            }
                            placeholder="Introduce un concepto para el pago"
                          />
                        </div>

                        <div>
                          <label htmlFor="metodo" className={labelClassName}>
                            Método de pago
                          </label>
                          <select
                            id="metodo"
                            className={inputClassName}
                            value={formData.pago.metodo}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pago: { ...formData.pago, metodo: e.target.value as MetodoPago }
                              })
                            }
                            required
                          >
                            {metodosPago.map((metodo) => (
                              <option key={metodo.value} value={metodo.value}>
                                {metodo.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="estado" className={labelClassName}>
                            Estado del pago
                          </label>
                          <select
                            id="estado"
                            className={inputClassName}
                            value={formData.pago.estado}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pago: { ...formData.pago, estado: e.target.value as EstadoPago }
                              })
                            }
                            required
                          >
                            {estadosPago.map((estado) => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-outline-variant/25 px-6 py-4">
                    <button
                      type="button"
                      className="rounded-full border border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
                      onClick={onClose}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="primary-gradient rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
                    >
                      Crear Reserva
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
