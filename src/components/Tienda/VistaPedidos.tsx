'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePedidos, type Pedido } from '@/hooks/usePedidos';
import { FiltrosPedidos, type FiltrosPedidoState } from './FiltrosPedidos';
import TableSkeleton from '@/components/shared/TableSkeleton';
import ModalPago from './ModalPago';
import { formatPrice } from '@/lib/formatUtils';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import PaginationControls from '@/components/shared/PaginationControls';

const PEDIDOS_POR_PAGINA = 10;

export default function VistaPedidos() {
  const [filtros, setFiltros] = useState<FiltrosPedidoState>({
    cliente: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    concepto: '',
  });
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<Pedido | null>(null);
  const [paginaPedidos, setPaginaPedidos] = useState(1);

  const { pedidos, loading, error, eliminarPedido, refreshPedidos } = usePedidos();

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const cumpleCliente =
        !filtros.cliente ||
        (pedido.cliente
          ? `${pedido.cliente.nombre} ${pedido.cliente.apellidos}`.toLowerCase().includes(filtros.cliente.toLowerCase())
          : 'cliente no establecido'.includes(filtros.cliente.toLowerCase()));

      const cumpleEstado = !filtros.estado || pedido.estado === filtros.estado;
      const cumpleFechaDesde = !filtros.fecha_desde || new Date(pedido.fecha) >= new Date(filtros.fecha_desde);
      const cumpleFechaHasta = !filtros.fecha_hasta || new Date(pedido.fecha) <= new Date(filtros.fecha_hasta);
      const cumpleConcepto = !filtros.concepto || pedido.concepto?.toLowerCase().includes(filtros.concepto.toLowerCase());

      return cumpleCliente && cumpleEstado && cumpleFechaDesde && cumpleFechaHasta && cumpleConcepto;
    });
  }, [filtros, pedidos]);

  const totalPaginasPedidos = Math.max(1, Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA));
  const paginaPedidosActiva = Math.min(paginaPedidos, totalPaginasPedidos);
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaPedidosActiva - 1) * PEDIDOS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
  }, [paginaPedidosActiva, pedidosFiltrados]);

  useEffect(() => {
    setPaginaPedidos(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaPedidos((paginaActual) => Math.min(paginaActual, totalPaginasPedidos));
  }, [totalPaginasPedidos]);

  const formatearEstado = (estado: string) => {
    const estadosFormateados: Record<string, string> = {
      pagado: 'Pagado',
      pendiente: 'Pendiente',
      cancelado: 'Cancelado',
      en_proceso: 'En proceso',
    };

    return estadosFormateados[estado] || estado;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
      case 'pendiente':
        return 'border-amber-200 bg-amber-100 text-amber-700';
      case 'cancelado':
        return 'border-red-200 bg-red-100 text-red-700';
      case 'en_proceso':
        return 'border-blue-200 bg-blue-100 text-blue-700';
      default:
        return 'border-outline-variant/40 bg-surface-container-low text-on-surface-variant';
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
      minute: '2-digit',
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
      const link = document.createElement('a');
      link.href = pedido.ticket_url;
      link.download = `ticket_${pedido.id}_${new Date(pedido.fecha).toISOString().split('T')[0]}.pdf`;
      link.target = '_blank';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Descargando ticket...');
    } catch (downloadError) {
      console.error('Error descargando ticket:', downloadError);
      toast.error('Error al descargar el ticket');
    }
  };

  const procesarItemsPedido = (pedido: Pedido) => {
    if (!pedido.items) return [];

    const totalProductosDisponibles = pedido.items.reduce((total, item) => {
      const precio = item.producto?.precio || 0;
      return total + precio * item.cantidad;
    }, 0);

    const totalConDescuento = pedido.total;
    const descuento = pedido.descuento || 0;
    const totalOriginal = descuento > 0 ? totalConDescuento / (1 - descuento / 100) : totalConDescuento;
    const diferencia = totalOriginal - totalProductosDisponibles;

    const itemsMapeados = pedido.items.map((item) => ({
      id: item.id_producto,
      name: item.producto?.nombre || 'Producto no encontrado',
      price: item.producto?.precio || 0,
      quantity: item.cantidad,
      image: item.producto?.url_foto || '',
      stock: item.producto?.stock || 0,
    }));

    if (Math.abs(diferencia) > 0.01) {
      itemsMapeados.push({
        id: 'producto-desconocido',
        name: 'Producto desconocido',
        price: diferencia,
        quantity: 0,
        image: '',
        stock: 0,
      });
    }

    return itemsMapeados;
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50/70 text-sm font-semibold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FiltrosPedidos
        onFiltrosChange={setFiltros}
        title="Listado de pedidos"
        subtitle="Revisa y filtra los pedidos de la tienda desde una sola vista."
      />

      <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
        <div className="hidden overflow-x-auto md:block">
          {loading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : (
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/70 backdrop-blur-md">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Fecha</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Cliente</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Total</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Descuento</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">Concepto</th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">Estado</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPaginados.map((pedido, index) => (
                  <tr
                    key={pedido.id}
                    className={`cursor-pointer border-b border-outline-variant/10 transition ${
                      index % 2 ? 'bg-surface-container-low/25 hover:bg-surface-container-low' : 'hover:bg-surface-container-low'
                    }`}
                    onClick={() => handleFilaClick(pedido)}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-on-surface">{formatearFecha(pedido.fecha)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-on-surface-variant">{mostrarCliente(pedido)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-primary-dark">{formatPrice(pedido.total)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-on-surface-variant">
                      {pedido.descuento > 0 ? `${pedido.descuento}%` : '-'}
                    </td>
                    <td className="max-w-[260px] truncate px-6 py-4 text-sm text-on-surface-variant">{pedido.concepto || '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${getEstadoColor(pedido.estado)}`}>
                        {formatearEstado(pedido.estado)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-low text-primary transition hover:border-primary/30 hover:bg-primary/10"
                          title="Ver pedido"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerPedido(pedido);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {pedido.ticket_url ? (
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                            title="Descargar ticket"
                            onClick={(e) => handleDescargarTicket(pedido, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        ) : null}

                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          title="Eliminar pedido"
                          onClick={(e) => handleEliminarClick(pedido, e)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pedidosFiltrados.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-outline">
                      No se encontraron pedidos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <TableSkeleton columns={1} rows={4} />
          ) : pedidosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
              No se encontraron pedidos con los filtros seleccionados.
            </div>
          ) : (
            pedidosPaginados.map((pedido) => (
              <div
                key={pedido.id}
                role="button"
                tabIndex={0}
                onClick={() => handleFilaClick(pedido)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleFilaClick(pedido);
                  }
                }}
                className="w-full rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4 text-left transition hover:bg-surface-container-high"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{mostrarCliente(pedido)}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{formatearFecha(pedido.fecha)}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${getEstadoColor(pedido.estado)}`}>
                    {formatearEstado(pedido.estado)}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                  <p className="font-medium text-on-surface">{pedido.concepto || '-'}</p>
                  <p>Descuento: {pedido.descuento > 0 ? `${pedido.descuento}%` : '-'}</p>
                  <p className="font-bold text-primary-dark">{formatPrice(pedido.total)}</p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="min-h-11 flex-1 rounded-full border border-outline-variant/35 bg-surface-container-low px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerPedido(pedido);
                    }}
                  >
                    Ver pedido
                  </button>
                  <button
                    className="min-h-11 flex-1 rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    onClick={(e) => handleDescargarTicket(pedido, e)}
                  >
                    Ticket
                  </button>
                  <button
                    className="min-h-11 flex-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    onClick={(e) => handleEliminarClick(pedido, e)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <PaginationControls
          currentPage={paginaPedidosActiva}
          totalPages={totalPaginasPedidos}
          totalItems={pedidosFiltrados.length}
          pageSize={PEDIDOS_POR_PAGINA}
          onPageChange={setPaginaPedidos}
        />
      </section>

      <ModalPago
        isOpen={isModalPagoOpen}
        onClose={() => {
          setIsModalPagoOpen(false);
          setPedidoSeleccionado(null);
        }}
        onSubmit={async () => {
          toast.success('Este es un pedido existente, no se puede modificar');
          return;
        }}
        cartItems={pedidoSeleccionado ? procesarItemsPedido(pedidoSeleccionado) : []}
        discountPercentage={pedidoSeleccionado?.descuento || 0}
        readOnly={true}
        pedidoData={
          pedidoSeleccionado
            ? {
                pedidoId: pedidoSeleccionado.id,
                clienteId: pedidoSeleccionado.id_cliente,
                metodo: 'efectivo',
                estado: pedidoSeleccionado.estado as 'completado' | 'pendiente' | 'cancelado',
                concepto: pedidoSeleccionado.concepto || '',
              }
            : undefined
        }
        onPedidoUpdated={refreshPedidos}
      />

      <ModalConfirmacion
        isOpen={mostrarModalEliminar}
        onClose={handleCancelarEliminacion}
        onConfirm={handleConfirmarEliminacion}
        titulo="Eliminar pedido"
        mensaje="¿Estas seguro de que quieres eliminar este pedido? Esta accion no se puede deshacer."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        variante="pagos-v2"
      />
    </div>
  );
}
