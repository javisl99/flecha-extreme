'use client';

import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ReceiptPercentIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/lib/formatUtils';
import { useActividades } from '@/hooks/useActividades';
import SurfSpinner from '@/components/shared/SurfSpinner';
import TicketCompra from '@/components/Tienda/TicketCompra';
import { SelectorCliente } from '@/components/Actividades/SelectorCliente';
import { useClientes } from '@/hooks/useClientes';
import { useTickets } from '@/hooks/useTickets';
import { toast } from 'react-hot-toast';

type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface ActividadReserva {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  duracion: string;
  empresa: string;
  numeroPersonas: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  nota?: string;
}

interface PagoReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    actividad: ActividadReserva;
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
  }) => Promise<{ reservaId?: string } | void>;
  actividad: ActividadReserva;
  readOnly?: boolean;
  reservaData?: {
    metodo: MetodoPago;
    estado: EstadoPago;
    concepto: string;
  };
}

export default function PagoReservaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  actividad,
  readOnly = false,
  reservaData
}: PagoReservaModalProps) {
  const { crearReserva, crearPago, obtenerIdEmpresa, obtenerIdCliente } = useActividades();
  const { clientes } = useClientes();
  const { saveTicket } = useTickets();
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [concepto, setConcepto] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [esReserva, setEsReserva] = useState(false);
  const [precioReserva, setPrecioReserva] = useState<number>(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const [processedPaymentData, setProcessedPaymentData] = useState<{
    actividad: ActividadReserva;
    subtotal: number;
    descuento: number;
    discountPercentage: number;
    iva: number;
    total: number;
    metodoPago: string;
    fecha: Date;
    reservaId?: string;
    estadoPago: EstadoPago;
  } | null>(null);

  // Inicializar valores cuando se proporcionen datos de la reserva
  useEffect(() => {
    if (reservaData && readOnly) {
      setMetodoPago(reservaData.metodo);
      setConcepto(reservaData.concepto);
    }
  }, [reservaData, readOnly]);

  const metodosPago = useMemo(() => [
    { value: 'efectivo' as MetodoPago, label: 'Efectivo' },
    { value: 'tpv' as MetodoPago, label: 'Tarjeta (TPV)' },
    { value: 'bizum_alfonso' as MetodoPago, label: 'Bizum Alfonso' },
    { value: 'bizum_robe' as MetodoPago, label: 'Bizum Robe' },
    { value: 'bizum_alba' as MetodoPago, label: 'Bizum Alba' },
    { value: 'bizum_maria' as MetodoPago, label: 'Bizum María' },
    { value: 'bizum_jm' as MetodoPago, label: 'Bizum JM' },
    { value: 'angeles' as MetodoPago, label: 'Ángeles' }
  ], []);

  // Obtener el método de pago optimizado
  const selectedMetodoPago = useMemo(() => 
    metodosPago.find(m => m.value === metodoPago), 
    [metodoPago, metodosPago]
  );

  // Cálculos de precios optimizados con useMemo
  const { subtotal, descuento, iva, total, precioRestante } = useMemo(() => {
    const subtotal = actividad.precio;
    const descuento = 0; // Sin descuento por defecto para actividades
    const subtotalConDescuento = subtotal - descuento;
    const iva = subtotalConDescuento * 0.21; // 21% de IVA (informativo)
    
    // Si es reserva, el pago inmediato es el precio de reserva
    // y se genera un pago pendiente con el precio restante
    const total = esReserva ? precioReserva : subtotalConDescuento;
    const precioRestante = esReserva ? subtotalConDescuento - precioReserva : 0;
    
    return { subtotal, descuento, iva, total, precioRestante };
  }, [actividad.precio, esReserva, precioReserva]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actividad) {
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  const handleConfirmPaymentWithState = async (estado: EstadoPago) => {
    setIsProcessing(true);
    
    try {
      let reservaId: string | undefined;
      
      if (!readOnly) {
        // Validar que se haya seleccionado un cliente
        if (!selectedClienteId) {
          throw new Error('Debe seleccionar un cliente');
        }

        // Obtener los datos del cliente seleccionado
        const clienteSeleccionado = clientes.find(c => c.id === selectedClienteId);
        if (!clienteSeleccionado) {
          throw new Error('Cliente seleccionado no encontrado');
        }

        // Obtener el ID de la empresa
        const resultadoEmpresa = await obtenerIdEmpresa(actividad.empresa);
        if (!resultadoEmpresa.success) {
          throw new Error(resultadoEmpresa.message);
        }
        
        // Obtener el ID del cliente
        const resultadoCliente = await obtenerIdCliente(clienteSeleccionado.nombre, clienteSeleccionado.apellidos);
        if (!resultadoCliente.success) {
          throw new Error(resultadoCliente.message);
        }
        
        // Crear la reserva en la base de datos
        // Crear fechas sin conversión de zona horaria
        const [añoInicio, mesInicio, diaInicio] = actividad.fechaInicio.split('-');
        const [horaInicio, minutoInicio] = actividad.horaInicio.split(':');
        const [añoFin, mesFin, diaFin] = actividad.fechaFin.split('-');
        const [horaFin, minutoFin] = actividad.horaFin.split(':');
        
        const fechaInicio = new Date(parseInt(añoInicio), parseInt(mesInicio) - 1, parseInt(diaInicio), parseInt(horaInicio), parseInt(minutoInicio), 0);
        const fechaFin = new Date(parseInt(añoFin), parseInt(mesFin) - 1, parseInt(diaFin), parseInt(horaFin), parseInt(minutoFin), 0);
        
        const resultadoReserva = await crearReserva({
          id_cliente: resultadoCliente.clienteId!,
          id_actividad: actividad.id,
          id_empresa: resultadoEmpresa.empresaId!,
          cantidad_reservada: actividad.cantidad,
          precio: actividad.precio,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          estado: esReserva ? 'pendiente' : (estado === 'completado' ? 'confirmada' : 'pendiente'),
          nota: actividad.nota || undefined
        });
        
        if (!resultadoReserva.success) {
          throw new Error(resultadoReserva.message);
        }
        
        reservaId = resultadoReserva.reservaId;
        
        // Crear los pagos en la base de datos
        if (esReserva && precioRestante > 0) {
          // Crear pago inmediato (reserva)
          const resultadoPagoReserva = await crearPago({
            id_cliente: resultadoCliente.clienteId!,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: `Reserva - ${concepto}`,
            importe: precioReserva,
            metodo: metodoPago,
            estado: 'completado'
          });
          
          if (!resultadoPagoReserva.success) {
            throw new Error(resultadoPagoReserva.message);
          }
          
          // Crear pago pendiente (resto)
          const resultadoPagoPendiente = await crearPago({
            id_cliente: resultadoCliente.clienteId!,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: `Pago pendiente - ${concepto}`,
            importe: precioRestante,
            metodo: metodoPago,
            estado: 'pendiente'
          });
          
          if (!resultadoPagoPendiente.success) {
            throw new Error(resultadoPagoPendiente.message);
          }
        } else {
          // Crear pago normal (sin reserva)
          const resultadoPago = await crearPago({
            id_cliente: resultadoCliente.clienteId!,
            origen_tipo: 'reserva',
            origen_id: reservaId!,
            concepto: concepto,
            importe: actividad.precio,
            metodo: metodoPago,
            estado: estado
          });
          
          if (!resultadoPago.success) {
            throw new Error(resultadoPago.message);
          }
        }
      }
      
      // Preservar los datos del pago para el ticket
      const paymentData = {
        actividad: { 
          ...actividad,
          // Si es reserva, modificar el precio para el ticket
          precio: esReserva ? precioReserva : actividad.precio
        },
        subtotal: esReserva ? precioReserva : subtotal,
        descuento,
        discountPercentage: 0,
        iva: esReserva ? precioReserva * 0.21 : iva,
        total,
        metodoPago: (() => {
          const metodo = selectedMetodoPago?.label || 'Efectivo';
          if (metodo.includes('Bizum')) return 'Bizum';
          if (metodo.includes('Tarjeta')) return 'Tarjeta';
          return 'Efectivo';
        })(),
        fecha: new Date(),
        reservaId,
        estadoPago: estado
      };
      
      setProcessedPaymentData(paymentData);
      
      // Ejecutar onSubmit del componente padre si no es readOnly
      if (!readOnly) {
        await onSubmit({
          actividad,
          subtotal,
          descuento,
          descuentoPorcentaje: 0,
          iva,
          total,
          concepto, // Usar el concepto del campo del formulario
          pago: {
            metodo: metodoPago,
            estado: estado
          }
        });
      }
      
      // Cerrar modal de confirmación y abrir modal del ticket
      setShowConfirmationModal(false);
      setShowTicketModal(true);
    } catch (error: unknown) {
      console.error('Error procesando pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar el pago';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    await handleConfirmPaymentWithState('completado');
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
        cartItems: [{
          id: processedPaymentData.actividad.id,
          name: esReserva 
            ? `Reserva - ${processedPaymentData.actividad.nombre}`
            : processedPaymentData.actividad.nombre,
          price: processedPaymentData.actividad.precio / processedPaymentData.actividad.numeroPersonas,
          quantity: processedPaymentData.actividad.numeroPersonas,
          image: '',
        }],
        subtotal: processedPaymentData.subtotal,
        descuento: processedPaymentData.descuento,
        discountPercentage: processedPaymentData.discountPercentage,
        iva: processedPaymentData.iva,
        total: processedPaymentData.total,
        metodoPago: processedPaymentData.metodoPago,
        fecha: processedPaymentData.fecha,
        pedidoId: processedPaymentData.reservaId,
        clienteId: selectedClienteId || undefined,
        estadoPago: processedPaymentData.estadoPago
      };

      const result = await saveTicket(ticketData);
      
      if (result.success && result.url) {
        // Actualizar la tabla reserva con la URL del ticket
        if (processedPaymentData.reservaId) {
          try {
            const supabase = (await import('@/lib/supabaseClient')).default;
            await supabase
              .from('reserva_servicio')
              .update({ ticket_url: result.url })
              .eq('id', processedPaymentData.reservaId);
          } catch (err) {
            console.error('❌ Error en catch al actualizar tabla reserva:', err);
            console.warn('Error al actualizar la URL del ticket en la tabla reserva:', err);
          }
        } else {
          console.warn('⚠️ No hay reservaId para actualizar la tabla reserva');
        }

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
    // Limpiar formulario y cerrar modal
    setSelectedClienteId(null);
    setMetodoPago('efectivo');
    setConcepto('');
    onClose();
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
              <Dialog.Panel className="relative w-full max-w-4xl max-h-[90vh] transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform">
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
                            Procesar Pago de Reserva
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {actividad.nombre} - {actividad.empresa}
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
                  <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Columna izquierda - Cliente y Método de pago */}
                      <div className="space-y-6">
                        {/* Selector de cliente */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cliente *
                          </label>
                          <SelectorCliente
                            selectedClienteId={selectedClienteId}
                            onClienteChange={setSelectedClienteId}
                            placeholder="Seleccionar cliente"
                            className="w-full"
                            disabled={readOnly}
                          />
                        </div>

                        {/* Switch de Reserva y Precio de Reserva */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* Switch de Reserva */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Reserva
                            </label>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setEsReserva(!esReserva)}
                                disabled={readOnly}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
                                  esReserva 
                                    ? 'bg-primary' 
                                    : 'bg-gray-200 dark:bg-gray-700'
                                } ${
                                  readOnly ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    esReserva ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                              {esReserva ? 'Activado' : 'Desactivado'}
                            </span>
                          </div>
                          </div>

                          {/* Precio de Reserva */}
                          {esReserva && (
                            <div>
                              <label htmlFor="precioReserva" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Precio de Reserva (€)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  id="precioReserva"
                                  value={precioReserva}
                                  onChange={(e) => setPrecioReserva(parseFloat(e.target.value) || 0)}
                                  disabled={readOnly}
                                  min="0"
                                  step="0.01"
                                  className={`w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                                    readOnly 
                                      ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                  } border-gray-300 dark:border-gray-600`}
                                  placeholder="0.00"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 dark:text-gray-400 text-sm">€</span>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Pago inmediato al realizar la reserva
                              </p>
                            </div>
                          )}
                        </div>

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
                        </div>
                      </div>

                      {/* Columna derecha - Ticket de reserva */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          Ticket de Reserva
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
                                minute: '2-digit',
                                timeZone: 'Europe/Madrid'
                              })}
                            </p>
                          </div>

                          {/* Información de la actividad */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {actividad.nombre}
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <div>Empresa: {actividad.empresa}</div>
                                  <div>Duración: {actividad.duracion}</div>
                                  <div>Personas: {actividad.numeroPersonas}</div>
                                  <div>Fecha: {new Date(actividad.fechaInicio).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'Europe/Madrid'
                                  })}</div>
                                  <div>Hora: {actividad.horaInicio} - {actividad.horaFin}</div>
                                </div>
                              </div>
                              <span className="text-gray-900 dark:text-gray-100 font-medium">
                                {formatPrice(actividad.precio)}
                              </span>
                            </div>
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
                            
                            {esReserva && precioRestante > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mt-3">
                                <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                  <strong>Pago con Reserva:</strong>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">Pago inmediato (reserva):</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(precioReserva)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-blue-600 dark:text-blue-400">Pago pendiente:</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    {formatPrice(precioRestante)}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-900 dark:text-gray-100">
                                  {esReserva ? 'TOTAL A PAGAR AHORA:' : 'TOTAL:'}
                                </span>
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
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors duration-75 cursor-pointer"
                        onClick={onClose}
                        disabled={isProcessing}
                      >
                        {readOnly ? 'Cerrar' : 'Cancelar'}
                      </button>
                      {!readOnly && (
                        <button
                          type="submit"
                          disabled={!actividad || !selectedClienteId || isProcessing}
                          className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-transform">
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
                        {!esReserva 
                          ? `Seleccione cómo desea procesar el pago de ${formatPrice(total)}`
                          : `Por favor, confirme cuando haya recibido el pago de ${formatPrice(total)}`
                        }
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
                            <span>Actividad:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {actividad.nombre}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones */}
                      {!esReserva ? (
                        // Opciones para pago completo (sin reserva)
                        <div className="flex flex-col space-y-3">
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-75 cursor-pointer"
                              onClick={handleCancelPayment}
                              disabled={isProcessing}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                      ) : (
                        // Opción única para reserva
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-75 cursor-pointer"
                            onClick={handleCancelPayment}
                            disabled={isProcessing}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            onClick={handleConfirmPayment}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Procesando...</span>
                              </div>
                            ) : (
                              'Confirmar Pago'
                            )}
                          </button>
                        </div>
                      )}
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
          cartItems={[{
            id: processedPaymentData.actividad.id,
            name: esReserva 
              ? `Reserva - ${processedPaymentData.actividad.nombre} - Personas:`
              : `${processedPaymentData.actividad.nombre} - Personas:`,
            price: processedPaymentData.actividad.precio / processedPaymentData.actividad.numeroPersonas,
            quantity: processedPaymentData.actividad.numeroPersonas, 
            image: '',
          }]}
          subtotal={processedPaymentData.subtotal}
          descuento={processedPaymentData.descuento}
          discountPercentage={processedPaymentData.discountPercentage}
          iva={processedPaymentData.iva}
          total={processedPaymentData.total}
          metodoPago={processedPaymentData.metodoPago}
          fecha={processedPaymentData.fecha}
          pedidoId={processedPaymentData.reservaId}
          clienteId={selectedClienteId || undefined}
          estadoPago={processedPaymentData.estadoPago}
          isSaving={isSavingTicket}
        />
      )}
    </Transition.Root>
  );
}
