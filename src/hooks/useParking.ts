import { useState, useCallback } from 'react';
import supabaseClient from '@/lib/supabaseClient';
import { resolvePaymentMethodIdByCode } from '@/lib/contabilidadCatalogos';

type TipoParking = 'embarcacion' | 'tabla' | 'kayak';
type MetodoPago =
  | 'efectivo'
  | 'tpv'
  | 'transferencia'
  | 'bizum_alfonso'
type EstadoPago = 'completado' | 'pendiente' | 'cancelado';
type EstadoReservaParking = 'pendiente' | 'activa' | 'cancelada' | 'finalizada';

interface PlazaParking {
  id: string;
  codigo: string;
  tipo: TipoParking;
  disponible?: boolean;
  cliente_id?: string | null;
  updated_at?: string;
  reservada?: boolean;
  activo?: boolean;
}

interface ReservaParking {
  id: string;
  id_cliente: string;
  id_plaza: string;
  id_tarifa: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoReservaParking;
}

interface TarifaParking {
  id: string;
  tipo: TipoParking;
  periodo: 'mes' | 'quincena';
  precio: number;
}

interface PagoParking {
  id: string;
  id_cliente: string | null;
  origen_tipo: 'parking';
  origen_id: string;
  concepto: string;
  importe: number;
  metodo: MetodoPago;
  estado: EstadoPago;
}

function toDateOnly(value: string): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function reservaSigueActiva(fechaFin: string, estado: EstadoReservaParking): boolean {
  if (!['pendiente', 'activa'].includes(estado)) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return fechaFin > hoy;
}

