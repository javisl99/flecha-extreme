import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useTickets } from './useTickets';

export interface PedidoItem {
  id: string;
  id_pedido: string;
  id_producto: string;
  cantidad: number;
  precio_item: number;
  producto?: {
    id: string;
    nombre: string;
    precio: number;
    url_foto?: string;
    stock: number;
  };
}

export interface Pedido {
  id: string;
  id_cliente: string | null;
  fecha: string;
  estado: string;
  descuento: number;
  total: number;
  iva: number;
  concepto?: string;
  ticket_url?: string;
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  items?: PedidoItem[];
}

export function usePedidos() {
  const { supabase } = useSupabase();
  const { deleteTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const cargarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pedido')
        .select(`
          *,
          cliente:cliente(id, nombre, apellidos),
          items:pedido_item(
            *,
            producto:producto(id, nombre, precio, url_foto)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Obtener conceptos de pagos para cada pedido
      const pedidosConConceptos = await Promise.all(
        (data || []).map(async (pedido) => {
          const { data: pagoData } = await supabase
            .from('pago')
            .select('concepto')
            .eq('origen_id', pedido.id)
            .eq('origen_tipo', 'pedido')
            .single();
          
          return {
            ...pedido,
            concepto: pagoData?.concepto || ''
          };
        })
      );

      setPedidos(pedidosConConceptos);
    } catch (err) {
      console.error('Error cargando pedidos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Cargar pedidos al inicializar
  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const obtenerPedidoPorId = async (pedidoId: string): Promise<Pedido | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pedido')
        .select(`
          *,
          cliente:cliente(id, nombre, apellidos),
          items:pedido_item(
            *,
            producto:producto(id, nombre, precio, url_foto)
          )
        `)
        .eq('id', pedidoId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return data;
    } catch (err) {
      console.error('Error obteniendo pedido:', err);
      setError(err instanceof Error ? err.message : 'Error al obtener pedido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshPedidos = async () => {
    await cargarPedidos();
  };

  const eliminarPedido = async (pedidoId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // 0. PRIMERO: Obtener el pedido para verificar si tiene ticket_url
      const pedidoAEliminar = pedidos.find(p => p.id === pedidoId);
      
      // 1. SEGUNDO: Si el pedido tiene un ticket_url, eliminar el ticket del bucket PRIMERO
      if (pedidoAEliminar?.ticket_url) {
        const ticketEliminado = await deleteTicket(pedidoAEliminar.ticket_url);
        if (!ticketEliminado) {
          console.warn('No se pudo eliminar el ticket del bucket, pero continuando con la eliminación del pedido');
        }
      }
      
      // 2. TERCERO: Eliminar las filas de 'pedido_item' que referencien al pedido
      const { error: itemsError } = await supabase
        .from('pedido_item')
        .delete()
        .eq('id_pedido', pedidoId);

      if (itemsError) {
        throw new Error(`Error eliminando items del pedido: ${itemsError.message}`);
      }

      // 3. CUARTO: Eliminar la fila en la tabla 'pago' que referencia al pedido en 'origen_id'
      const { error: pagoError } = await supabase
        .from('pago')
        .delete()
        .eq('origen_id', pedidoId)
        .eq('origen_tipo', 'pedido');

      if (pagoError) {
        throw new Error(`Error eliminando pago asociado: ${pagoError.message}`);
      }

      // 4. QUINTO: Borrar el pedido de la tabla 'pedido'
      const { error: pedidoError } = await supabase
        .from('pedido')
        .delete()
        .eq('id', pedidoId);

      if (pedidoError) {
        throw new Error(`Error eliminando pedido: ${pedidoError.message}`);
      }

      // Actualizar la lista local
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
      
      return true;
    } catch (err) {
      console.error('Error eliminando pedido:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar pedido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    pedidos,
    obtenerPedidoPorId,
    eliminarPedido,
    loading,
    error,
    refreshPedidos
  };
}
