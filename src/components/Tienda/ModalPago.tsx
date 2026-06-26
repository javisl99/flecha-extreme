'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ReceiptPercentIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { SelectorClienteCompacto } from './SelectorClienteCompacto';
import { formatPrice } from '@/lib/formatUtils';
import { useClientes } from '@/hooks/useClientes';
import { useProductos } from '@/hooks/useProductos';
import { useTickets } from '@/hooks/useTickets';
import SurfSpinner from '@/components/shared/SurfSpinner';
import TicketCompra from './TicketCompra';
import { toast } from 'react-hot-toast';
import { ACTIVE_PAYMENT_METHOD_OPTIONS } from '@/lib/contabilidadCatalogos';
import { calculateDiscountAmount, calculateDiscountPercentage, type DescuentoModo } from '@/lib/descuentos';

type MetodoPago = 'efectivo' | 'tpv' | 'transferencia' | 'bizum_alfonso';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface ModalPagoProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id_cliente: string | null;
    items: CartItem[];
    subtotal: number;
    descuento: number;
    descuentoPorcentaje: number;
    iva: number;
    total: number;
    concepto: string;
    pago: {
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => Promise<{ pedidoId?: string } | void>;
  cartItems: CartItem[];
  discountPercentage: number;
  readOnly?: boolean;
  pedidoData?: {
    pedidoId: string;
    clienteId: string | null;
    metodo: MetodoPago;
    estado: EstadoPago;
    concepto: string;
  };
  onPedidoUpdated?: () => void;
}