export function useParking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plazas, setPlazas] = useState<PlazaParking[]>([]);
  const [reservas, setReservas] = useState<ReservaParking[]>([]);
  const [tarifas, setTarifas] = useState<TarifaParking[]>([]);

  const ordenarPlazas = (inputPlazas: PlazaParking[]) => {
    return [...inputPlazas].sort((a, b) => {
      const [prefijoA = '', numeroA = '0'] = a.codigo.split('-');
      const [prefijoB = '', numeroB = '0'] = b.codigo.split('-');

      if (prefijoA !== prefijoB) {
        return prefijoA.localeCompare(prefijoB);
      }

      return Number.parseInt(numeroA, 10) - Number.parseInt(numeroB, 10);
    });
  };

  const getEmpresaIdFromPlaza = useCallback(async (plazaId: string): Promise<string | null> => {
    const { data, error: plazaError } = await supabaseClient
      .from('parking_plaza')
      .select('empresa_id')
      .eq('id', plazaId)
      .single();

    if (plazaError || !data?.empresa_id) {
      return null;
    }

    return data.empresa_id;
  }, []);

  const fetchReservasParking = useCallback(async () => {
    try {
      const { data: reservasData, error: reservasError } = await supabaseClient
        .from('parking_reserva')
        .select('id,plaza_id,cliente_id,tarifa_id,fecha_inicio,fecha_fin,estado')
        .order('created_at', { ascending: false });

      if (reservasError) {
        throw reservasError;
      }

      const mappedReservas: ReservaParking[] = (reservasData ?? []).map((reserva) => ({
        id: reserva.id,
        id_cliente: reserva.cliente_id ?? '',
        id_plaza: reserva.plaza_id,
        id_tarifa: reserva.tarifa_id,
        fecha_inicio: reserva.fecha_inicio,
        fecha_fin: reserva.fecha_fin,
        estado: reserva.estado
      }));

      setReservas(mappedReservas);
      return mappedReservas;
    } catch (err) {
      console.error('Error al obtener las reservas de parking:', err);
      setError('Error al cargar las reservas de parking');
      return [];
    }
  }, []);

  const fetchPlazasParking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [plazasResult, reservasData] = await Promise.all([
        supabaseClient.from('parking_plaza').select('id,codigo,tipo,activo,updated_at'),
        fetchReservasParking()
      ]);

      if (plazasResult.error) {
        throw plazasResult.error;
      }

      const plazasConEstado = (plazasResult.data ?? []).map((plaza) => {
        const reservaActual = reservasData.find((reserva) => {
          return reserva.id_plaza === plaza.id && reservaSigueActiva(reserva.fecha_fin, reserva.estado);
        });

        const reservada = Boolean(reservaActual);
        const disponible = Boolean(plaza.activo) && !reservada;

        return {
          id: plaza.id,
          codigo: plaza.codigo,
          tipo: plaza.tipo,
          activo: plaza.activo,
          updated_at: plaza.updated_at,
          cliente_id: reservaActual?.id_cliente ?? null,
          reservada,
          disponible
        } satisfies PlazaParking;
      });

      setPlazas(ordenarPlazas(plazasConEstado));
    } catch (err) {
      console.error('Error al obtener las plazas de parking:', err);
      setError('Error al cargar las plazas de parking');
    } finally {
      setLoading(false);
    }
  }, [fetchReservasParking]);

  const getPlazasByTipo = (tipo: TipoParking) => {
    return plazas.filter((plaza) => plaza.tipo === tipo);
  };

  const getPlazasDisponibles = async (tipo: TipoParking) => {
    try {
      setLoading(true);
      setError(null);

      const [plazasResult, reservasData] = await Promise.all([
        supabaseClient
          .from('parking_plaza')
          .select('id,codigo,tipo,activo,updated_at')
          .eq('tipo', tipo)
          .eq('activo', true),
        fetchReservasParking()
      ]);

      if (plazasResult.error) {
        throw plazasResult.error;
      }

      return (plazasResult.data ?? [])
        .map((plaza) => {
          const reservada = reservasData.some((reserva) => {
            return reserva.id_plaza === plaza.id && reservaSigueActiva(reserva.fecha_fin, reserva.estado);
          });

          return {
            id: plaza.id,
            codigo: plaza.codigo,
            tipo: plaza.tipo,
            disponible: !reservada,
            reservada
          } satisfies PlazaParking;
        })
        .filter((plaza) => plaza.disponible);
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

      const { data: plazaData, error: plazaError } = await supabaseClient
        .from('parking_plaza')
        .select('id,tipo')
        .eq('id', plazaId)
        .single();

      if (plazaError || !plazaData?.tipo) {
        throw plazaError ?? new Error('No se pudo obtener la plaza');
      }

      const tarifasDisponibles = await fetchTarifas(plazaData.tipo);
      const tarifaMensual = tarifasDisponibles.find((tarifa) => tarifa.periodo === 'mes') ?? tarifasDisponibles[0];

      if (!tarifaMensual) {
        throw new Error('No hay tarifa activa para asignar la plaza');
      }

      const created = await crearReserva(plazaId, {
        fecha_inicio: new Date().toISOString().slice(0, 10),
        fecha_fin: '',
        id_tarifa: tarifaMensual.id,
        id_cliente: clienteId
      });

      return created;
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

      const reservaActual = getReservaActual(plazaId);
      if (!reservaActual) {
        throw new Error('No hay reserva activa para liberar');
      }

      const { error: updateError } = await supabaseClient
        .from('parking_reserva')
        .update({ estado: 'cancelada' })
        .eq('id', reservaActual.id);

      if (updateError) {
        throw updateError;
      }

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

  const getReservaActual = useCallback(
    (plazaId: string): ReservaParking | undefined => {
      return reservas.find((reserva) => {
        return reserva.id_plaza === plazaId && reservaSigueActiva(reserva.fecha_fin, reserva.estado);
      });
    },
    [reservas]
  );

  const fetchTarifas = useCallback(async (tipo: string) => {
    try {
      const { data, error: tarifasError } = await supabaseClient
        .from('parking_tarifa')
        .select('id,tipo,periodo,precio,vigencia_desde,activo')
        .eq('tipo', tipo)
        .eq('activo', true)
        .order('vigencia_desde', { ascending: false });

      if (tarifasError) {
        throw tarifasError;
      }

      const dedupByPeriodo = new Map<'mes' | 'quincena', TarifaParking>();
      for (const tarifa of data ?? []) {
        if (!dedupByPeriodo.has(tarifa.periodo)) {
          dedupByPeriodo.set(tarifa.periodo, {
            id: tarifa.id,
            tipo: tarifa.tipo,
            periodo: tarifa.periodo,
            precio: Number(tarifa.precio ?? 0)
          });
        }
      }

      const mappedTarifas = Array.from(dedupByPeriodo.values());
      setTarifas(mappedTarifas);
      return mappedTarifas;
    } catch (err) {
      console.error('Error al obtener las tarifas:', err);
      setError('Error al cargar las tarifas de parking');
      return [];
    }
  }, []);

  const crearReserva = async (
    plazaId: string,
    data: {
      fecha_inicio: string;
      fecha_fin: string;
      id_tarifa: string;
      id_cliente: string | null;
      pago?: {
        concepto: string;
        metodo: MetodoPago;
        estado: EstadoPago;
      };
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const empresaId = await getEmpresaIdFromPlaza(plazaId);
      if (!empresaId) {
        throw new Error('No se pudo determinar la empresa de la plaza');
      }

      const fechaInicio = toDateOnly(data.fecha_inicio);
      if (!fechaInicio) {
        throw new Error('Fecha de inicio inválida');
      }

      const estadoReserva: EstadoReservaParking = data.pago?.estado === 'completado' ? 'activa' : 'pendiente';

      const { data: reservaId, error: reservaError } = await supabaseClient.rpc('rpc_crear_reserva_parking', {
        p_empresa_id: empresaId,
        p_plaza_id: plazaId,
        p_cliente_id: data.id_cliente,
        p_tarifa_id: data.id_tarifa,
        p_fecha_inicio: fechaInicio,
        p_estado: estadoReserva,
        p_notas: null
      });

      if (reservaError || !reservaId) {
        throw reservaError ?? new Error('No se pudo crear la reserva de parking');
      }

      if (data.pago) {
        const tarifaSeleccionada = tarifas.find((tarifa) => tarifa.id === data.id_tarifa);
        const importePago = Number(tarifaSeleccionada?.precio ?? 0);

        if (importePago <= 0) {
          throw new Error('No se encontró importe válido para la tarifa seleccionada');
        }

        const concepto = data.pago.concepto?.trim() || `Reserva parking ${plazaId}`;

        const { data: pagoData, error: pagoError } = await supabaseClient
          .from('pago')
          .insert([
            {
              id_cliente: data.id_cliente,
              origen_tipo: 'parking',
              origen_id: reservaId,
              concepto,
              importe: importePago,
              metodo: data.pago.metodo,
              metodo_pago_id: await resolvePaymentMethodIdByCode(supabaseClient, data.pago.metodo),
              estado: data.pago.estado
            }
          ])
          .select('id')
          .single();

        if (pagoError || !pagoData?.id) {
          throw pagoError ?? new Error('No se pudo crear el pago asociado');
        }

        const { error: aplicacionError } = await supabaseClient.from('pago_aplicacion').insert([
          {
            pago_id: pagoData.id,
            entidad_tipo: 'parking_reserva',
            entidad_id: reservaId,
            importe_aplicado: importePago
          }
        ]);

        if (aplicacionError) {
          await supabaseClient.from('pago').delete().eq('id', pagoData.id);
          throw aplicacionError;
        }
      }

      await fetchPlazasParking();
      return true;
    } catch (err) {
      console.error('Error al crear la reserva:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
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

      const { error: deletePagosError } = await supabaseClient
        .from('pago')
        .delete()
        .eq('origen_tipo', 'parking')
        .eq('origen_id', reservaActual.id);

      if (deletePagosError) {
        throw deletePagosError;
      }

      const { error: deleteReservaError } = await supabaseClient
        .from('parking_reserva')
        .delete()
        .eq('id', reservaActual.id);

      if (deleteReservaError) {
        throw deleteReservaError;
      }

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

  const getPagoReserva = async (reservaId: string): Promise<PagoParking | null> => {
    try {
      const { data: aplicacionData, error: aplicacionError } = await supabaseClient
        .from('pago_aplicacion')
        .select(
          `
          pago:pago_id (
            id,
            id_cliente,
            origen_tipo,
            origen_id,
            concepto,
            importe,
            metodo,
            estado
          )
          `
        )
        .eq('entidad_tipo', 'parking_reserva')
        .eq('entidad_id', reservaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!aplicacionError && aplicacionData?.pago) {
        const pagoItem = Array.isArray(aplicacionData.pago) ? aplicacionData.pago[0] : aplicacionData.pago;
        if (pagoItem) {
          return pagoItem as PagoParking;
        }
      }

      const { data: pagoData, error: pagoError } = await supabaseClient
        .from('pago')
        .select('id,id_cliente,origen_tipo,origen_id,concepto,importe,metodo,estado')
        .eq('origen_tipo', 'parking')
        .eq('origen_id', reservaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pagoError) {
        throw pagoError;
      }

      return (pagoData as PagoParking | null) ?? null;
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
