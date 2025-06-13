import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';

export interface Pago {
  id: string;
  id_cliente: string;
  origen_tipo: 'parking' | 'reserva' | 'pedido';
  concepto: string;
  importe: number;
  metodo: 'efectivo' | 'tpv' | 'tpv_online' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
  estado: 'completado' | 'pendiente' | 'cancelado';
  created_at?: string;
  updated_at?: string;
  cliente?: {
    nombre: string;
    apellidos: string;
  };
}

export function usePagos() {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para refrescar los pagos
  const refreshPagos = useCallback(async () => {
    if (!user || !usuario) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('pago')
        .select(`
          *,
          cliente:id_cliente (
            nombre,
            apellidos
          )
        `)
        .throwOnError();

      if (error) throw error;

      setPagos(data || []);
    } catch (err) {
      console.error('Error al refrescar pagos:', err);
      setError('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, [user, usuario]);

  // Cargar pagos inicialmente
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPagos = async () => {
      if (!user || !usuario) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Añadir un pequeño retraso para evitar problemas de conexión
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 100);
        });

        const { data, error } = await supabaseClient
          .from('pago')
          .select(`
            *,
            cliente:id_cliente (
              nombre,
              apellidos
            )
          `)
          .throwOnError();

        if (error) throw error;

        if (isMounted) {
          setPagos(data || []);
        }
      } catch (err) {
        console.error('Error al obtener pagos:', err);
        if (isMounted) {
          setError('Error al cargar los pagos');
          setPagos([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPagos();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, usuario]);

  const eliminarPago = async (id: string) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabaseClient
        .from('pago')
        .delete()
        .eq('id', id)
        .throwOnError();

      if (error) throw error;

      // Actualizar la lista de pagos localmente
      setPagos(prevPagos => prevPagos.filter(pago => pago.id !== id));
      
      return { error: null };
    } catch (err) {
      console.error('Error al eliminar el pago:', err);
      setError('Error al eliminar el pago');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const actualizarPago = async (id: string, datosActualizados: Partial<Pago>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('pago')
        .update({
          ...datosActualizados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          cliente:id_cliente (
            nombre,
            apellidos
          )
        `)
        .single()
        .throwOnError();

      if (error) throw error;

      // Actualizar la lista de pagos localmente
      setPagos(prevPagos => 
        prevPagos.map(pago => 
          pago.id === id ? data : pago
        )
      );
      
      return { data, error: null };
    } catch (err) {
      console.error('Error al actualizar el pago:', err);
      setError('Error al actualizar el pago');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    pagos,
    loading,
    error,
    eliminarPago,
    actualizarPago,
    refreshPagos
  };
} 