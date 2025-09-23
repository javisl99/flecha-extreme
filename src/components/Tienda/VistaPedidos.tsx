'use client';

import { useState } from 'react';
import { Card } from '@/shared/components';
import { usePedidos, type Pedido } from '@/hooks/usePedidos';
import { FiltrosPedidos, type FiltrosPedidoState } from './FiltrosPedidos';
import TableSkeleton from '@/components/shared/TableSkeleton';
import ModalPago from './ModalPago';
import { formatPrice } from '@/lib/formatUtils';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';

export default function VistaPedidos() {
  const [filtros, setFiltros] = useState<FiltrosPedidoState>({
    cliente: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    concepto: ''
  });
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<Pedido | null>(null);
  
  const { pedidos, loading, error, eliminarPedido, refreshPedidos } = usePedidos();
  
  const pedidosFiltrados = pedidos.filter(pedido => {
    const cumpleCliente = !filtros.cliente || (
      pedido.cliente ? 
      `${pedido.cliente.nombre} ${pedido.cliente.apellidos}`.toLowerCase().includes(filtros.cliente.toLowerCase()) :
      'Cliente no establecido'.toLowerCase().includes(filtros.cliente.toLowerCase())
    );
    const cumpleEstado = !filtros.estado || pedido.estado === filtros.estado;
    const cumpleFechaDesde = !filtros.fecha_desde || new Date(pedido.fecha) >= new Date(filtros.fecha_desde);
    const cumpleFechaHasta = !filtros.fecha_hasta || new Date(pedido.fecha) <= new Date(filtros.fecha_hasta);
    const cumpleConcepto = !filtros.concepto || pedido.concepto?.toLowerCase().includes(filtros.concepto.toLowerCase());

    return cumpleCliente && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta && cumpleConcepto;
  });
  
  const formatearEstado = (estado: string) => {
    const estadosFormateados: Record<string, string> = {
      'pagado': 'Pagado',
      'pendiente': 'Pendiente',
      'cancelado': 'Cancelado',
      'en_proceso': 'En Proceso'
    };
    return estadosFormateados[estado] || estado;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'en_proceso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const mostrarCliente = (pedido: Pedido) => {
    if (!pedido.cliente) return 'Cliente no establecido';
    return `${pedido.cliente.nombre} ${pedido.cliente.apellidos}`;
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleVerPedido = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setIsModalPagoOpen(true);
  };

  const handleFilaClick = (pedido: Pedido) => {
    handleVerPedido(pedido);
  };

  const handleEliminarClick = (pedido: Pedido, e: React.MouseEvent) => {
    e.stopPropagation();
    setPedidoAEliminar(pedido);
    setMostrarModalEliminar(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!pedidoAEliminar) return;

    const exito = await eliminarPedido(pedidoAEliminar.id);
    
    if (exito) {
      toast.success('Pedido eliminado correctamente');
      setMostrarModalEliminar(false);
      setPedidoAEliminar(null);
    } else {
      toast.error('Error al eliminar el pedido');
    }
  };

  const handleCancelarEliminacion = () => {
    setMostrarModalEliminar(false);
    setPedidoAEliminar(null);
  };


  const handleDescargarTicket = async (pedido: Pedido, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!pedido.ticket_url) {
      toast.error('Este pedido no tiene ticket disponible');
      return;
    }

    try {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = pedido.ticket_url;
      link.download = `ticket_${pedido.id}_${new Date(pedido.fecha).toISOString().split('T')[0]}.pdf`;
      link.target = '_blank';
      
      // Añadir el enlace al DOM, hacer clic y removerlo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Descargando ticket...');
    } catch (error) {
      console.error('Error descargando ticket:', error);
      toast.error('Error al descargar el ticket');
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
        stock: 0 // No hay stock para productos desconocidos
      });
    }

    return itemsMapeados;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <FiltrosPedidos onFiltrosChange={setFiltros} />
        
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-table-head-bg dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Concepto
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
                {pedidosFiltrados.map((pedido) => (
                  <tr 
                    key={pedido.id} 
                    className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleFilaClick(pedido)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatearFecha(pedido.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {mostrarCliente(pedido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900 dark:text-gray-100">
                      {formatPrice(pedido.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 dark:text-gray-300">
                      {pedido.descuento > 0 ? `${pedido.descuento}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {pedido.concepto || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`${getEstadoColor(pedido.estado)} px-2 py-1 rounded-md text-xs font-medium`}>
                        {formatearEstado(pedido.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer" 
                          title="Ver pedido"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerPedido(pedido);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {pedido.ticket_url && (
                          <button 
                            className="p-1.5 rounded-full text-blue-600 dark:text-blue-500 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer" 
                            title="Descargar ticket"
                            onClick={(e) => handleDescargarTicket(pedido, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button 
                          className="p-1.5 rounded-full text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer" 
                          title="Eliminar pedido"
                          onClick={(e) => handleEliminarClick(pedido, e)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {pedidosFiltrados.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron pedidos con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ModalPago
        isOpen={isModalPagoOpen}
        onClose={() => {
          setIsModalPagoOpen(false);
          setPedidoSeleccionado(null);
        }}
        onSubmit={async () => {
          // No hacer nada, solo mostrar los datos del pedido
          toast.success('Este es un pedido existente, no se puede modificar');
          return;
        }}
        cartItems={pedidoSeleccionado ? procesarItemsPedido(pedidoSeleccionado) : []}
        discountPercentage={pedidoSeleccionado?.descuento || 0}
        readOnly={true}
        pedidoData={pedidoSeleccionado ? {
          pedidoId: pedidoSeleccionado.id,
          clienteId: pedidoSeleccionado.id_cliente,
          metodo: 'efectivo', // Valor por defecto
          estado: pedidoSeleccionado.estado as 'completado' | 'pendiente' | 'cancelado',
          concepto: pedidoSeleccionado.concepto || ''
        } : undefined}
        onPedidoUpdated={refreshPedidos}
      />

      {/* Modal de confirmación de eliminación */}
      <ModalConfirmacion
        isOpen={mostrarModalEliminar}
        onClose={handleCancelarEliminacion}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar Pedido"
        mensaje={`¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
      />

    </div>
  );
}
