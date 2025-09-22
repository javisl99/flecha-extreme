'use client';

import { useState } from 'react';
import { Card } from '@/shared/components';
import { usePagos, type Pago } from '@/hooks/usePagos';
import { usePedidos, type Pedido } from '@/hooks/usePedidos';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import DetallePagoModal from '@/components/Pagos/DetallePagoModal';
import ModalPago from '@/components/Tienda/ModalPago';
import { FiltrosPagos, type FiltrosPagoState } from '@/components/Pagos/FiltrosPagos';

export default function PagosPage() {
  const [filtros, setFiltros] = useState<FiltrosPagoState>({
    cliente: '',
    origen_tipo: '',
    concepto: '',
    metodo: '',
    estado: ''
  });
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [pagoAEliminar, setPagoAEliminar] = useState<Pago | null>(null);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [isDetallePagoModalOpen, setIsDetallePagoModalOpen] = useState(false);
  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const { pagos, loading, error, eliminarPago, refreshPagos, actualizarPago } = usePagos();
  const { obtenerPedidoPorId } = usePedidos();
  
  const pagosFiltrados = pagos.filter(pago => {
    const cumpleCliente = !filtros.cliente || (
      pago.cliente ? 
      `${pago.cliente.nombre} ${pago.cliente.apellidos}`.toLowerCase().includes(filtros.cliente.toLowerCase()) :
      'Cliente no establecido'.toLowerCase().includes(filtros.cliente.toLowerCase())
    );
    const cumpleOrigen = !filtros.origen_tipo || pago.origen_tipo === filtros.origen_tipo;
    const cumpleConcepto = !filtros.concepto || pago.concepto.toLowerCase().includes(filtros.concepto.toLowerCase());
    const cumpleMetodo = !filtros.metodo || pago.metodo === filtros.metodo;
    const cumpleEstado = !filtros.estado || pago.estado === filtros.estado;

    return cumpleCliente && cumpleOrigen && cumpleConcepto && cumpleMetodo && cumpleEstado;
  });
  
  const capitalizarOrigen = (origen: Pago['origen_tipo']) => {
    return origen.charAt(0).toUpperCase() + origen.slice(1);
  };

  const formatearMetodoPago = (metodo: Pago['metodo']) => {
    const metodosFormateados: Record<Pago['metodo'], string> = {
      'efectivo': 'Efectivo',
      'tpv': 'Tarjeta',
      'tpv_online': 'Tarjeta Online',
      'bizum_alfonso': 'Bizum Alfonso',
      'bizum_robe': 'Bizum Robe',
      'bizum_alba': 'Bizum Alba',
      'bizum_maria': 'Bizum María',
      'bizum_jm': 'Bizum JM',
      'angeles': 'Ángeles'
    };
    return metodosFormateados[metodo] || metodo;
  };

  const formatearEstado = (estado: Pago['estado']) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const mostrarCliente = (pago: Pago) => {
    if (!pago.cliente) return 'Cliente no establecido';
    return `${pago.cliente.nombre} ${pago.cliente.apellidos}`;
  };

  const getEstadoColor = (estado: Pago['estado']) => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleEliminarPago = (pago: Pago) => {
    setPagoAEliminar(pago);
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!pagoAEliminar) return;
    
    try {
      const result = await eliminarPago(pagoAEliminar.id);
      if (!result.error) {
        toast.success('Pago eliminado correctamente');
        setPagoAEliminar(null);
        setIsModalConfirmacionOpen(false);
        await refreshPagos();
      } else {
        toast.error('Error al eliminar el pago');
      }
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      toast.error('Error al eliminar el pago');
    }
  };

  const handleVerPago = async (pago: Pago) => {
    if (pago.origen_tipo === 'pedido' && pago.origen_id) {
      // Si es un pago de pedido, cargar los datos del pedido y abrir ModalPago
      try {
        const pedido = await obtenerPedidoPorId(pago.origen_id);
        if (pedido) {
          setPedidoSeleccionado(pedido);
          setIsModalPagoOpen(true);
        } else {
          toast.error('No se pudo cargar la información del pedido');
        }
      } catch (error) {
        console.error('Error cargando pedido:', error);
        toast.error('Error al cargar la información del pedido');
      }
    } else {
      // Para otros tipos de pago, usar el modal de detalle normal
      setPagoSeleccionado(pago);
      setIsDetallePagoModalOpen(true);
    }
  };

  const handleFilaClick = (pago: Pago) => {
    handleVerPago(pago);
  };

  const handleCompletarPago = async (pago: Pago) => {
    try {
      const result = await actualizarPago(pago.id, {
        estado: 'completado'
      });

      if (!result.error) {
        await refreshPagos();
        setPagoSeleccionado(prev => prev ? { ...prev, estado: 'completado' } : null);
      } else {
        throw new Error('Error al actualizar el pago');
      }
    } catch (error) {
      console.error('Error al completar el pago:', error);
      throw error;
    }
  };

  const handleCancelarPago = async (pago: Pago) => {
    try {
      const result = await actualizarPago(pago.id, {
        estado: 'cancelado'
      });

      if (!result.error) {
        await refreshPagos();
        setPagoSeleccionado(prev => prev ? { ...prev, estado: 'cancelado' } : null);
      } else {
        throw new Error('Error al actualizar el pago');
      }
    } catch (error) {
      console.error('Error al cancelar el pago:', error);
      throw error;
    }
  };

  // Función para procesar los items del pedido y agregar producto desconocido si es necesario
  const procesarItemsPedido = (pedido: Pedido) => {
    if (!pedido.items) return [];

    // Calcular el total de los productos disponibles (sin descuento)
    const totalProductosDisponibles = pedido.items.reduce((total, item) => {
      const precio = item.producto?.precio || 0;
      return total + (precio * item.cantidad);
    }, 0);

    // El total almacenado en BD ya tiene aplicado el descuento
    const totalConDescuento = pedido.total;
    const descuento = pedido.descuento || 0;
    
    // Calcular el total original (antes del descuento) para comparar
    const totalOriginal = descuento > 0 ? totalConDescuento / (1 - descuento / 100) : totalConDescuento;

    // Calcular la diferencia entre el total original y los productos disponibles
    const diferencia = totalOriginal - totalProductosDisponibles;

    // Mapear los items existentes
    const itemsMapeados = pedido.items.map(item => ({
      id: item.id_producto,
      name: item.producto?.nombre || 'Producto no encontrado',
      price: item.producto?.precio || 0,
      quantity: item.cantidad,
      image: item.producto?.url_foto || '',
      stock: item.producto?.stock || 0
    }));

    // Si hay diferencia significativa (más de 0.01€ para evitar errores de redondeo), agregar producto desconocido
    if (Math.abs(diferencia) > 0.01) {
      itemsMapeados.push({
        id: 'producto-desconocido',
        name: 'Producto Desconocido',
        price: diferencia,
        quantity: 0, // No mostrar cantidad ya que no sabemos cuántas unidades había
        image: '',
        stock: 0
      });
    }

    return itemsMapeados;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Pagos</h1>
      </div>
      
      <Card>
        <FiltrosPagos onFiltrosChange={setFiltros} />
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-table-head-bg dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                {pagosFiltrados.map((pago) => (
                  <tr 
                    key={pago.id} 
                    className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleFilaClick(pago)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {capitalizarOrigen(pago.origen_tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {mostrarCliente(pago)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      }).format(pago.importe)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {pago.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                      {formatearMetodoPago(pago.metodo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`${getEstadoColor(pago.estado)} px-2 py-1 rounded-md text-xs font-medium`}>
                        {formatearEstado(pago.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" 
                          title="Ver"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerPago(pago);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1.5 rounded-full text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer" 
                          title="Eliminar"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarPago(pago);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {pagosFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron pagos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ModalConfirmacion
        isOpen={isModalConfirmacionOpen}
        onClose={() => {
          setIsModalConfirmacionOpen(false);
          setPagoAEliminar(null);
        }}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Pago"
        mensaje={`¿Estás seguro de que quieres eliminar este pago? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
      />

      <DetallePagoModal
        isOpen={isDetallePagoModalOpen}
        onClose={() => {
          setIsDetallePagoModalOpen(false);
          setPagoSeleccionado(null);
        }}
        pago={pagoSeleccionado}
        onCompletarPago={handleCompletarPago}
        onCancelarPago={handleCancelarPago}
      />

      <ModalPago
        isOpen={isModalPagoOpen}
        onClose={() => {
          setIsModalPagoOpen(false);
          setPedidoSeleccionado(null);
        }}
        onSubmit={async () => {
          // No hacer nada, solo mostrar los datos del pedido
          toast.success('Este es un pedido existente, no se puede modificar');
        }}
        cartItems={(() => {
          const items = pedidoSeleccionado ? procesarItemsPedido(pedidoSeleccionado) : [];
          return items;
        })()}
        discountPercentage={(() => {
          const discount = pedidoSeleccionado?.descuento || 0;
          return discount;
        })()}
        readOnly={true}
        pedidoData={pedidoSeleccionado ? {
          clienteId: pedidoSeleccionado.id_cliente,
          metodo: 'efectivo', // Valor por defecto, se puede obtener del pago asociado
          estado: 'completado', // Valor por defecto
          concepto: 'Pedido de tienda'
        } : undefined}
      />
    </div>
  );
}