import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';

export interface NuevaActividad {
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
  numeroPersonas?: number;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  reserva?: boolean;
  precio_reserva?: number;
}

export interface ActividadDB {
  id: string;
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
  numero_personas: number | null;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  reserva: boolean;
  precio_reserva: number | null;
  created_at: string;
  updated_at: string;
}

export interface TarifaActividad {
  id_actividad: string;
  duracion_valor: number;
  duracion_unidad: string;
  precio: number;
  descuento: number | null;
}

export function useActividades() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearActividad = async (actividad: NuevaActividad): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Preparar los datos para la inserción
      const datosActividad = {
        nombre: actividad.nombre,
        tipo: actividad.tipo,
        numero_personas: actividad.numeroPersonas || null,
        fecha: actividad.fecha || null,
        hora_inicio: actividad.horaInicio || null,
        hora_fin: actividad.horaFin || null,
        reserva: actividad.reserva,
        precio_reserva: actividad.reserva && actividad.precio_reserva ? actividad.precio_reserva : null
      };

      const { data, error: insertError } = await supabase
        .from('actividad')
        .insert([datosActividad])
        .select();

      if (insertError) {
        return {
          success: false,
          message: `Error al crear la actividad: ${insertError.message}`
        };
      }

      if (data && data.length > 0) {
        return {
          success: true,
          message: 'Actividad creada correctamente'
        };
      } else {
        return {
          success: false,
          message: 'No se pudo crear la actividad'
        };
      }

    } catch (err) {
      return {
        success: false,
        message: 'Error inesperado al crear la actividad'
      };
    } finally {
      setLoading(false);
    }
  };

  const obtenerActividades = async (): Promise<ActividadDB[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('actividad')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return data || [];

    } catch (err) {
      setError('Error inesperado al obtener actividades');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const obtenerActividadesPorTipo = useCallback(async (tipo: string): Promise<ActividadDB[]> => {
    try {
      setLoadingActividades(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('actividad')
        .select('*')
        .eq('tipo', tipo.toLowerCase())
        .order('nombre', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return data || [];

    } catch (err) {
      setError('Error inesperado al obtener actividades por tipo');
      return [];
    } finally {
      setLoadingActividades(false);
    }
  }, [supabase]);

  const obtenerTarifasActividad = useCallback(async (idActividad: string): Promise<TarifaActividad[]> => {
    try {
      setLoadingActividades(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tarifa_actividad')
        .select('*')
        .eq('id_actividad', idActividad)
        .order('duracion_valor', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return data || [];

    } catch (err) {
      setError('Error inesperado al obtener tarifas de la actividad');
      return [];
    } finally {
      setLoadingActividades(false);
    }
  }, [supabase]);

  const actualizarActividad = async (id: string, actividad: Partial<NuevaActividad>): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const datosActualizacion = {
        nombre: actividad.nombre,
        tipo: actividad.tipo,
        numero_personas: actividad.numeroPersonas || null,
        fecha: actividad.fecha || null,
        hora_inicio: actividad.horaInicio || null,
        hora_fin: actividad.horaFin || null,
        reserva: actividad.reserva,
        precio_reserva: actividad.reserva && actividad.precio_reserva ? actividad.precio_reserva : null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('actividad')
        .update(datosActualizacion)
        .eq('id', id);

      if (updateError) {
        return {
          success: false,
          message: `Error al actualizar la actividad: ${updateError.message}`
        };
      }

      return {
        success: true,
        message: 'Actividad actualizada correctamente'
      };

    } catch (err) {
      return {
        success: false,
        message: 'Error inesperado al actualizar la actividad'
      };
    } finally {
      setLoading(false);
    }
  };

  const eliminarActividad = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('actividad')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return {
          success: false,
          message: `Error al eliminar la actividad: ${deleteError.message}`
        };
      }

      return {
        success: true,
        message: 'Actividad eliminada correctamente'
      };

    } catch (err) {
      return {
        success: false,
        message: 'Error inesperado al eliminar la actividad'
      };
    } finally {
      setLoading(false);
    }
  };

  const crearReserva = async (datosReserva: {
    id_cliente: string | null;
    id_actividad: string;
    id_empresa: string;
    cantidad_reservada: number;
    precio: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
    nota?: string;
  }): Promise<{ success: boolean; message: string; reservaId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reserva')
        .insert([datosReserva])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        message: 'Reserva creada correctamente',
        reservaId: data.id
      };
    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      setError(error.message || 'Error al crear la reserva');
      return { success: false, message: error.message || 'Error al crear la reserva' };
    } finally {
      setLoading(false);
    }
  };

  const crearPago = async (datosPago: {
    id_cliente: string | null;
    origen_tipo: 'reserva';
    origen_id: string;
    concepto: string;
    importe: number;
    metodo: 'efectivo' | 'tpv' | 'tpv_online' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
    estado: 'completado' | 'pendiente' | 'cancelado';
  }): Promise<{ success: boolean; message: string; pagoId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('pago')
        .insert([datosPago])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        message: 'Pago creado correctamente',
        pagoId: data.id
      };
    } catch (error: any) {
      console.error('Error al crear pago:', error);
      setError(error.message || 'Error al crear el pago');
      return { success: false, message: error.message || 'Error al crear el pago' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerIdEmpresa = async (nombreEmpresa: string): Promise<{ success: boolean; empresaId?: string; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('empresa')
        .select('id')
        .eq('nombre', nombreEmpresa)
        .single();

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        empresaId: data.id,
        message: 'ID de empresa obtenido correctamente'
      };
    } catch (error: any) {
      console.error('Error al obtener ID de empresa:', error);
      setError(error.message || 'Error al obtener ID de empresa');
      return { success: false, message: error.message || 'Error al obtener ID de empresa' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerIdCliente = async (nombreCliente: string, apellidosCliente: string): Promise<{ success: boolean; clienteId?: string; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cliente')
        .select('id')
        .eq('nombre', nombreCliente)
        .eq('apellidos', apellidosCliente)
        .single();

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        clienteId: data.id,
        message: 'ID de cliente obtenido correctamente'
      };
    } catch (error: any) {
      console.error('Error al obtener ID de cliente:', error);
      setError(error.message || 'Error al obtener ID de cliente');
      return { success: false, message: error.message || 'Error al obtener ID de cliente' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerReservas = async (): Promise<{ success: boolean; reservas?: any[]; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reserva')
        .select(`
          *,
          cliente:cliente(id, nombre, apellidos, movil),
          actividad:actividad(id, nombre, tipo),
          empresa:empresa(id, nombre)
        `)
        .order('fecha_inicio', { ascending: false });

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        reservas: data || [],
        message: 'Reservas obtenidas correctamente'
      };
    } catch (error: any) {
      console.error('Error al obtener reservas:', error);
      setError(error.message || 'Error al obtener reservas');
      return { success: false, message: error.message || 'Error al obtener reservas' };
    } finally {
      setLoading(false);
    }
  };

  const actualizarReserva = async (id: string, datosReserva: {
    estado?: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
    nota?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reserva')
        .update(datosReserva)
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        message: 'Reserva actualizada correctamente'
      };
    } catch (error: any) {
      console.error('Error al actualizar reserva:', error);
      setError(error.message || 'Error al actualizar reserva');
      return { success: false, message: error.message || 'Error al actualizar reserva' };
    } finally {
      setLoading(false);
    }
  };

  const eliminarReserva = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reserva')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        message: 'Reserva eliminada correctamente'
      };
    } catch (error: any) {
      console.error('Error al eliminar reserva:', error);
      setError(error.message || 'Error al eliminar reserva');
      return { success: false, message: error.message || 'Error al eliminar reserva' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingActividades,
    error,
    crearActividad,
    obtenerActividades,
    obtenerActividadesPorTipo,
    obtenerTarifasActividad,
    actualizarActividad,
    eliminarActividad,
    crearReserva,
    crearPago,
    obtenerIdEmpresa,
    obtenerIdCliente,
    obtenerReservas,
    actualizarReserva,
    eliminarReserva
  };
}
