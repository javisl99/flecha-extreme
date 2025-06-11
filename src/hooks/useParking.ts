import { useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';

type TipoParking = 'embarcacion' | 'tabla' | 'kayak';
type MetodoPago = 'efectivo' | 'tpv' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles';
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';

interface PlazaParking {
  id: string;
  codigo: string;
  tipo: TipoParking;
  disponible?: boolean;
  cliente_id?: string | null;
  updated_at?: string;
  reservada?: boolean;
}

interface ReservaParking {
  id: string;
  id_cliente: string;
  id_plaza: string;
  id_tarifa: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface TarifaParking {
  id: string;
  tipo: 'embarcacion' | 'tabla' | 'kayak';
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface PagoParking {
  id_cliente: string | null;
  origen_tipo: 'parking';
  origen_id: string;
  concepto: string;
  importe: number;
  metodo: MetodoPago;
  estado: EstadoPago;
}

export function useParking() {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plazas, setPlazas] = useState<PlazaParking[]>([]);
  const [reservas, setReservas] = useState<ReservaParking[]>([]);
  const [tarifas, setTarifas] = useState<TarifaParking[]>([]);

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

  const fetchReservasParking = async () => {
    try {
      const { data: reservasData, error: reservasError } = await supabaseClient
        .from('reserva_parking')
        .select('*');

      if (reservasError) {
        throw reservasError;
      }

      setReservas(reservasData || []);
      return reservasData;
    } catch (err) {
      console.error('Error al obtener las reservas de parking:', err);
      setError('Error al cargar las reservas de parking');
      return [];
    }
  };

  const fetchPlazasParking = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener las plazas y las reservas
      const [plazasData, reservasData] = await Promise.all([
        supabaseClient.from('plaza_parking').select('*'),
        fetchReservasParking()
      ]);

      if (plazasData.error) {
        throw plazasData.error;
      }

      // Verificar qué plazas están reservadas actualmente
      const plazasConReservas = (plazasData.data || []).map(plaza => {
        const reservaActual = reservasData.find(reserva => {
          const ahora = new Date().toISOString();
          const estaReservada = reserva.id_plaza === plaza.id && 
                               reserva.fecha_fin >= ahora;
          
          return estaReservada;
        });

        return {
          ...plaza,
          disponible: plaza.disponible === undefined ? true : plaza.disponible,
          reservada: !!reservaActual
        };
      });

      // Ordenar las plazas antes de guardarlas en el estado
      const plazasOrdenadas = ordenarPlazas(plazasConReservas);
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

  const getReservaActual = (plazaId: string): ReservaParking | undefined => {
    const ahora = new Date().toISOString();
    const reserva = reservas.find(reserva => 
      reserva.id_plaza === plazaId &&
      reserva.fecha_fin >= ahora
    );
    
    if (reserva) {
      return {
        id: reserva.id,
        id_cliente: reserva.id_cliente,
        id_plaza: reserva.id_plaza,
        id_tarifa: reserva.id_tarifa,
        fecha_inicio: reserva.fecha_inicio,
        fecha_fin: reserva.fecha_fin
      };
    }
    return undefined;
  };

  const fetchTarifas = async (tipo: string) => {
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('tarifa_parking')
        .select('*')
        .eq('tipo', tipo);

      if (supabaseError) {
        throw supabaseError;
      }

      setTarifas(data || []);
      return data;
    } catch (err) {
      console.error('Error al obtener las tarifas:', err);
      return [];
    }
  };

  const crearReserva = async (plazaId: string, data: {
    fecha_inicio: string;
    fecha_fin: string;
    id_tarifa: string;
    pago?: {
      concepto: string;
      metodo: MetodoPago;
      estado: EstadoPago;
    };
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Insertar la reserva
      const { data: reservaData, error: reservaError } = await supabaseClient
        .from('reserva_parking')
        .insert([{
          id_plaza: plazaId,
          id_cliente: null, // Por ahora siempre será null
          id_tarifa: data.id_tarifa,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin
        }])
        .select()
        .single();

      if (reservaError) {
        throw reservaError;
      }

      // Si hay datos de pago, crear el pago asociado
      if (data.pago) {
        const tarifa = tarifas.find(t => t.id === data.id_tarifa);
        if (!tarifa) {
          throw new Error('No se encontró la tarifa seleccionada');
        }

        const { error: pagoError } = await supabaseClient
          .from('pago')
          .insert([{
            id_cliente: null,
            origen_tipo: 'parking',
            origen_id: reservaData.id,
            concepto: data.pago.concepto,
            importe: tarifa.precio,
            metodo: data.pago.metodo,
            estado: data.pago.estado
          }]);

        if (pagoError) {
          throw pagoError;
        }
      }

      // Actualizar la lista de plazas y reservas
      await fetchPlazasParking();
      return true;
    } catch (err) {
      console.error('Error al crear la reserva:', err);
      setError('Error al crear la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const eliminarReserva = async (plazaId: string) => {
    try {
      setLoading(true);
      setError(null);

      const reservaActual = getReservaActual(plazaId);
      if (!reservaActual) {
        throw new Error('No se encontró la reserva actual');
      }

      const { error: supabaseError } = await supabaseClient
        .from('reserva_parking')
        .delete()
        .eq('id_plaza', plazaId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Actualizar la lista de plazas y reservas
      await fetchPlazasParking();
      return true;
    } catch (err) {
      console.error('Error al eliminar la reserva:', err);
      setError('Error al eliminar la reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPagoReserva = async (reservaId: string) => {
    try {
      const { data, error: supabaseError } = await supabaseClient
        .from('pago')
        .select('*')
        .eq('origen_tipo', 'parking')
        .eq('origen_id', reservaId)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      console.error('Error al obtener el pago de la reserva:', err);
      return null;
    }
  };

  return {
    plazas,
    reservas,
    tarifas,
    loading,
    error,
    fetchPlazasParking,
    fetchTarifas,
    getPlazasByTipo,
    getPlazasDisponibles,
    asignarPlaza,
    liberarPlaza,
    getReservaActual,
    crearReserva,
    eliminarReserva,
    getPagoReserva
  };
} 