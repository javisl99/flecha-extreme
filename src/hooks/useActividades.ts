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

    } catch {
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

    } catch {
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

    } catch {
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

    } catch {
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

    } catch {
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

    } catch {
      return {
        success: false,
        message: 'Error inesperado al eliminar la actividad'
      };
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
    eliminarActividad
  };
}
