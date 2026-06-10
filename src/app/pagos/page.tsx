'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePagos, type Pago } from '@/hooks/usePagos';
import { usePedidos, type Pedido } from '@/hooks/usePedidos';
import { useActividades, type Reserva as ReservaActividad } from '@/hooks/useActividades';
import { useSupabase } from '@/hooks/useSupabase';
import type { CampamentoInscripcion, CampamentoPrograma } from '@/lib/campamento';
import { toast } from 'react-hot-toast';
import TableSkeleton from '@/components/shared/TableSkeleton';
import DetallePagoModal from '@/components/Pagos/DetallePagoModal';
import DetallePagoInscripcionCampamentoModal from '@/components/Pagos/DetallePagoInscripcionCampamentoModal';
import ModalPago from '@/components/Tienda/ModalPago';
import ModalDetalleReserva from '@/components/Actividades/ModalDetalleReserva';
import { FiltrosPagos, type FiltrosPagoState } from '@/components/Pagos/FiltrosPagos';

export default function PagosPage() {
  return (
    <Suspense
      fallback={
        <div className="page-container px-6 py-10 text-sm text-outline">
          Cargando pagos...
        </div>
      }
    >
      <PagosPageContent />
    </Suspense>
  );
}

function PagosPageContent() {
  const searchParams = useSearchParams();
  const [filtros, setFiltros] = useState<FiltrosPagoState>({
    cliente: '',
    origen_tipo: '',
    concepto: '',
    metodo: '',
    estado: ''
  });
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null);
  const [isDetallePagoModalOpen, setIsDetallePagoModalOpen] = useState(false);
  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [isDetalleReservaModalOpen, setIsDetalleReservaModalOpen] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaActividad | null>(null);
  const [isDetallePagoCampamentoModalOpen, setIsDetallePagoCampamentoModalOpen] = useState(false);
  const [programaCampamentoSeleccionado, setProgramaCampamentoSeleccionado] = useState<CampamentoPrograma | null>(null);
  const [inscripcionCampamentoSeleccionada, setInscripcionCampamentoSeleccionada] = useState<CampamentoInscripcion | null>(null);
  const [ticketUrlsPorPago, setTicketUrlsPorPago] = useState<Record<string, string>>({});
  const pagoAutoseleccionadoRef = useRef(false);
  const { supabase } = useSupabase();
  const { pagos, loading, error, refreshPagos, actualizarPago } = usePagos();
  const { obtenerPedidoPorId } = usePedidos();
  const { obtenerReservaPorId, actualizarReserva, obtenerDetalleProgramaCampamento } = useActividades();
  
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
      'transferencia': 'Transferencia',
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

  const handleVerPago = useCallback(async (pago: Pago) => {
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
      // Si es un pago de reserva, cargar los datos de la reserva y abrir su detalle
      try {
        const resultado = await obtenerReservaPorId(pago.origen_id);
        if (resultado.success && resultado.reserva) {
          const reserva = resultado.reserva;
          if (reserva.campamento_programa_id) {
            const detallePrograma = await obtenerDetalleProgramaCampamento(reserva.campamento_programa_id);
            if (detallePrograma.success && detallePrograma.programa) {
              const inscripcion = detallePrograma.programa.inscripciones.find((item) => item.id === reserva.id) ?? null;
              setPagoSeleccionado(pago);
              setReservaSeleccionada(reserva);
              setProgramaCampamentoSeleccionado(detallePrograma.programa);
              setInscripcionCampamentoSeleccionada(inscripcion);
              setIsDetallePagoCampamentoModalOpen(true);
              return;
            }
          }

          setReservaSeleccionada(reserva);
          setIsDetalleReservaModalOpen(true);
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
  }, [obtenerDetalleProgramaCampamento, obtenerPedidoPorId, obtenerReservaPorId]);

  const handleAbrirTicketPago = async (pago: Pago) => {
    try {
      const ticketUrl = ticketUrlsPorPago[pago.id];
      if (!ticketUrl) {
        toast.error('Este pago no tiene ticket disponible');
        return;
      }

      window.open(ticketUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error abriendo ticket del pago:', error);
      toast.error('Error al abrir el ticket del pago');
    }
  };

  const handleFilaClick = (pago: Pago) => {
    handleVerPago(pago);
  };

  useEffect(() => {
    if (loading) return;

    const pagoId = searchParams.get('pagoId');
    if (!pagoId || pagoAutoseleccionadoRef.current) return;

    const pago = pagos.find((item) => item.id === pagoId);
    if (!pago) return;

    pagoAutoseleccionadoRef.current = true;
    queueMicrotask(() => {
      void handleVerPago(pago);
    });
  }, [handleVerPago, loading, pagos, searchParams]);

  useEffect(() => {
    let isCancelled = false;

    const cargarTicketsPorPago = async () => {
      const pagosConOrigen = pagos.filter(
        (pago) => Boolean(pago.origen_id) && (pago.origen_tipo === 'pedido' || pago.origen_tipo === 'reserva')
      );

      if (pagosConOrigen.length === 0) {
        if (!isCancelled) {
          setTicketUrlsPorPago({});
        }
        return;
      }

      const pedidoIds = Array.from(
        new Set(
          pagosConOrigen
            .filter((pago) => pago.origen_tipo === 'pedido' && pago.origen_id)
            .map((pago) => pago.origen_id as string)
        )
      );

      const reservaIds = Array.from(
        new Set(
          pagosConOrigen
            .filter((pago) => pago.origen_tipo === 'reserva' && pago.origen_id)
            .map((pago) => pago.origen_id as string)
        )
      );

      try {
        const [pedidosResult, reservasResult] = await Promise.all([
          pedidoIds.length > 0
            ? supabase.from('pedido').select('id, ticket_url').in('id', pedidoIds)
            : Promise.resolve({ data: [], error: null }),
          reservaIds.length > 0
            ? supabase.from('reserva_servicio').select('id, ticket_url, ticket_url_reserva').in('id', reservaIds)
            : Promise.resolve({ data: [], error: null })
        ]);

        if (pedidosResult.error) {
          throw pedidosResult.error;
        }

        if (reservasResult.error) {
          throw reservasResult.error;
        }

        const pedidosConTicket = new Map(
          (pedidosResult.data ?? [])
            .filter((pedido) => Boolean(pedido.ticket_url))
            .map((pedido) => [pedido.id, pedido.ticket_url as string])
        );

        const reservasConTicket = new Map(
          (reservasResult.data ?? []).map((reserva) => [
            reserva.id,
            {
              ticket_url: reserva.ticket_url,
              ticket_url_reserva: reserva.ticket_url_reserva
            }
          ])
        );

        const nextTicketUrlsPorPago: Record<string, string> = {};

        for (const pago of pagosConOrigen) {
          if (!pago.origen_id) continue;

          if (pago.origen_tipo === 'pedido') {
            const ticketUrl = pedidosConTicket.get(pago.origen_id);
            if (ticketUrl) {
              nextTicketUrlsPorPago[pago.id] = ticketUrl;
            }
            continue;
          }

          if (pago.origen_tipo === 'reserva') {
            const ticketsReserva = reservasConTicket.get(pago.origen_id);
            if (!ticketsReserva) continue;

            const conceptoNormalizado = pago.concepto.toLowerCase();
            const priorizaTicketReserva =
              conceptoNormalizado.includes('pendiente') ||
              conceptoNormalizado.includes('resto inscripción');

            const ticketUrl = priorizaTicketReserva
              ? ticketsReserva.ticket_url_reserva ?? ticketsReserva.ticket_url ?? ''
              : ticketsReserva.ticket_url ?? ticketsReserva.ticket_url_reserva ?? '';

            if (ticketUrl) {
              nextTicketUrlsPorPago[pago.id] = ticketUrl;
            }
          }
        }

        if (!isCancelled) {
          setTicketUrlsPorPago(nextTicketUrlsPorPago);
        }
      } catch (error) {
        console.error('Error cargando tickets asociados a pagos:', error);
        if (!isCancelled) {
          setTicketUrlsPorPago({});
        }
      }
    };

    void cargarTicketsPorPago();

    return () => {
      isCancelled = true;
    };
  }, [pagos, supabase]);

  const refreshReservaSeleccionada = async (reservaId: string) => {
    const resultado = await obtenerReservaPorId(reservaId);
    if (!resultado.success || !resultado.reserva) {
      throw new Error('No se pudo refrescar la reserva');
    }
    setReservaSeleccionada(resultado.reserva);
  };

  const handleActualizarEstadoReserva = async (reserva: ReservaActividad, nuevoEstado: string) => {
    const estadosValidos = ['confirmada', 'pendiente', 'completada', 'cancelada'] as const;
    if (!estadosValidos.includes(nuevoEstado as typeof estadosValidos[number])) {
      throw new Error('Estado de reserva no valido');
    }

    const resultado = await actualizarReserva(reserva.id, {
      estado: nuevoEstado as typeof estadosValidos[number]
    });

    if (!resultado.success) {
      throw new Error(resultado.message);
    }

    await refreshReservaSeleccionada(reserva.id);
    await refreshPagos();
  };

  const handleReservaActualizada = async () => {
    if (reservaSeleccionada) {
      await refreshReservaSeleccionada(reservaSeleccionada.id);
    }

    await refreshPagos();
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
          <FiltrosPagos
            onFiltrosChange={setFiltros}
            title="Listado de pagos"
            subtitle="Consulta y filtra los pagos registrados sin perder el contexto de la tabla."
          />
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
                            void handleVerPago(pago);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {ticketUrlsPorPago[pago.id] ? (
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                            title="Descargar ticket"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleAbrirTicketPago(pago);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        ) : null}
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
                      void handleVerPago(pago);
                    }}
                  >
                    Ver
                  </button>
                  {ticketUrlsPorPago[pago.id] ? (
                    <button
                      type="button"
                      className="min-h-11 flex-1 rounded-full border border-outline-variant/35 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-surface-container-low"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleAbrirTicketPago(pago);
                      }}
                    >
                      Descargar ticket
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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

      <ModalDetalleReserva
        isOpen={isDetalleReservaModalOpen}
        onClose={() => {
          setIsDetalleReservaModalOpen(false);
          setReservaSeleccionada(null);
        }}
        reserva={reservaSeleccionada}
        onActualizarEstado={handleActualizarEstadoReserva}
        onReservaActualizada={handleReservaActualizada}
      />

      <DetallePagoInscripcionCampamentoModal
        isOpen={isDetallePagoCampamentoModalOpen}
        onClose={() => {
          setIsDetallePagoCampamentoModalOpen(false);
          setPagoSeleccionado(null);
          setReservaSeleccionada(null);
          setProgramaCampamentoSeleccionado(null);
          setInscripcionCampamentoSeleccionada(null);
        }}
        pago={pagoSeleccionado}
        reserva={reservaSeleccionada}
        programa={programaCampamentoSeleccionado}
        inscripcion={inscripcionCampamentoSeleccionada}
        onCompletarPago={handleCompletarPago}
        onCancelarPago={handleCancelarPago}
      />
    </div>
  );
}
