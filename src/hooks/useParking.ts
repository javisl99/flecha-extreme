import { useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';

type TipoParking = 'embarcacion' | 'tabla' | 'kayak';

interface PlazaParking {
  id: string;
  codigo: string;
  tipo: TipoParking;
  disponible?: boolean;
  cliente_id?: string | null;
  updated_at?: string;
}

export function useParking() {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plazas, setPlazas] = useState<PlazaParking[]>([]);

  const ordenarPlazas = (plazas: PlazaParking[]) => {
    return plazas.sort((a, b) => {
      // Extraer el prefijo (e-, t-, k-) y el número
      const [prefijoA, numeroA] = a.codigo.split('-');
      const [prefijoB, numeroB] = b.codigo.split('-');

      // Si los prefijos son diferentes, ordenar por prefijo
      if (prefijoA !== prefijoB) {
        return prefijoA.localeCompare(prefijoB);
      }

      // Si los prefijos son iguales, ordenar por número
      return parseInt(numeroA) - parseInt(numeroB);
    });
  };

  const fetchPlazasParking = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabaseClient
        .from('plaza_parking')
        .select('*');

      if (supabaseError) {
        throw supabaseError;
      }

      // Asegurarnos de que todas las plazas tengan la propiedad disponible
      const plazasConDisponibilidad = (data || []).map(plaza => ({
        ...plaza,
        disponible: plaza.disponible === undefined ? true : plaza.disponible
      }));

      // Ordenar las plazas antes de guardarlas en el estado
      const plazasOrdenadas = ordenarPlazas(plazasConDisponibilidad);
      setPlazas(plazasOrdenadas);
    } catch (err) {
      console.error('Error al obtener las plazas de parking:', err);
      setError('Error al cargar las plazas de parking');
    } finally {
      setLoading(false);
    }
  };

  const getPlazasByTipo = (tipo: TipoParking) => {
    return plazas.filter(plaza => plaza.tipo === tipo);
  };

  const getPlazasDisponibles = async (tipo: TipoParking) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabaseClient
        .from('plaza_parking')
        .select('*')
        .eq('tipo', tipo)
        .eq('disponible', true);

      if (supabaseError) {
        throw supabaseError;
      }

      return data || [];
    } catch (err) {
      console.error('Error al obtener las plazas disponibles:', err);
      setError('Error al cargar las plazas disponibles');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const asignarPlaza = async (plazaId: string, clienteId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabaseClient
        .from('plaza_parking')
        .update({ 
          disponible: false,
          cliente_id: clienteId,
          updated_at: new Date().toISOString()
        })
        .eq('id', plazaId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Actualizar la lista de plazas
      await fetchPlazasParking();
      
      return true;
    } catch (err) {
      console.error('Error al asignar la plaza:', err);
      setError('Error al asignar la plaza de parking');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const liberarPlaza = async (plazaId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabaseClient
        .from('plaza_parking')
        .update({ 
          disponible: true,
          cliente_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', plazaId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Actualizar la lista de plazas
      await fetchPlazasParking();
      
      return true;
    } catch (err) {
      console.error('Error al liberar la plaza:', err);
      setError('Error al liberar la plaza de parking');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    plazas,
    loading,
    error,
    fetchPlazasParking,
    getPlazasByTipo,
    getPlazasDisponibles,
    asignarPlaza,
    liberarPlaza
  };
} 