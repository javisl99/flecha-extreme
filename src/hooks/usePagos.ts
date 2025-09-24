import { useState, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useProductos } from './useProductos';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface PagoData {
  id_cliente: string | null;
  items: CartItem[];
  subtotal: number;
  descuento: number;
  descuentoPorcentaje: number;
  iva: number;
  total: number;
  concepto: string;
  pago: {
    metodo: string;
    estado: string;
  };
}

interface PagoResult {
  success: boolean;
  message: string;
  data?: {
    pedidoId: string;
    pagoId: string;
  };
  error?: string;
}

export interface Pago {
  id: string;
  id_cliente: string | null;
  origen_tipo: 'reserva' | 'pedido' | 'parking';
  origen_id: string | null;
  concepto: string;
  importe: number;
  metodo: 'efectivo' | 'tpv' | 'tpv_online' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
  estado: 'completado' | 'pendiente' | 'cancelado';
  created_at: string;
  updated_at: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

export function usePagos() {
  const { supabase } = useSupabase();
  const { subtractStockFromMultipleProducts } = useProductos();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);

  // Cargar pagos al inicializar
  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pago')
        .select(`
          *,
          cliente:cliente(id, nombre, apellidos)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setPagos(data || []);
    } catch (err) {
      console.error('Error cargando pagos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const refreshPagos = async () => {
    await cargarPagos();
  };

  const actualizarPago = async (id: string, updates: Partial<Pago>) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('pago')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return { error: null };
    } catch (err) {
      console.error('Error actualizando pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar pago';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const eliminarPago = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('pago')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { error: null };
    } catch (err) {
      console.error('Error eliminando pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar pago';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const procesarPago = async (data: PagoData): Promise<PagoResult> => {
    if (!data.id_cliente) {
      return {
        success: false,
        message: 'Debe seleccionar un cliente',
        error: 'Cliente no seleccionado'
      };
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Crear el pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedido')
        .insert([{
          id_cliente: data.id_cliente,
          fecha: new Date().toISOString(),
          estado: 'pagado',
          descuento: data.descuentoPorcentaje,
          total: data.total,
          iva: data.iva
        }])
        .select()
        .single();

      if (pedidoError) {
        throw new Error(`Error al crear el pedido: ${pedidoError.message}`);
      }

      const pedidoId = pedidoData.id;

      // 2. Crear los items del pedido
      const pedidoItems = data.items.map(item => ({
        id_pedido: pedidoId,
        id_producto: item.id,
        cantidad: item.quantity,
        precio_item: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('pedido_item')
        .insert(pedidoItems);

      if (itemsError) {
        // Si hay error en los items, eliminar el pedido creado
        await supabase
          .from('pedido')
          .delete()
          .eq('id', pedidoId);
        
        throw new Error(`Error al crear los items del pedido: ${itemsError.message}`);
      }

      // 3. Restar stock de los productos
      const stockItems = data.items.map(item => ({
        id: item.id,
        quantity: item.quantity
      }));

      const stockResult = await subtractStockFromMultipleProducts(stockItems);
      
      if (!stockResult.success) {
        // Si hay error al restar stock, eliminar el pedido y sus items
        await supabase
          .from('pedido_item')
          .delete()
          .eq('id_pedido', pedidoId);
        
        await supabase
          .from('pedido')
          .delete()
          .eq('id', pedidoId);
        
        throw new Error(`Error al restar stock: ${stockResult.error}`);
      }

      // 4. Crear el registro de pago
      const { data: pagoData, error: pagoError } = await supabase
        .from('pago')
        .insert([{
          id_cliente: data.id_cliente,
          origen_tipo: 'pedido',
          origen_id: pedidoId,
          concepto: data.concepto,
          importe: data.total,
          metodo: data.pago.metodo,
          estado: 'completado'
        }])
        .select()
        .single();

      if (pagoError) {
        // Si hay error en el pago, intentar revertir el stock (esto es complejo, por ahora solo mostramos el error)
        console.error('Error al crear el registro de pago después de restar stock:', pagoError);
        
        // Eliminar el pedido y sus items
        await supabase
          .from('pedido_item')
          .delete()
          .eq('id_pedido', pedidoId);
        
        await supabase
          .from('pedido')
          .delete()
          .eq('id', pedidoId);
        
        throw new Error(`Error al crear el registro de pago: ${pagoError.message}. Nota: El stock ya fue restado.`);
      }

      return {
        success: true,
        message: 'Pago procesado exitosamente y stock actualizado',
        data: {
          pedidoId: pedidoId,
          pagoId: pagoData.id
        }
      };

    } catch (err) {
      console.error('Error procesando pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el pago';
      setError(errorMessage);
      
      return {
        success: false,
        message: 'Error al procesar el pago',
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    pagos,
    loading,
    error,
    procesarPago,
    refreshPagos,
    actualizarPago,
    eliminarPago
  };
}