export default function ModalPago({ 
  isOpen, 
  onClose, 
  onSubmit, 
  cartItems,
  discountPercentage,
  readOnly = false,
  pedidoData,
  onPedidoUpdated
}: ModalPagoProps) {
  const { clientes } = useClientes();
  const { productos } = useProductos();
  const { saveTicket } = useTickets();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [concepto, setConcepto] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [stockValidationError, setStockValidationError] = useState<string | null>(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [discountMode, setDiscountMode] = useState<DescuentoModo>('porcentaje');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [processedPaymentData, setProcessedPaymentData] = useState<{
    cartItems: CartItem[];
    subtotal: number;
    descuento: number;
    discountPercentage: number;
    discountLabel?: string;
    iva: number;
    total: number;
    metodoPago: string;
    fecha: Date;
    pedidoId?: string;
    estadoPago: EstadoPago;
  } | null>(null);

  // Inicializar valores cuando se proporcionen datos del pedido
  useEffect(() => {
    if (pedidoData && readOnly) {
      setSelectedClienteId(pedidoData.clienteId);
      setMetodoPago(pedidoData.metodo);
      // Estado del pago establecido desde pedidoData
      setConcepto(pedidoData.concepto);
    }
  }, [pedidoData, readOnly]);

  useEffect(() => {
    if (!isOpen) {
      setDiscountMode('porcentaje');
      setDiscountValue(0);
      return;
    }

    setDiscountMode('porcentaje');
    setDiscountValue(discountPercentage);
  }, [discountPercentage, isOpen]);

  // Limpiar error de stock cuando cambien los items del carrito
  useEffect(() => {
    setStockValidationError(null);
  }, [cartItems]);

  const metodosPago: { value: MetodoPago; label: string }[] = useMemo(
    () => ACTIVE_PAYMENT_METHOD_OPTIONS as Array<{ value: MetodoPago; label: string }>,
    []
  );

  // Obtener el cliente seleccionado y método de pago optimizados
  const selectedCliente = useMemo(() => 
    clientes.find(c => c.id === selectedClienteId), 
    [clientes, selectedClienteId]
  );
  
  const selectedMetodoPago = useMemo(() => 
    metodosPago.find(m => m.value === metodoPago), 
    [metodoPago, metodosPago]
  );

  // Cálculos de precios optimizados con useMemo
  const { subtotal, descuento, discountPercentageValue, discountLabel, iva, total } = useMemo(() => {
    
    const subtotal = cartItems.reduce((total, item) => {
      // Para el producto desconocido, usar directamente el precio (ya que quantity es 0)
      if (item.id === 'producto-desconocido') {
        return total + item.price;
      }
      return total + (item.price * item.quantity);
    }, 0);
    const descuento = calculateDiscountAmount(subtotal, discountMode, discountValue);
    const subtotalConDescuento = subtotal - descuento;
    const iva = subtotalConDescuento * 0.21; // 21% de IVA (informativo)
    const total = subtotalConDescuento; // El total es el subtotal con descuento, el IVA ya está incluido
    const discountPercentageValue = calculateDiscountPercentage(subtotal, descuento);
    const discountLabel = discountMode === 'porcentaje'
      ? `Descuento (${discountValue}%)`
      : 'Descuento (€)';
    
    return { subtotal, descuento, discountPercentageValue, discountLabel, iva, total };
  }, [cartItems, discountMode, discountValue]);


  // Función para validar stock disponible
  const validateStock = () => {
    setStockValidationError(null);
    
    for (const cartItem of cartItems) {
      const product = productos.find(p => p.id === cartItem.id);
      if (!product) {
        setStockValidationError(`Producto "${cartItem.name}" no encontrado`);
        return false;
      }
      
      if (product.stock < cartItem.quantity) {
        setStockValidationError(
          `Stock insuficiente para "${cartItem.name}". Disponible: ${product.stock}, Solicitado: ${cartItem.quantity}`
        );
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      return;
    }

    // Validar stock antes de proceder
    if (!validateStock()) {
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  const handleConfirmPaymentWithState = async (estado: EstadoPago) => {
    
    setIsProcessing(true);
    
    try {
      // Preservar los datos del pago antes de ejecutar onSubmit
      const paymentData = {
        cartItems: [...cartItems], // Crear una copia del array
        subtotal,
        descuento,
        discountPercentage: discountPercentageValue,
        discountLabel,
        iva,
        total,
        metodoPago: (() => {
          const metodo = selectedMetodoPago?.label || 'Efectivo';
          if (metodo.includes('Bizum')) return 'Bizum';
          if (metodo.includes('Tarjeta')) return 'Tarjeta';
          return 'Efectivo';
        })(),
        fecha: new Date(),
        estadoPago: estado
      };
      
      setProcessedPaymentData(paymentData);
      
      // Ejecutar onSubmit si no es readOnly
      let pedidoId: string | undefined;
      if (!readOnly) {
        const result = await onSubmit({
          id_cliente: selectedClienteId,
          items: cartItems,
          subtotal,
          descuento,
          descuentoPorcentaje: discountPercentageValue,
          iva,
          total,
          concepto,
          pago: {
            metodo: metodoPago,
            estado: estado
          }
        });
        
        // Si el resultado incluye el ID del pedido, lo guardamos
        if (result && typeof result === 'object' && 'pedidoId' in result) {
          pedidoId = result.pedidoId;
        }
      }
      
      // Actualizar los datos con el ID del pedido si está disponible
      if (pedidoId) {
        setProcessedPaymentData(prev => prev ? { ...prev, pedidoId } : null);
      }
      
      // Cerrar modal de confirmación y abrir modal del ticket
      setShowConfirmationModal(false);
      setShowTicketModal(true);
    } catch (error) {
      console.error('Error procesando pago:', error);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleCancelPayment = () => {
    setShowConfirmationModal(false);
  };


  const handleGuardarTicket = async () => {
    if (!processedPaymentData) {
      toast.error('No hay datos de pago para guardar');
      return;
    }

    setIsSavingTicket(true);

    try {
      const ticketData = {
        cartItems: processedPaymentData.cartItems,
        subtotal: processedPaymentData.subtotal,
        descuento: processedPaymentData.descuento,
        discountPercentage: processedPaymentData.discountPercentage,
        discountLabel: processedPaymentData.discountLabel,
        iva: processedPaymentData.iva,
        total: processedPaymentData.total,
        metodoPago: processedPaymentData.metodoPago,
        fecha: processedPaymentData.fecha,
        pedidoId: processedPaymentData.pedidoId,
        clienteId: selectedClienteId || undefined,
        estadoPago: processedPaymentData.estadoPago
      };

      const result = await saveTicket(ticketData);
      
      if (result.success && result.url) {
        // Mostrar toast de éxito
        if (result.emailSent) {
          toast.success(`✅ Ticket PDF guardado exitosamente\n📧 ${result.emailMessage}`, {
            duration: 4000,
          });
        } else if (processedPaymentData.estadoPago === 'pendiente') {
          toast.success(`✅ Ticket PDF guardado exitosamente\n⏳ ${result.emailMessage}`, {
            duration: 4000,
          });
        } else {
          toast.success(`✅ Ticket PDF guardado exitosamente\n⚠️ ${result.emailMessage}`, {
            duration: 4000,
          });
        }

        // Cerrar el modal del ticket después de guardar exitosamente
        setShowTicketModal(false);
        setProcessedPaymentData(null);
        onClose();
      } else {
        toast.error(`❌ Error al guardar el ticket: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando ticket:', error);
      toast.error(`❌ Error al guardar el ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleCloseTicket = () => {
    setShowTicketModal(false);
    setProcessedPaymentData(null); // Limpiar los datos procesados
    // Solo limpiar formulario si no es readOnly
    if (!readOnly) {
      setSelectedClienteId(null);
      setMetodoPago('efectivo');
      // Estado del pago: pendiente
      setConcepto('');
      setDiscountMode('porcentaje');
      setDiscountValue(0);
      onClose();
    }
  };

  const handleCompletarPago = async () => {
    if (!pedidoData) return;

    setIsCompletingPayment(true);
    
    try {
      const supabase = (await import('@/lib/supabaseClient')).default;
      const pedidoId = pedidoData.pedidoId;

      // 1. Actualizar el estado del pedido a 'pagado'
      const { error: pedidoError } = await supabase
        .from('pedido')
        .update({ estado: 'pagado' })
        .eq('id', pedidoId);

      if (pedidoError) {
        throw new Error(`Error al actualizar el pedido: ${pedidoError.message}`);
      }

      // 2. Actualizar el estado del pago a 'completado'
      const { error: pagoError } = await supabase
        .from('pago')
        .update({ estado: 'completado' })
        .eq('origen_id', pedidoId)
        .eq('origen_tipo', 'pedido');

      if (pagoError) {
        throw new Error(`Error al actualizar el pago: ${pagoError.message}`);
      }

      // 3. Generar y enviar el ticket por email
      const ticketData = {
        cartItems,
        subtotal,
        descuento,
        discountPercentage: discountPercentageValue,
        discountLabel,
        iva,
        total,
        metodoPago: (() => {
          const metodo = selectedMetodoPago?.label || 'Efectivo';
          if (metodo.includes('Bizum')) return 'Bizum';
          if (metodo.includes('Tarjeta')) return 'Tarjeta';
          return 'Efectivo';
        })(),
        fecha: new Date(),
        pedidoId: pedidoId,
        clienteId: pedidoData.clienteId ?? undefined,
        estadoPago: 'completado' as const
      };

      const ticketResult = await saveTicket(ticketData);
      
      if (!ticketResult.success) {
        console.warn('Error al generar/enviar ticket:', ticketResult.error);
        // No lanzamos error aquí porque el pago ya se completó
      }

      toast.success(
        pedidoData.clienteId
          ? 'Pago completado exitosamente y email enviado al cliente'
          : 'Pago completado exitosamente'
      );
      
      // Actualizar el estado local para reflejar el cambio
      // Estado del pago: completado

      // Cerrar el modal y actualizar la tabla de pedidos
      onClose();
      if (onPedidoUpdated) {
        onPedidoUpdated();
      }

    } catch (error) {
      console.error('Error completando pago:', error);
      toast.error(`Error al completar el pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsCompletingPayment(false);
    }
  };

  return (
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
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 flex items-end justify-center sm:items-center">
          <div className="flex min-h-full w-full items-end justify-center p-4 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative max-h-[90svh] w-full max-w-4xl transform overflow-hidden rounded-t-[1.5rem] bg-white shadow-lg transition-transform dark:bg-gray-800 sm:rounded-xl">
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ReceiptPercentIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Procesar Pago
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en el carrito
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg p-1 hover:bg-black/10 transition-colors cursor-pointer"
                        onClick={onClose}
                      >
                        <span className="sr-only">Cerrar</span>
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="max-h-[calc(90svh-200px)] overflow-y-auto px-4 py-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Columna izquierda - Información del cliente */}
                      <div className="space-y-6">
                        {/* Selector de cliente */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cliente
                          </label>
                          <SelectorClienteCompacto
                            selectedClienteId={selectedClienteId}
                            onClienteChange={setSelectedClienteId}
                            placeholder="Seleccionar cliente (opcional)"
                            className="w-full"
                            disabled={readOnly}
                          />
                          {!readOnly ? (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              El pago puede registrarse sin asociar un cliente.
                            </p>
                          ) : null}
                        </div>

                        {/* Mensaje de error de stock */}
                        {stockValidationError && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                  {stockValidationError}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Métodos de pago */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Método de Pago
                          </h4>
                          
                          <div>
                            <label htmlFor="metodo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Forma de pago
                            </label>
                            <select
                              id="metodo"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              value={metodoPago}
                              onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                              required
                              disabled={readOnly}
                            >
                              {metodosPago.map((metodo) => (
                                <option key={metodo.value} value={metodo.value}>
                                  {metodo.label}
                                </option>
                              ))}
                            </select>
                          </div>

                        <div>
                          <label htmlFor="concepto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Concepto
                          </label>
                          <input
                              type="text"
                              id="concepto"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                              value={concepto}
                              onChange={(e) => setConcepto(e.target.value)}
                              placeholder="Descripción del pago (opcional)"
                              disabled={readOnly}
                            />
                          </div>

                          {!readOnly ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Descuento
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={discountMode}
                                  onChange={(e) => setDiscountMode(e.target.value as DescuentoModo)}
                                  className="col-span-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="porcentaje">%</option>
                                  <option value="importe">€</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  max={discountMode === 'porcentaje' ? 100 : undefined}
                                  step="0.01"
                                  value={discountValue === 0 ? '' : discountValue}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') {
                                      setDiscountValue(0);
                                      return;
                                    }

                                    const parsed = Number(raw);
                                    if (Number.isNaN(parsed)) {
                                      return;
                                    }

                                    setDiscountValue(discountMode === 'porcentaje'
                                      ? Math.min(100, Math.max(0, parsed))
                                      : Math.max(0, parsed));
                                  }}
                                  className="col-span-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                  placeholder="0.00"
                                />
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Puedes aplicar un descuento en porcentaje o en importe fijo.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Columna derecha - Ticket de compra */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Ticket de Compra
                        </h4>
                        
                        {/* Ticket container */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                          {/* Header del ticket */}
                          <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-3 mb-4">
                            <h5 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              FLECHA EXTREME
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date().toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>

                          {/* Items del carrito */}
                          <div className="space-y-2 mb-4">
                            {cartItems.map((item) => (
                              <div key={item.id} className={`flex justify-between items-center text-sm ${item.id === 'producto-desconocido' ? 'bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800' : ''}`}>
                                <div className="flex-1">
                                  <span className={`${item.id === 'producto-desconocido' ? 'text-yellow-800 dark:text-yellow-200 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {item.name}
                                    {item.id === 'producto-desconocido' && (
                                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                                        (Producto eliminado)
                                      </span>
                                    )}
                                  </span>
                                  {item.quantity > 0 && (
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                      x{item.quantity}
                                    </span>
                                  )}
                                </div>
                                <span className={`${item.id === 'producto-desconocido' ? 'text-yellow-800 dark:text-yellow-200 font-bold' : 'text-gray-900 dark:text-gray-100 font-medium'}`}>
                                  {formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Separador */}
                          <div className="border-t border-gray-300 dark:border-gray-600 my-3"></div>

                          {/* Resumen de precios */}
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {formatPrice(subtotal)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between text-gray-500 dark:text-gray-500">
                              <span>IVA incluido (21%):</span>
                              <span>
                                {formatPrice(iva)}
                              </span>
                            </div>
                            
                            {descuento > 0 && (
                              <div className="flex justify-between text-green-600 dark:text-green-400">
                                <span>{discountLabel}:</span>
                                <span>-{formatPrice(descuento)}</span>
                              </div>
                            )}
                            
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-900 dark:text-gray-100">TOTAL:</span>
                                <span className="text-primary">
                                  {formatPrice(total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-3">
                      <button
                        type="button"
                        className="min-h-11 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-75 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={onClose}
                        disabled={isProcessing || isCompletingPayment}
                      >
                        {readOnly ? 'Cerrar' : 'Cancelar'}
                      </button>
                      {!readOnly && (
                        <button
                          type="submit"
                          disabled={cartItems.length === 0 || isProcessing}
                          className="min-h-11 rounded-md bg-green-600 px-6 py-2 text-sm font-bold text-white transition-colors duration-75 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="font-bold">Procesando...</span>
                            </div>
                          ) : (
                            <span className="font-bold">{`Procesar Pago - ${formatPrice(total)}`}</span>
                          )}
                        </button>
                      )}
                      {readOnly && pedidoData && pedidoData.estado === 'pendiente' && (
                        <button
                          type="button"
                          className="min-h-11 rounded-md bg-green-600 px-6 py-2 text-sm font-bold text-white transition-colors duration-75 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          onClick={handleCompletarPago}
                          disabled={isCompletingPayment}
                        >
                          {isCompletingPayment ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="font-bold">Completando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span className="font-bold">Completar Pago</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      {/* Modal de confirmación de pago */}
      <Transition.Root show={showConfirmationModal} as={Fragment}>
        <Dialog as="div" className="relative z-[70]" onClose={handleCancelPayment}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 flex items-end justify-center sm:items-center">
            <div className="flex min-h-full w-full items-end justify-center p-4 sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-t-[1.5rem] bg-white shadow-lg transition-transform dark:bg-gray-800 sm:rounded-xl">
                  <div className="px-6 py-8">
                    <div className="text-center">
                      {/* Spinner de carga */}
                      <div className="mx-auto mb-6">
                        <SurfSpinner size="lg" />
                      </div>
                      
                      {/* Título */}
                      <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Esperando Confirmación
                      </Dialog.Title>
                      
                      {/* Descripción */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Seleccione cómo desea procesar el pago de <span className="font-semibold text-primary">{formatPrice(total)}</span>
                      </p>
                      
                      {/* Información del pago */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Método:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {selectedMetodoPago?.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellidos}` : 'Sin cliente'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      
                      
                      {/* Botones */}
                      <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:space-x-3">
                        <button
                          type="button"
                          className="min-h-11 flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-75 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                          onClick={handleCancelPayment}
                          disabled={isProcessing}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                            className="min-h-11 flex-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-bold text-white transition-colors duration-75 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            onClick={() => handleConfirmPaymentWithState('pendiente')}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Procesando...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <ClockIcon className="h-4 w-4" />
                                <span>Pendiente Pago</span>
                              </div>
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          onClick={() => handleConfirmPaymentWithState('completado')}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Procesando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Confirmar Pago</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modal del ticket de compra */}
      {processedPaymentData && (
        <TicketCompra
          isOpen={showTicketModal}
          onClose={handleCloseTicket}
          onGuardar={handleGuardarTicket}
          cartItems={processedPaymentData.cartItems}
          subtotal={processedPaymentData.subtotal}
          descuento={processedPaymentData.descuento}
          discountPercentage={processedPaymentData.discountPercentage}
          discountLabel={processedPaymentData.discountLabel}
          iva={processedPaymentData.iva}
          total={processedPaymentData.total}
          metodoPago={processedPaymentData.metodoPago}
          fecha={processedPaymentData.fecha}
          pedidoId={processedPaymentData.pedidoId}
          clienteId={selectedClienteId || undefined} // Pasar el ID del cliente seleccionado
          estadoPago={processedPaymentData.estadoPago}
          isSaving={isSavingTicket}
        />
      )}
    </Transition.Root>
  );
}
