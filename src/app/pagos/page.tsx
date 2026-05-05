'use client';

import { useState } from 'react';
import { usePagos, type Pago } from '@/hooks/usePagos';
import { usePedidos, type Pedido } from '@/hooks/usePedidos';
import { useActividades } from '@/hooks/useActividades';
import { toast } from 'react-hot-toast';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import DetallePagoModal from '@/components/Pagos/DetallePagoModal';
import ModalPago from '@/components/Tienda/ModalPago';
import PagoReservaModal from '@/components/Actividades/PagoReservaModal';
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
  const [isPagoReservaModalOpen, setIsPagoReservaModalOpen] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<{
    id: string;
    actividad?: { nombre: string };
    precio: number;
    cantidad_reservada: number;
    empresa?: { nombre: string };
    fecha_inicio: string;
    fecha_fin: string;
    nota?: string;
  } | null>(null);
  const { pagos, loading, error, eliminarPago, refreshPagos, actualizarPago } = usePagos();
  const { obtenerPedidoPorId } = usePedidos();
  const { obtenerReservas } = useActividades();
  
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
      case 'completado':
        return 'bg-emerald-100 text-emerald-700';
      case 'pendiente':
        return 'bg-amber-100 text-amber-700';
      case 'cancelado':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
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
    } else if (pago.origen_tipo === 'reserva' && pago.origen_id) {
      // Si es un pago de reserva, cargar los datos de la reserva y abrir PagoReservaModal
      try {
        const resultado = await obtenerReservas();
        if (resultado.success && resultado.reservas) {
          const reserva = resultado.reservas.find((r: { id: string }) => r.id === pago.origen_id);
          if (reserva) {
            setReservaSeleccionada(reserva);
            setIsPagoReservaModalOpen(true);
          } else {
            toast.error('No se pudo encontrar la reserva');
          }
        } else {
          toast.error('No se pudo cargar la información de la reserva');
        }
      } catch (error) {
        console.error('Error cargando reserva:', error);
        toast.error('Error al cargar la información de la reserva');
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

  // Función para transformar los datos de la reserva al formato esperado por PagoReservaModal
  const transformarReservaParaModal = (reserva: {
    id: string;
    actividad?: { nombre: string };
    precio: number;
    cantidad_reservada: number;
    empresa?: { nombre: string };
    fecha_inicio: string;
    fecha_fin: string;
    nota?: string;
  }) => {
    return {
      id: reserva.id,
      nombre: reserva.actividad?.nombre || 'Actividad no encontrada',
      precio: reserva.precio,
      cantidad: reserva.cantidad_reservada,
      duracion: '1 hora', // Valor por defecto, se puede calcular si es necesario
      empresa: reserva.empresa?.nombre || 'Empresa no establecida',
      numeroPersonas: reserva.cantidad_reservada,
      fechaInicio: reserva.fecha_inicio,
      fechaFin: reserva.fecha_fin,
      horaInicio: new Date(reserva.fecha_inicio).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid'
      }),
      horaFin: new Date(reserva.fecha_fin).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid'
      }),
      nota: reserva.nota || ''
    };
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
      <div className="flex min-h-screen-safe items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Pagos</h1>
      </div>

      <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <FiltrosPagos onFiltrosChange={setFiltros} />
        </div>

        <div className="border-t border-outline-variant/20" />

        <div className="hidden overflow-x-auto md:block">
          {loading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : (
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/70 backdrop-blur-md">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Origen
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Importe
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Concepto
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Método
                  </th>
                  <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago, index) => (
                  <tr
                    key={pago.id}
                    className={`cursor-pointer border-b border-outline-variant/10 transition hover:bg-surface-container-low ${
                      index % 2 ? 'bg-surface-container-low/25' : ''
                    }`}
                    onClick={() => handleFilaClick(pago)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-on-surface">
                      {capitalizarOrigen(pago.origen_tipo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface-variant">
                      {mostrarCliente(pago)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-on-surface">
                      {new Intl.NumberFormat('es-ES', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      }).format(pago.importe)}{' '}
                      €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface-variant">
                      {pago.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-primary">
                      {formatearMetodoPago(pago.metodo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`${getEstadoColor(pago.estado)} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                        {formatearEstado(pago.estado)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                          title="Ver"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerPago(pago);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                          title="Eliminar"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarPago(pago);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pagosFiltrados.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-outline">
                      No se encontraron pagos con los filtros seleccionados.
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
          ) : pagosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
              No se encontraron pagos con los filtros seleccionados.
            </div>
          ) : (
            pagosFiltrados.map((pago) => (
              <div
                key={pago.id}
                role="button"
                tabIndex={0}
                onClick={() => handleFilaClick(pago)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleFilaClick(pago);
                  }
                }}
                className="w-full rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4 text-left transition hover:bg-surface-container-high"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.08em] text-primary">
                      {capitalizarOrigen(pago.origen_tipo)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-on-surface">{mostrarCliente(pago)}</p>
                  </div>
                  <span className={`${getEstadoColor(pago.estado)} rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]`}>
                    {formatearEstado(pago.estado)}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                  <p className="font-medium text-on-surface">{pago.concepto}</p>
                  <p>Método: {formatearMetodoPago(pago.metodo)}</p>
                  <p className="font-bold text-primary-dark">
                    {new Intl.NumberFormat('es-ES', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }).format(pago.importe)}{' '}
                    €
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className="min-h-11 flex-1 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVerPago(pago);
                    }}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    className="min-h-11 flex-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarPago(pago);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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
        variante="pagos-v2"
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
          pedidoId: pedidoSeleccionado.id,
          clienteId: pedidoSeleccionado.id_cliente,
          metodo: 'efectivo', // Valor por defecto, se puede obtener del pago asociado
          estado: 'completado', // Valor por defecto
          concepto: 'Pedido de tienda'
        } : undefined}
      />

      <PagoReservaModal
        isOpen={isPagoReservaModalOpen}
        onClose={() => {
          setIsPagoReservaModalOpen(false);
          setReservaSeleccionada(null);
        }}
        onSubmit={async () => {
          // No hacer nada, solo mostrar los datos de la reserva
          toast.success('Este es un pago de reserva existente, no se puede modificar');
        }}
        actividad={reservaSeleccionada ? transformarReservaParaModal(reservaSeleccionada) : {
          id: '',
          nombre: '',
          precio: 0,
          cantidad: 0,
          duracion: '',
          empresa: '',
          numeroPersonas: 0,
          fechaInicio: '',
          fechaFin: '',
          horaInicio: '',
          horaFin: '',
          nota: ''
        }}
        readOnly={true}
        reservaData={reservaSeleccionada ? {
          metodo: 'efectivo', // Valor por defecto, se puede obtener del pago asociado
          estado: 'completado', // Valor por defecto
          concepto: 'Reserva de actividad'
        } : undefined}
      />
    </div>
  );
}
