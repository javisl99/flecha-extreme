import { useState } from 'react';
import { useSupabase } from './useSupabase';

export interface NuevaActividad {
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento';
  reserva: boolean;
  precio_reserva?: number;
}

export interface ActividadDB {
  id: string;
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento';
  reserva: boolean;
  precio_reserva: number | null;
  created_at: string;
  updated_at: string;
}

export function useActividades() {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearActividad = async (actividad: NuevaActividad): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Preparar los datos para la inserción
      const datosActividad = {
        nombre: actividad.nombre,
        tipo: actividad.tipo,
        reserva: actividad.reserva,
        precio_reserva: actividad.reserva && actividad.precio_reserva ? actividad.precio_reserva : null
      };

      const { data, error: insertError } = await supabase
        .from('actividad')
        .insert([datosActividad])
        .select();

      if (insertError) {
        console.error('Error al crear actividad:', insertError);
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
      console.error('Error inesperado al crear actividad:', err);
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
        console.error('Error al obtener actividades:', fetchError);
        setError(fetchError.message);
        return [];
      }

      return data || [];

    } catch (err) {
      console.error('Error inesperado al obtener actividades:', err);
      setError('Error inesperado al obtener actividades');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const actualizarActividad = async (id: string, actividad: Partial<NuevaActividad>): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const datosActualizacion = {
        nombre: actividad.nombre,
        tipo: actividad.tipo,
        reserva: actividad.reserva,
        precio_reserva: actividad.reserva && actividad.precio_reserva ? actividad.precio_reserva : null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('actividad')
        .update(datosActualizacion)
        .eq('id', id);

      if (updateError) {
        console.error('Error al actualizar actividad:', updateError);
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
      console.error('Error inesperado al actualizar actividad:', err);
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
        console.error('Error al eliminar actividad:', deleteError);
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
      console.error('Error inesperado al eliminar actividad:', err);
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
    error,
    crearActividad,
    obtenerActividades,
    actualizarActividad,
    eliminarActividad
  };
}
