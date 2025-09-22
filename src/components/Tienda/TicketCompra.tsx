'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, QrCodeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { formatPrice, formatNumber } from '@/lib/formatUtils';
import Image from 'next/image';
import { useTickets } from '@/hooks/useTickets';
import { toast } from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface TicketCompraProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerarQR: () => void;
  onGuardar: () => void;
  cartItems: CartItem[];
  subtotal: number;
  descuento: number;
  discountPercentage: number;
  iva: number;
  total: number;
  metodoPago: string;
  fecha: Date;
  pedidoId?: string;
  clienteId?: string; // Agregamos el ID del cliente
}

export default function TicketCompra({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  descuento,
  discountPercentage,
  iva,
  total,
  metodoPago,
  fecha,
  pedidoId,
  clienteId
}: TicketCompraProps) {
  const { loading, error, saveTicket, generateTicketQR } = useTickets();
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');

  const handleGuardar = async () => {
    const ticketData = {
      cartItems,
      subtotal,
      descuento,
      discountPercentage,
      iva,
      total,
      metodoPago,
      fecha,
      pedidoId,
      clienteId // Incluimos el clienteId para el envío de email
    };

    const result = await saveTicket(ticketData);
    
    if (result.success && result.url) {
      // Mostrar Toast específico sobre el envío del email
      if (result.emailSent) {
        toast.success(`✅ Ticket PDF guardado exitosamente\n📧 ${result.emailMessage}`, {
          duration: 4000,
        });
      } else {
        toast.success(`✅ Ticket PDF guardado exitosamente\n⚠️ ${result.emailMessage}`, {
          duration: 4000,
        });
      }
      onClose(); // Cerrar el modal después de guardar exitosamente
    } else {
      toast.error(`❌ Error al guardar el ticket: ${result.error}`);
    }
  };

  const handleGenerarQR = async () => {
    const ticketData = {
      cartItems,
      subtotal,
      descuento,
      discountPercentage,
      iva,
      total,
      metodoPago,
      fecha,
      pedidoId,
      clienteId // Incluimos el clienteId para el envío de email
    };

    const result = await generateTicketQR(ticketData);
    
    if (result.success && result.qrCode && result.url) {
      setQrCode(result.qrCode);
      setShowQR(true);
      
      // Mostrar Toast específico sobre el envío del email
      if (result.emailSent) {
        toast.success(`✅ Código QR generado exitosamente\n📧 ${result.emailMessage}`, {
          duration: 4000,
        });
      } else {
        toast.success(`✅ Código QR generado exitosamente\n⚠️ ${result.emailMessage}`, {
          duration: 4000,
        });
      }
    } else {
      toast.error(`❌ Error al generar el QR: ${result.error}`);
    }
  };
  
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
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

        <div className="fixed inset-0 z-10 flex items-center justify-center">
          <div className="flex min-h-full w-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-sm transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Ticket de Compra
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-lg p-1 hover:bg-black/10 transition-colors duration-75 cursor-pointer"
                      onClick={onClose}
                    >
                      <span className="sr-only">Cerrar</span>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Contenido del ticket */}
                <div className="px-6 py-4">
                  {/* Vista previa del ticket - solo mostrar si no hay QR */}
                  {!showQR && (
                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                      {/* Ticket real */}
                      <div className="bg-white text-black font-mono text-xs leading-tight p-4">
                      {/* Logo y nombre de la empresa */}
                      <div className="text-center mb-3">
                        <div className="flex justify-center mb-2">
                          <Image
                            src="/cropped-lgo.png"
                            alt="Flecha Extreme"
                            width={60}
                            height={30}
                            className="grayscale contrast-200 brightness-75"
                          />
                        </div>
                        <div className="text-xs">
                          <div>Urb. Portil Ca-C 1</div>
                          <div>21100 Nuevo Portil, Huelva</div>
                          <div>Tel. 617000546</div>
                        </div>
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Título del recibo */}
                      <div className="text-center font-bold text-sm mb-3">
                        RECIBO DE COMPRA
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Fecha y hora */}
                      <div className="mb-3">
                        <div className="text-xs">
                          <span className="font-bold">Fecha:</span> {fecha.toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold">Hora:</span> {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Lista de productos */}
                      <div className="mb-3">
                        <div className="flex justify-between font-bold text-xs mb-1">
                          <span>Descripción</span>
                          <span>Precio</span>
                        </div>
                        {cartItems.map((item) => {
                          return (
                            <div key={item.id} className="flex justify-between text-xs mb-1">
                              <div className="flex-1">
                                <span>{item.name}</span>
                                {item.quantity > 0 && (
                                  <span className="ml-1">x{item.quantity}</span>
                                )}
                              </div>
                              <span className="font-medium">
                                {formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Totales */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Subtotal:</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs mb-1">
                          <span>IVA (21%):</span>
                          <span>{formatPrice(iva)}</span>
                        </div>
                        
                        {discountPercentage > 0 && (
                          <div className="flex justify-between text-xs mb-1">
                            <span>Descuento ({formatNumber(discountPercentage, 0)}%):</span>
                            <span>-{formatPrice(descuento)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between font-bold text-sm mt-2 pt-1 border-t border-black">
                          <span>TOTAL:</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Método de pago simplificado */}
                      <div className="mb-3">
                        <div className="text-xs">
                          <span className="font-bold">Método de pago:</span> {metodoPago}
                        </div>
                      </div>

                      {/* Separador con asteriscos */}
                      <div className="text-center text-xs mb-3">
                        ******************************
                      </div>

                      {/* Mensaje de agradecimiento */}
                      <div className="text-center font-bold text-sm mb-3">
                        ¡GRACIAS!
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Mostrar QR si está disponible */}
                  {showQR && qrCode && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 text-center">
                        Código QR del Ticket
                      </h4>
                      <div className="flex justify-center mb-3">
                        <img src={qrCode} alt="QR Code" className="w-32 h-32" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Escanea este código para descargar el ticket PDF
                      </p>
                    </div>
                  )}

                  {/* Mostrar error si existe */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-75 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleGenerarQR}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <QrCodeIcon className="h-4 w-4" />
                      )}
                      {loading ? 'Generando...' : 'Generar QR'}
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors duration-75 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleGuardar}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      )}
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
