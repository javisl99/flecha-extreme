'use client';

import { useState } from 'react';
import { Button } from '@/shared/components';
import { useActividades } from '@/hooks/useActividades';
import { useTickets } from '@/hooks/useTickets';
import { useEmailAPI } from '@/hooks/useEmailAPI';
import { useSupabase } from '@/hooks/useSupabase';
import TicketCompra from '@/components/Tienda/TicketCompra';
import { toast } from 'react-hot-toast';

interface Reserva {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_cliente?: string;
  cliente?: {
    id?: string;
    nombre: string;
    apellidos: string;
    email?: string;
  };
  actividad?: {
    nombre: string;
  };
  empresa?: {
    nombre: string;
  };
  estado: string;
  precio: number;
  cantidad_reservada: number;
  nota?: string;
  ticket_url?: string;
  ticket_url_reserva?: string;
}

interface ModalDetalleReservaProps {
  isOpen: boolean;
  reserva: Reserva | null;
  onClose: () => void;
  onActualizarEstado: (reserva: Reserva, nuevoEstado: string) => void;
}

export default function ModalDetalleReserva({ 
  isOpen, 
  reserva, 
  onClose, 
  onActualizarEstado 
}: ModalDetalleReservaProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [pagoPendiente, setPagoPendiente] = useState<{
    id: string;
    concepto: string;
    importe: number;
    metodo: string;
    id_cliente: string;
  } | null>(null);
  const [isLoadingPago, setIsLoadingPago] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  
  const { obtenerPagosPendientesReserva, obtenerTodosLosPagosReserva, actualizarTicketUrlReserva, actualizarEstadoPago } = useActividades();
  const { saveTicket } = useTickets();
  const { sendTicketEmail } = useEmailAPI();
  const { supabase } = useSupabase();

  if (!isOpen || !reserva) return null;

  // Función para obtener el email del cliente
  const obtenerEmailCliente = async (clienteId: string): Promise<string | null> => {
    // Validar que el clienteId no esté vacío y sea un UUID válido
    if (!clienteId || clienteId.trim() === '') {
      console.warn('⚠️ ID de cliente vacío o inválido:', clienteId);
      return null;
    }

    // Validar formato básico de UUID (8-4-4-4-12 caracteres hexadecimales)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clienteId)) {
      console.warn('⚠️ ID de cliente no tiene formato UUID válido:', clienteId);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('email')
        .eq('id', clienteId)
        .single();

      if (error) {
        console.error('Error obteniendo email del cliente:', error);
        return null;
      }

      return data?.email || null;
    } catch (error) {
      console.error('Error obteniendo email del cliente:', error);
      return null;
    }
  };

  const mostrarCliente = (reserva: Reserva) => {
    if (!reserva.cliente) return 'Cliente no establecido';
    return `${reserva.cliente.nombre} ${reserva.cliente.apellidos}`;
  };

  const mostrarActividad = (reserva: Reserva) => {
    if (!reserva.actividad) return 'Actividad no encontrada';
    return reserva.actividad.nombre;
  };

  const mostrarEmpresa = (reserva: Reserva) => {
    if (!reserva.empresa) return 'Empresa no establecida';
    return reserva.empresa.nombre;
  };

  const formatearEstado = (estado: string) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'completada': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Madrid'
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid'
    });
  };

  const handleConfirmarPago = async (reserva: Reserva) => {
    try {
      setIsLoadingPago(true);
      
      // Primero verificar cuántos pagos hay en total para esta reserva
      const resultadoTodos = await obtenerTodosLosPagosReserva(reserva.id);
      
      if (!resultadoTodos.success || !resultadoTodos.pagos) {
        toast.error('Error al obtener información de pagos');
        return;
      }

      // Si solo hay un pago (o ninguno), no generar ticket
      if (resultadoTodos.pagos.length <= 1) {
        // Si hay exactamente un pago, actualizar su estado a 'completado'
        if (resultadoTodos.pagos.length === 1) {
          const pagoUnico = resultadoTodos.pagos[0];
          console.log('🔄 Actualizando estado del único pago a completado:', pagoUnico.id);
          
          const resultadoActualizacion = await actualizarEstadoPago(pagoUnico.id, 'completado');
          
          if (!resultadoActualizacion.success) {
            console.error('❌ Error al actualizar estado del pago:', resultadoActualizacion.message);
            toast.error('Error al actualizar el estado del pago');
            return;
          }
          
          console.log('✅ Estado del pago actualizado correctamente');
        }
        
        toast.success('No hay pagos adicionales pendientes. La reserva se ha confirmado correctamente.');
        
        // Verificar si ticket_url_reserva es NULL y enviar correo con ticket_url si existe
        console.log('🔍 Verificando condiciones para envío de email:');
        console.log('- ticket_url_reserva es NULL:', !reserva.ticket_url_reserva);
        console.log('- ticket_url existe:', !!reserva.ticket_url);
        console.log('- ticket_url:', reserva.ticket_url);
        
        if (!reserva.ticket_url_reserva && reserva.ticket_url) {
          console.log('✅ Condiciones básicas se cumplen, obteniendo email del cliente...');
          
          // Obtener el email del cliente desde la base de datos
          const clienteEmail = await obtenerEmailCliente(reserva.id_cliente || '');
          console.log('📧 Email del cliente obtenido:', clienteEmail);
          
          if (clienteEmail) {
            console.log('✅ Email del cliente encontrado, procediendo a enviar email...');
            try {
              // Crear datos del ticket para el email
              const ticketData = {
                cartItems: [{
                  id: 'reserva-actividad',
                  name: reserva.actividad?.nombre || 'Actividad',
                  price: reserva.precio,
                  quantity: reserva.cantidad_reservada,
                  image: ''
                }],
                subtotal: reserva.precio,
                descuento: 0,
                discountPercentage: 0,
                iva: 0,
                total: reserva.precio,
                metodoPago: 'efectivo', // Valor por defecto
                fecha: new Date(reserva.fecha_inicio),
                pedidoId: undefined,
                clienteId: clienteEmail,
                estadoPago: 'completado' as const
              };

              console.log('📧 Datos del ticket preparados:', ticketData);
              console.log('📧 Enviando email a:', clienteEmail);
              console.log('📧 URL del ticket:', reserva.ticket_url);

              // Enviar email con el ticket
              const emailResult = await sendTicketEmail(
                {
                  id: clienteEmail,
                  nombre: reserva.cliente?.nombre || 'Cliente',
                  apellidos: reserva.cliente?.apellidos || '',
                  email: clienteEmail
                },
                ticketData,
                reserva.ticket_url,
                'completado'
              );

              console.log('📧 Resultado del envío de email:', emailResult);

              if (emailResult.success) {
                console.log('✅ Email enviado exitosamente');
                toast.success('Reserva confirmada y ticket enviado por correo al cliente');
              } else {
                console.log('❌ Error al enviar email:', emailResult.error);
                toast.success('Reserva confirmada, pero hubo un error al enviar el correo');
              }
            } catch (emailError) {
              console.error('❌ Error enviando email:', emailError);
              toast.success('Reserva confirmada, pero hubo un error al enviar el correo');
            }
          } else {
            console.log('❌ No se pudo obtener el email del cliente');
            toast.success('Reserva confirmada correctamente');
          }
        } else {
          console.log('❌ No se cumplen las condiciones para envío de email:');
          console.log('- ticket_url_reserva es NULL:', !reserva.ticket_url_reserva);
          console.log('- ticket_url existe:', !!reserva.ticket_url);
          // Si no hay ticket_url, solo confirmar
          toast.success('Reserva confirmada correctamente');
        }
        
        // Actualizar el estado de la reserva a confirmada
        onActualizarEstado(reserva, 'confirmada');
        return;
      }

      // Si hay múltiples pagos, buscar los pendientes
      const resultadoPendientes = await obtenerPagosPendientesReserva(reserva.id);
      
      if (!resultadoPendientes.success || !resultadoPendientes.pagos || resultadoPendientes.pagos.length === 0) {
        toast.error('No se encontraron pagos pendientes para esta reserva');
        return;
      }

      // Tomar el primer pago pendiente
      const pago = resultadoPendientes.pagos[0];
      setPagoPendiente({
        id: pago.id,
        concepto: pago.concepto,
        importe: pago.importe,
        metodo: pago.metodo,
        id_cliente: pago.cliente?.id || ''
      });
      setShowTicketModal(true);
      
      // NO actualizar el estado de la reserva aquí - se hará después de completar el ticket
      
    } catch (error) {
      console.error('Error al buscar pagos:', error);
      toast.error('Error al buscar información de pagos');
    } finally {
      setIsLoadingPago(false);
    }
  };

  const handleGuardarTicket = async () => {
    if (!pagoPendiente || !reserva) return;

    setIsSavingTicket(true);
    try {
      // Crear los datos del ticket para el pago pendiente
      const ticketData = {
        cartItems: [{
          id: 'pago-pendiente',
          name: pagoPendiente.concepto,
          price: pagoPendiente.importe,
          quantity: 1,
          image: ''
        }],
        subtotal: pagoPendiente.importe,
        descuento: 0,
        discountPercentage: 0,
        iva: 0,
        total: pagoPendiente.importe,
        metodoPago: pagoPendiente.metodo,
        fecha: new Date(),
        pedidoId: undefined,
        clienteId: pagoPendiente.id_cliente,
        estadoPago: 'pendiente' as const
      };

      console.log('💳 Guardando ticket de pago pendiente...');
      console.log('💳 Datos del ticket:', ticketData);

      const result = await saveTicket(ticketData);
      
      if (result.success && result.url) {
        console.log('✅ Ticket guardado exitosamente, URL:', result.url);
        
        // Actualizar la reserva con la URL del ticket
        const updateReservaResult = await actualizarTicketUrlReserva(reserva.id, result.url);
        
        // Actualizar el estado del pago a 'completado'
        const updatePagoResult = await actualizarEstadoPago(pagoPendiente.id, 'completado');
        
        if (updateReservaResult.success && updatePagoResult.success) {
          console.log('✅ Reserva y pago actualizados correctamente');
          
          // Obtener el email del cliente para enviar el ticket
          const clienteEmail = await obtenerEmailCliente(pagoPendiente.id_cliente);
          console.log('📧 Email del cliente obtenido:', clienteEmail);
          
          if (clienteEmail) {
            console.log('📧 Enviando email con ticket de pago pendiente...');
            try {
              // Enviar email con el ticket del pago pendiente
              const emailResult = await sendTicketEmail(
                {
                  id: clienteEmail,
                  nombre: reserva.cliente?.nombre || 'Cliente',
                  apellidos: reserva.cliente?.apellidos || '',
                  email: clienteEmail
                },
                ticketData,
                result.url,
                'completado'
              );

              console.log('📧 Resultado del envío de email:', emailResult);

              if (emailResult.success) {
                console.log('✅ Email con ticket de pago pendiente enviado exitosamente');
                toast.success('Ticket de pago pendiente generado y enviado por correo al cliente');
              } else {
                console.log('❌ Error al enviar email:', emailResult.error);
                toast.success('Ticket de pago pendiente generado, pero hubo un error al enviar el correo');
              }
            } catch (emailError) {
              console.error('❌ Error enviando email:', emailError);
              toast.success('Ticket de pago pendiente generado, pero hubo un error al enviar el correo');
            }
          } else {
            console.log('❌ No se pudo obtener el email del cliente');
            toast.success('Ticket de pago pendiente generado correctamente');
          }
          
          // Actualizar el estado de la reserva a confirmada DESPUÉS de completar el ticket
          onActualizarEstado(reserva, 'confirmada');
          
          setShowTicketModal(false);
          setPagoPendiente(null);
          onClose(); // Cerrar el modal de detalles
        } else {
          toast.error('Error al actualizar la reserva o el pago');
        }
      } else {
        toast.error(`Error al generar el ticket: ${result.error}`);
      }
    } catch (error) {
      console.error('Error al guardar el ticket:', error);
      toast.error('Error al guardar el ticket');
    } finally {
      setIsSavingTicket(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-card-bg dark:bg-card-bg border border-card-border dark:border-card-border rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header con fondo azul */}
        <div className="bg-primary text-white p-3 sm:p-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold">Detalles de la Reserva</h2>
          <button 
            className="text-white hover:text-gray-200 cursor-pointer text-xl font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-3 sm:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{mostrarCliente(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                <span className={`inline-block mt-1 text-sm px-2 py-1 rounded-full ${getEstadoColor(reserva.estado)}`}>
                  {formatearEstado(reserva.estado)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Actividad</label>
                <p className="text-gray-900 dark:text-gray-100">{mostrarActividad(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</label>
                <p className="text-gray-900 dark:text-gray-100">{mostrarEmpresa(reserva)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</label>
                <p className="text-gray-900 dark:text-gray-100">{formatearFecha(reserva.fecha_inicio)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Horario</label>
                <p className="text-gray-900 dark:text-gray-100">{formatearHora(reserva.fecha_inicio)} - {formatearHora(reserva.fecha_fin)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                <p className="text-gray-900 dark:text-gray-100">{reserva.cantidad_reservada}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Precio</label>
                <p className="font-medium text-gray-900 dark:text-gray-100">{reserva.precio} €</p>
              </div>
            </div>
            
            {reserva.nota && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</label>
                <p className="text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded">{reserva.nota}</p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex flex-col sm:flex-row gap-2">
              {reserva.estado !== 'confirmada' && (
                <button 
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleConfirmarPago(reserva)}
                  disabled={isLoadingPago}
                >
                  {isLoadingPago ? 'Buscando pagos...' : 'Confirmar pago'}
                </button>
              )}
              {reserva.estado !== 'cancelada' && (
                <button 
                  className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors cursor-pointer"
                  onClick={() => onActualizarEstado(reserva, 'cancelada')}
                >
                  Cancelar
                </button>
              )}
              <Button variant="outline" className="w-full sm:flex-1" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ticket de Pago Pendiente */}
      {showTicketModal && pagoPendiente && (
        <TicketCompra
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setPagoPendiente(null);
          }}
          onGuardar={handleGuardarTicket}
          cartItems={[{
            id: 'pago-pendiente',
            name: pagoPendiente.concepto,
            price: pagoPendiente.importe,
            quantity: 1,
            image: ''
          }]}
          subtotal={pagoPendiente.importe}
          descuento={0}
          discountPercentage={0}
          iva={0}
          total={pagoPendiente.importe}
          metodoPago={pagoPendiente.metodo}
          fecha={new Date()}
          pedidoId={undefined}
          clienteId={pagoPendiente.id_cliente}
          estadoPago="pendiente"
          isSaving={isSavingTicket}
        />
      )}
    </div>
  );
}
