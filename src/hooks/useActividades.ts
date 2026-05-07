import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useTickets } from './useTickets';
import { resolvePaymentMethodIdByCode } from '@/lib/contabilidadCatalogos';
import type {
  ReservaServicioItemMetadata,
  ServicioHorarioRegla
} from '@/lib/campamento';

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
  codigo?: string;
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
  modo_precio: 'por_persona' | 'fijo';
  modo_agenda: 'libre' | 'horario_recurrente' | 'sesion_manual';
  requiere_sesion: boolean;
  numero_personas: number | null;
  fecha: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  reserva: boolean;
  deposito_permitido: boolean;
  deposito_obligatorio: boolean;
  precio_reserva: number | null;
  uni_disponibles: number | null;
  duracion_minima_min: number | null;
  duracion_maxima_min: number | null;
  intervalo_reserva_min: number | null;
  usa_pool_inventario: boolean;
  pool_inventario_codigo?: string | null;
  pool_inventario_total?: number | null;
  created_at: string;
  updated_at: string;
}

export interface TarifaActividad {
  id: string;
  id_actividad: string;
  codigo?: string;
  nombre_tarifa?: string;
  duracion_valor: number;
  duracion_unidad: string;
  precio: number;
  descuento: number | null;
  metadata?: Record<string, unknown>;
}

export interface DisponibilidadServicio {
  success: boolean;
  disponible?: boolean;
  stockDisponible?: number;
  stockTotal?: number;
  reservadas?: number;
  message: string;
  motivo?: string;
}

export interface SiguienteDisponibilidadServicio {
  success: boolean;
  encontrado?: boolean;
  inicioSugerido?: string;
  finSugerido?: string;
  stockDisponible?: number;
  stockTotal?: number;
  reservadas?: number;
  message: string;
  motivo?: string;
}

export interface Reserva {
  id: string;
  id_cliente?: string;
  cliente?: {
    id?: string;
    nombre: string;
    apellidos: string;
  };
  actividad?: {
    nombre: string;
  };
  empresa?: {
    nombre: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  precio: number;
  estado: string;
  cantidad_reservada: number;
  numero_personas_reserva?: number;
  metadata?: ReservaServicioItemMetadata;
  nota?: string;
  ticket_url?: string;
  ticket_url_reserva?: string;
}

export interface Pago {
  id: string;
  importe: number;
  concepto: string;
  metodo: string;
  estado: string;
  origen_tipo: string;
  origen_id: string;
  metodo_pago_id?: string | null;
  created_at?: string;
  updated_at?: string;
  cliente?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

export interface PagoReembolso {
  id: string;
  pago_id: string;
  reserva_id: string;
  importe: number;
  metodo: string;
  metodo_pago_id?: string | null;
  fecha_operacion: string;
  comentario?: string | null;
  movimiento_contable_id?: string | null;
  created_at: string;
}

export type EstadoReembolsoPago = 'sin_reembolso' | 'parcial' | 'total';

export interface PagoReservaConReembolsos extends Pago {
  importe_reembolsado: number;
  importe_reembolsable: number;
  estado_reembolso: EstadoReembolsoPago;
  reembolsos: PagoReembolso[];
}

export interface CancelarReservaConReembolsosInput {
  reservaId: string;
  reembolsos: Array<{
    pagoId: string;
    importe: number;
    comentario?: string;
  }>;
  comentario?: string;
  cancelarPendientes?: boolean;
}

type CategoriaServicio = 'actividad' | 'alquiler' | 'ruta' | 'curso' | 'campamento' | 'otro';

const TIPO_TO_CATEGORIA: Record<NuevaActividad['tipo'], CategoriaServicio> = {
  alquiler: 'alquiler',
  curso: 'curso',
  ruta: 'ruta',
  campamento: 'campamento',
  sport: 'actividad',
  parking: 'otro',
  otros: 'otro'
};

const CATEGORIA_TO_TIPO: Record<CategoriaServicio, ActividadDB['tipo']> = {
  actividad: 'sport',
  alquiler: 'alquiler',
  ruta: 'ruta',
  curso: 'curso',
  campamento: 'campamento',
  otro: 'otros'
};

type MetodoPago = 'efectivo' | 'tpv' | 'tpv_online' | 'bizum_alfonso' | 'bizum_robe' | 'bizum_alba' | 'bizum_maria' | 'bizum_jm' | 'angeles' | 'transferencia';

const ESTADOS_RESERVA = ['confirmada', 'pendiente', 'completada', 'cancelada'] as const;

function mapServicioToActividadDB(servicio: {
  id: string;
  codigo?: string | null;
  nombre: string;
  categoria: CategoriaServicio;
  modo_precio: 'por_persona' | 'fijo';
  modo_agenda: 'libre' | 'horario_recurrente' | 'sesion_manual';
  requiere_sesion: boolean;
  reservable: boolean;
  deposito_permitido: boolean;
  deposito_obligatorio: boolean;
  deposito_default: number | null;
  capacidad_max: number | null;
  duracion_minima_min: number | null;
  duracion_maxima_min: number | null;
  intervalo_reserva_min: number | null;
  servicio_consumo_pool?: Array<{
    pool_id?: string | null;
    obligatorio?: boolean | null;
    activo?: boolean | null;
    pool?: Array<{
      codigo?: string | null;
      cantidad_total?: number | null;
    }> | null;
  }> | null;
  created_at: string;
  updated_at: string;
}): ActividadDB {
  const poolsActivosObligatorios = (servicio.servicio_consumo_pool ?? []).filter(
    (pool) => pool?.activo !== false && pool?.obligatorio !== false && !!pool?.pool_id
  );
  const primaryPool = poolsActivosObligatorios[0];
  const primaryPoolData = Array.isArray(primaryPool?.pool) ? primaryPool.pool[0] : null;

  return {
    id: servicio.id,
    codigo: servicio.codigo ?? undefined,
    nombre: servicio.nombre,
    tipo: CATEGORIA_TO_TIPO[servicio.categoria] ?? 'otros',
    modo_precio: servicio.modo_precio,
    modo_agenda: servicio.modo_agenda,
    requiere_sesion: servicio.requiere_sesion,
    numero_personas: servicio.capacidad_max,
    fecha: null,
    hora_inicio: null,
    hora_fin: null,
    reserva: servicio.reservable,
    deposito_permitido: servicio.deposito_permitido,
    deposito_obligatorio: servicio.deposito_obligatorio,
    precio_reserva: servicio.deposito_default ?? 0,
    uni_disponibles: servicio.capacidad_max,
    duracion_minima_min: servicio.duracion_minima_min,
    duracion_maxima_min: servicio.duracion_maxima_min,
    intervalo_reserva_min: servicio.intervalo_reserva_min,
    usa_pool_inventario: poolsActivosObligatorios.length > 0,
    pool_inventario_codigo: primaryPoolData?.codigo ?? null,
    pool_inventario_total:
      primaryPoolData?.cantidad_total !== undefined && primaryPoolData?.cantidad_total !== null
        ? Number(primaryPoolData.cantidad_total)
        : null,
    created_at: servicio.created_at,
    updated_at: servicio.updated_at
  };
}

function mapDuracionMinToUnidad(duracionMin: number | null): { duracion_valor: number; duracion_unidad: string } {
  if (!duracionMin || duracionMin <= 0) {
    return { duracion_valor: 1, duracion_unidad: 'hora' };
  }

  if (duracionMin % (60 * 24 * 30) === 0) {
    return { duracion_valor: duracionMin / (60 * 24 * 30), duracion_unidad: 'mes' };
  }

  if (duracionMin % (60 * 24 * 7) === 0) {
    return { duracion_valor: duracionMin / (60 * 24 * 7), duracion_unidad: 'semana' };
  }

  if (duracionMin % (60 * 24) === 0) {
    return { duracion_valor: duracionMin / (60 * 24), duracion_unidad: 'dia' };
  }

  if (duracionMin % 60 === 0) {
    return { duracion_valor: duracionMin / 60, duracion_unidad: 'hora' };
  }

  return { duracion_valor: duracionMin, duracion_unidad: 'minuto' };
}

function toISOWithFallback(fecha: string, hora: string | undefined, fallbackEnd = false): string {
  const hhmm = hora && /^\d{2}:\d{2}$/.test(hora) ? hora : fallbackEnd ? '23:59' : '00:00';
  return new Date(`${fecha}T${hhmm}:00`).toISOString();
}

export function useActividades() {
  const { supabase } = useSupabase();
  const { deleteTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crearActividad = async (actividad: NuevaActividad): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: empresa, error: empresaError } = await supabase
        .from('empresa')
        .select('id')
        .eq('nombre', 'Flecha Extreme')
        .single();

      if (empresaError || !empresa?.id) {
        return { success: false, message: `Error obteniendo empresa: ${empresaError?.message ?? 'No encontrada'}` };
      }

      const categoria = TIPO_TO_CATEGORIA[actividad.tipo] ?? 'otro';

      const payload = {
        empresa_id: empresa.id,
        codigo: actividad.nombre
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, ''),
        nombre: actividad.nombre,
        categoria,
        modo_precio: actividad.tipo === 'campamento' || actividad.tipo === 'curso' || actividad.tipo === 'sport' ? 'por_persona' : 'fijo',
        modo_agenda: actividad.fecha || actividad.horaInicio || actividad.horaFin ? 'sesion_manual' : 'libre',
        reservable: actividad.reserva ?? true,
        activo: true,
        capacidad_max: actividad.numeroPersonas ?? null,
        deposito_permitido: (actividad.precio_reserva ?? 0) > 0,
        deposito_obligatorio: false,
        deposito_default: actividad.precio_reserva ?? 0,
        notas: null
      };

      const { error: insertError } = await supabase.from('servicio').insert([payload]);

      if (insertError) {
        return { success: false, message: `Error al crear la actividad: ${insertError.message}` };
      }

      return { success: true, message: 'Actividad creada correctamente' };
    } catch {
      return { success: false, message: 'Error inesperado al crear la actividad' };
    } finally {
      setLoading(false);
    }
  };

  const obtenerActividades = async (): Promise<ActividadDB[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('servicio')
        .select('id,codigo,nombre,categoria,modo_precio,modo_agenda,requiere_sesion,reservable,deposito_permitido,deposito_obligatorio,deposito_default,capacidad_max,duracion_minima_min,duracion_maxima_min,intervalo_reserva_min,created_at,updated_at,servicio_consumo_pool(pool_id,obligatorio,activo,pool:inventario_pool(codigo,cantidad_total))')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return (data ?? []).map(mapServicioToActividadDB);
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

      const categoria = TIPO_TO_CATEGORIA[tipo as NuevaActividad['tipo']] ?? 'otro';

      const { data, error: fetchError } = await supabase
        .from('servicio')
        .select('id,codigo,nombre,categoria,modo_precio,modo_agenda,requiere_sesion,reservable,deposito_permitido,deposito_obligatorio,deposito_default,capacidad_max,duracion_minima_min,duracion_maxima_min,intervalo_reserva_min,created_at,updated_at,servicio_consumo_pool(pool_id,obligatorio,activo,pool:inventario_pool(codigo,cantidad_total))')
        .eq('categoria', categoria)
        .eq('activo', true)
        .eq('reservable', true)
        .order('nombre', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return (data ?? []).map(mapServicioToActividadDB);
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
        .from('servicio_tarifa')
        .select('id,servicio_id,codigo,nombre_tarifa,duracion_min,precio,metadata')
        .eq('servicio_id', idActividad)
        .eq('activo', true)
        .order('duracion_min', { ascending: true, nullsFirst: true });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return (data ?? []).map((tarifa) => {
        const { duracion_valor, duracion_unidad } = mapDuracionMinToUnidad(tarifa.duracion_min);
        return {
          id: tarifa.id,
          id_actividad: tarifa.servicio_id,
          codigo: tarifa.codigo,
          nombre_tarifa: tarifa.nombre_tarifa,
          duracion_valor,
          duracion_unidad,
          precio: Number(tarifa.precio ?? 0),
          descuento: null,
          metadata: tarifa.metadata ?? {}
        };
      });
    } catch {
      setError('Error inesperado al obtener tarifas de la actividad');
      return [];
    } finally {
      setLoadingActividades(false);
    }
  }, [supabase]);

  const obtenerHorariosActividad = useCallback(async (idActividad: string): Promise<ServicioHorarioRegla[]> => {
    try {
      setLoadingActividades(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('servicio_horario_regla')
        .select('id,servicio_id,dia_semana,hora_inicio,hora_fin,activo_desde,activo_hasta,capacidad_override,intervalo_min')
        .eq('servicio_id', idActividad)
        .eq('activo', true)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        return [];
      }

      return (data ?? []).map((regla) => ({
        id: regla.id,
        servicio_id: regla.servicio_id,
        dia_semana: Number(regla.dia_semana),
        hora_inicio: regla.hora_inicio,
        hora_fin: regla.hora_fin,
        activo_desde: regla.activo_desde ?? null,
        activo_hasta: regla.activo_hasta ?? null,
        capacidad_override: regla.capacidad_override ?? null,
        intervalo_min: regla.intervalo_min ?? null
      }));
    } catch {
      setError('Error inesperado al obtener los horarios de la actividad');
      return [];
    } finally {
      setLoadingActividades(false);
    }
  }, [supabase]);

  const actualizarActividad = async (id: string, actividad: Partial<NuevaActividad>): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (actividad.nombre !== undefined) updates.nombre = actividad.nombre;
      if (actividad.tipo !== undefined) updates.categoria = TIPO_TO_CATEGORIA[actividad.tipo] ?? 'otro';
      if (actividad.numeroPersonas !== undefined) updates.capacidad_max = actividad.numeroPersonas;
      if (actividad.reserva !== undefined) updates.reservable = actividad.reserva;
      if (actividad.precio_reserva !== undefined) {
        updates.deposito_default = actividad.precio_reserva;
        updates.deposito_permitido = actividad.precio_reserva > 0;
      }

      const { error: updateError } = await supabase.from('servicio').update(updates).eq('id', id);

      if (updateError) {
        return { success: false, message: `Error al actualizar la actividad: ${updateError.message}` };
      }

      return { success: true, message: 'Actividad actualizada correctamente' };
    } catch {
      return { success: false, message: 'Error inesperado al actualizar la actividad' };
    } finally {
      setLoading(false);
    }
  };

  const eliminarActividad = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.from('servicio').delete().eq('id', id);

      if (deleteError) {
        return { success: false, message: `Error al eliminar la actividad: ${deleteError.message}` };
      }

      return { success: true, message: 'Actividad eliminada correctamente' };
    } catch {
      return { success: false, message: 'Error inesperado al eliminar la actividad' };
    } finally {
      setLoading(false);
    }
  };

  const crearReserva = async (datosReserva: {
    id_cliente: string | null;
    id_actividad: string;
    id_empresa: string;
    cantidad_reservada: number;
    numero_personas?: number;
    precio: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
    nota?: string;
    metadata?: ReservaServicioItemMetadata;
  }): Promise<{ success: boolean; message: string; reservaId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const precioTotal = Number(datosReserva.precio ?? 0);
      const cantidad = Math.max(1, Number(datosReserva.cantidad_reservada ?? 1));
      const precioUnitario = cantidad > 0 ? Number((precioTotal / cantidad).toFixed(2)) : precioTotal;

      const { data: reservaData, error: reservaError } = await supabase
        .from('reserva_servicio')
        .insert([
          {
            empresa_id: datosReserva.id_empresa,
            cliente_id: datosReserva.id_cliente,
            canal: 'backoffice',
            estado: datosReserva.estado,
            observaciones: datosReserva.nota ?? null,
            total_bruto: precioTotal,
            total_descuento: 0,
            total_neto: precioTotal,
            deposito_total_requerido: 0,
            deposito_total_cobrado: 0
          }
        ])
        .select('id')
        .single();

      if (reservaError || !reservaData?.id) {
        throw reservaError ?? new Error('No se pudo crear la reserva');
      }

      const itemMetadata: ReservaServicioItemMetadata = {
        ...(datosReserva.metadata ?? {})
      };

      if (datosReserva.numero_personas && datosReserva.numero_personas > 0) {
        itemMetadata.numero_personas = datosReserva.numero_personas;
      }

      const { error: itemError } = await supabase.from('reserva_servicio_item').insert([
        {
          reserva_id: reservaData.id,
          servicio_id: datosReserva.id_actividad,
          inicio: datosReserva.fecha_inicio,
          fin: datosReserva.fecha_fin,
          cantidad,
          precio_unitario: precioUnitario,
          descuento_unitario: 0,
          subtotal: precioTotal,
          deposito_requerido: 0,
          deposito_cobrado: 0,
          estado: datosReserva.estado,
          notas: datosReserva.nota ?? null,
          metadata: itemMetadata
        }
      ]);

      if (itemError) {
        await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
        throw itemError;
      }

      return { success: true, message: 'Reserva creada correctamente', reservaId: reservaData.id };
    } catch (err: unknown) {
      console.error('Error al crear reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la reserva';
      setError(errorMessage);
      return { success: false, message: errorMessage };
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
    metodo: MetodoPago;
    estado: 'completado' | 'pendiente' | 'cancelado';
  }): Promise<{ success: boolean; message: string; pagoId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: pagoError } = await supabase
        .from('pago')
        .insert([
          {
            id_cliente: datosPago.id_cliente,
            origen_tipo: datosPago.origen_tipo,
            origen_id: datosPago.origen_id,
            concepto: datosPago.concepto,
            importe: datosPago.importe,
            metodo: datosPago.metodo,
            metodo_pago_id: await resolvePaymentMethodIdByCode(supabase, datosPago.metodo),
            estado: datosPago.estado
          }
        ])
        .select('id')
        .single();

      if (pagoError || !data?.id) {
        throw pagoError ?? new Error('No se pudo crear el pago');
      }

      const { error: aplicacionError } = await supabase.from('pago_aplicacion').insert([
        {
          pago_id: data.id,
          entidad_tipo: 'reserva_servicio',
          entidad_id: datosPago.origen_id,
          importe_aplicado: datosPago.importe,
          created_by: null
        }
      ]);

      if (aplicacionError) {
        await supabase.from('pago').delete().eq('id', data.id);
        throw aplicacionError;
      }

      return { success: true, message: 'Pago creado correctamente', pagoId: data.id };
    } catch (err: unknown) {
      console.error('Error al crear pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el pago';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerIdEmpresa = async (nombreEmpresa: string): Promise<{ success: boolean; empresaId?: string; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('empresa')
        .select('id')
        .eq('nombre', nombreEmpresa)
        .single();

      if (fetchError || !data?.id) {
        throw fetchError ?? new Error('Empresa no encontrada');
      }

      return { success: true, empresaId: data.id, message: 'ID de empresa obtenido correctamente' };
    } catch (err: unknown) {
      console.error('Error al obtener ID de empresa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener ID de empresa';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerIdCliente = async (nombreCliente: string, apellidosCliente: string): Promise<{ success: boolean; clienteId?: string; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('cliente')
        .select('id')
        .eq('nombre', nombreCliente)
        .eq('apellidos', apellidosCliente)
        .single();

      if (fetchError || !data?.id) {
        throw fetchError ?? new Error('Cliente no encontrado');
      }

      return { success: true, clienteId: data.id, message: 'ID de cliente obtenido correctamente' };
    } catch (err: unknown) {
      console.error('Error al obtener ID de cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener ID de cliente';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerReservas = useCallback(async (): Promise<{ success: boolean; reservas?: Reserva[]; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reserva_servicio')
        .select(`
          id,
          cliente_id,
          estado,
          observaciones,
          total_neto,
          ticket_url,
          ticket_url_reserva,
          created_at,
          cliente:cliente(id, nombre, apellidos, movil, email),
          empresa:empresa(id, nombre),
          items:reserva_servicio_item(
            id,
            inicio,
            fin,
            cantidad,
            subtotal,
          estado,
          metadata,
          servicio:servicio(id, nombre, categoria)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const reservas: Reserva[] = (data ?? []).map((r) => {
        const firstItem = (r.items ?? [])[0];
        const servicioItem = Array.isArray(firstItem?.servicio) ? firstItem.servicio[0] : firstItem?.servicio;
        const clienteItem = Array.isArray(r.cliente) ? r.cliente[0] : r.cliente;
        const empresaItem = Array.isArray(r.empresa) ? r.empresa[0] : r.empresa;
        const actividadNombre = servicioItem?.nombre ?? 'Actividad no encontrada';
        const itemMetadata = (firstItem?.metadata as ReservaServicioItemMetadata | null) ?? undefined;

        return {
          id: r.id,
          id_cliente: r.cliente_id ?? undefined,
          cliente: clienteItem
            ? {
                id: clienteItem.id,
                nombre: clienteItem.nombre,
                apellidos: clienteItem.apellidos
              }
            : undefined,
          actividad: { nombre: actividadNombre },
          empresa: empresaItem ? { nombre: empresaItem.nombre } : undefined,
          fecha_inicio: firstItem?.inicio ?? r.created_at,
          fecha_fin: firstItem?.fin ?? r.created_at,
          precio: Number(r.total_neto ?? firstItem?.subtotal ?? 0),
          estado: r.estado,
          cantidad_reservada: Number(firstItem?.cantidad ?? 1),
          numero_personas_reserva: Number(itemMetadata?.numero_personas ?? firstItem?.cantidad ?? 1),
          metadata: itemMetadata,
          nota: r.observaciones ?? undefined,
          ticket_url: r.ticket_url ?? undefined,
          ticket_url_reserva: r.ticket_url_reserva ?? undefined
        };
      });

      return { success: true, reservas, message: 'Reservas obtenidas correctamente' };
    } catch (err: unknown) {
      console.error('Error al obtener reservas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reservas';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const actualizarReserva = async (id: string, datosReserva: {
    estado?: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
    nota?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const updatePayload: Record<string, unknown> = {};
      if (datosReserva.estado && ESTADOS_RESERVA.includes(datosReserva.estado)) {
        updatePayload.estado = datosReserva.estado;
      }
      if (datosReserva.nota !== undefined) {
        updatePayload.observaciones = datosReserva.nota;
      }

      const { error: updateError } = await supabase.from('reserva_servicio').update(updatePayload).eq('id', id);

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: 'Reserva actualizada correctamente' };
    } catch (err: unknown) {
      console.error('Error al actualizar reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar reserva';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const eliminarReserva = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: reservaAEliminar, error: reservaFetchError } = await supabase
        .from('reserva_servicio')
        .select('ticket_url, ticket_url_reserva')
        .eq('id', id)
        .single();

      if (reservaFetchError) {
        throw new Error(`Error obteniendo datos de la reserva: ${reservaFetchError.message}`);
      }

      if (reservaAEliminar?.ticket_url) {
        await deleteTicket(reservaAEliminar.ticket_url);
      }

      if (reservaAEliminar?.ticket_url_reserva) {
        await deleteTicket(reservaAEliminar.ticket_url_reserva);
      }

      const { error: pagosError } = await supabase
        .from('pago')
        .delete()
        .eq('origen_tipo', 'reserva')
        .eq('origen_id', id);

      if (pagosError) {
        throw new Error(`Error eliminando pagos asociados: ${pagosError.message}`);
      }

      const { error: reservaError } = await supabase.from('reserva_servicio').delete().eq('id', id);

      if (reservaError) {
        throw new Error(`Error eliminando reserva: ${reservaError.message}`);
      }

      return { success: true, message: 'Reserva, pagos asociados y tickets eliminados correctamente' };
    } catch (err: unknown) {
      console.error('Error al eliminar reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar reserva';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const consultarStockDisponible = useCallback(
    async (
      idActividad: string,
      fecha: string,
      horaInicio?: string,
      horaFin?: string,
      cantidad = 1
    ): Promise<DisponibilidadServicio> => {
      try {
        setLoading(true);
        setError(null);

        const inicio = toISOWithFallback(fecha, horaInicio, false);
        const fin = horaFin ? toISOWithFallback(fecha, horaFin, true) : toISOWithFallback(fecha, '23:59', true);

        const { data, error: rpcError } = await supabase.rpc('rpc_consultar_disponibilidad_servicio', {
          p_servicio_id: idActividad,
          p_inicio: inicio,
          p_fin: fin,
          p_cantidad: cantidad
        });

        if (rpcError) {
          throw rpcError;
        }

        const row = Array.isArray(data) ? data[0] : null;
        if (!row) {
          return {
            success: true,
            stockDisponible: 0,
            stockTotal: 0,
            reservadas: 0,
            message: 'Sin información de disponibilidad'
          };
        }

        return {
          success: true,
          disponible: Boolean(row.disponible),
          stockDisponible: Number(row.stock_disponible ?? 0),
          stockTotal: Number(row.stock_total ?? 0),
          reservadas: Number(row.reservadas ?? 0),
          message: row.disponible ? 'Stock consultado correctamente' : `No disponible: ${row.motivo ?? 'sin_detalle'}`,
          motivo: row.motivo ?? undefined
        };
      } catch (err: unknown) {
        console.error('Error al consultar stock:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al consultar stock disponible';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const buscarSiguienteDisponibilidadServicio = useCallback(
    async (
      idActividad: string,
      fecha: string,
      horaInicio: string,
      duracionMin: number,
      cantidad: number,
      stepMin = 60,
      horizonHours = 720
    ): Promise<SiguienteDisponibilidadServicio> => {
      try {
        setLoading(true);
        setError(null);

        const inicioSolicitado = toISOWithFallback(fecha, horaInicio, false);

        const { data, error: rpcError } = await supabase.rpc('rpc_buscar_siguiente_disponibilidad_servicio', {
          p_servicio_id: idActividad,
          p_inicio_solicitado: inicioSolicitado,
          p_duracion_min: duracionMin,
          p_cantidad: cantidad,
          p_step_min: stepMin,
          p_horizon_hours: horizonHours
        });

        if (rpcError) {
          throw rpcError;
        }

        const row = Array.isArray(data) ? data[0] : null;
        if (!row) {
          return {
            success: true,
            encontrado: false,
            stockDisponible: 0,
            stockTotal: 0,
            reservadas: 0,
            message: 'Sin sugerencias de disponibilidad',
            motivo: 'sin_datos'
          };
        }

        return {
          success: true,
          encontrado: Boolean(row.encontrado),
          inicioSugerido: row.inicio_sugerido ?? undefined,
          finSugerido: row.fin_sugerido ?? undefined,
          stockDisponible: Number(row.stock_disponible ?? 0),
          stockTotal: Number(row.stock_total ?? 0),
          reservadas: Number(row.reservadas ?? 0),
          message: row.encontrado ? 'Siguiente hueco encontrado' : 'No se encontraron huecos en el horizonte configurado',
          motivo: row.motivo ?? undefined
        };
      } catch (err: unknown) {
        console.error('Error al buscar siguiente disponibilidad:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al buscar siguiente disponibilidad';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const obtenerPagosPendientesReserva = async (reservaId: string): Promise<{ success: boolean; pagos?: Pago[]; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pago')
        .select(`
          *,
          cliente:cliente(id, nombre, apellidos, email)
        `)
        .eq('origen_tipo', 'reserva')
        .eq('origen_id', reservaId)
        .eq('estado', 'pendiente');

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, pagos: data ?? [], message: 'Pagos pendientes obtenidos correctamente' };
    } catch (err: unknown) {
      console.error('Error al obtener pagos pendientes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener pagos pendientes';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerTodosLosPagosReserva = async (reservaId: string): Promise<{ success: boolean; pagos?: Pago[]; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pago')
        .select('*')
        .eq('origen_tipo', 'reserva')
        .eq('origen_id', reservaId);

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, pagos: data ?? [], message: 'Todos los pagos obtenidos correctamente' };
    } catch (err: unknown) {
      console.error('Error al obtener todos los pagos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener todos los pagos';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerPagosReservaConReembolsos = useCallback(
    async (reservaId: string): Promise<{ success: boolean; pagos?: PagoReservaConReembolsos[]; message: string }> => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('pago')
          .select(`
            id,
            id_cliente,
            origen_tipo,
            origen_id,
            concepto,
            importe,
            metodo,
            metodo_pago_id,
            estado,
            created_at,
            updated_at,
            cliente:cliente(id, nombre, apellidos),
            reembolsos:pago_reembolso(
              id,
              pago_id,
              reserva_id,
              importe,
              metodo,
              metodo_pago_id,
              fecha_operacion,
              comentario,
              movimiento_contable_id,
              created_at
            )
          `)
          .eq('origen_tipo', 'reserva')
          .eq('origen_id', reservaId)
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        const pagos = (data ?? []).map((pago) => {
          const clienteRaw = Array.isArray(pago.cliente) ? pago.cliente[0] : pago.cliente;
          const reembolsos = ((pago.reembolsos ?? []) as PagoReembolso[]).map((reembolso) => ({
            ...reembolso,
            importe: Number(reembolso.importe ?? 0)
          }));
          const importe = Number(pago.importe ?? 0);
          const importeReembolsado = reembolsos.reduce((total, reembolso) => total + Number(reembolso.importe ?? 0), 0);
          const importeReembolsable = pago.estado === 'completado' ? Math.max(importe - importeReembolsado, 0) : 0;
          const estadoReembolso: EstadoReembolsoPago =
            importeReembolsado <= 0
              ? 'sin_reembolso'
              : importeReembolsable <= 0
                ? 'total'
                : 'parcial';

          return {
            ...pago,
            importe,
            cliente: clienteRaw
              ? {
                  id: clienteRaw.id,
                  nombre: clienteRaw.nombre,
                  apellidos: clienteRaw.apellidos
                }
              : undefined,
            importe_reembolsado: Number(importeReembolsado.toFixed(2)),
            importe_reembolsable: Number(importeReembolsable.toFixed(2)),
            estado_reembolso: estadoReembolso,
            reembolsos
          };
        });

        return {
          success: true,
          pagos,
          message: 'Pagos y reembolsos de la reserva obtenidos correctamente'
        };
      } catch (err: unknown) {
        console.error('Error al obtener pagos con reembolsos:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al obtener pagos con reembolsos';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const cancelarReservaConReembolsos = useCallback(
    async (
      input: CancelarReservaConReembolsosInput
    ): Promise<{
      success: boolean;
      message: string;
      data?: {
        totalReembolsado: number;
        reembolsosCreados: number;
        pagosPendientesCancelados: number;
      };
    }> => {
      try {
        setLoading(true);
        setError(null);

        const payload = input.reembolsos
          .filter((reembolso) => reembolso.importe > 0)
          .map((reembolso) => ({
            pago_id: reembolso.pagoId,
            importe: Number(reembolso.importe.toFixed(2)),
            ...(reembolso.comentario ? { comentario: reembolso.comentario } : {})
          }));

        const { data, error: rpcError } = await supabase.rpc('rpc_cancelar_reserva_con_reembolsos', {
          p_reserva_id: input.reservaId,
          p_reembolsos: payload,
          p_cancelar_pendientes: input.cancelarPendientes ?? true,
          p_comentario: input.comentario ?? null
        });

        if (rpcError) {
          throw rpcError;
        }

        const response = data as {
          success?: boolean;
          total_reembolsado?: number | string;
          reembolsos_creados?: number;
          pagos_pendientes_cancelados?: number;
        } | null;

        return {
          success: Boolean(response?.success ?? true),
          message: 'Reserva cancelada correctamente',
          data: {
            totalReembolsado: Number(response?.total_reembolsado ?? 0),
            reembolsosCreados: Number(response?.reembolsos_creados ?? 0),
            pagosPendientesCancelados: Number(response?.pagos_pendientes_cancelados ?? 0)
          }
        };
      } catch (err: unknown) {
        console.error('Error al cancelar reserva con reembolsos:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cancelar la reserva';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const actualizarTicketUrlReserva = async (reservaId: string, ticketUrl: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('reserva_servicio')
        .update({ ticket_url_reserva: ticketUrl })
        .eq('id', reservaId);

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: 'Ticket URL de reserva actualizado correctamente' };
    } catch (err: unknown) {
      console.error('Error al actualizar ticket URL de reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar ticket URL de reserva';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoPago = async (
    pagoId: string,
    nuevoEstado: 'completado' | 'pendiente' | 'cancelado'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.from('pago').update({ estado: nuevoEstado }).eq('id', pagoId);

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: 'Estado del pago actualizado correctamente' };
    } catch (err: unknown) {
      console.error('Error al actualizar estado del pago:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar estado del pago';
      setError(errorMessage);
      return { success: false, message: errorMessage };
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
    obtenerHorariosActividad,
    actualizarActividad,
    eliminarActividad,
    crearReserva,
    crearPago,
    obtenerIdEmpresa,
    obtenerIdCliente,
    obtenerReservas,
    actualizarReserva,
    eliminarReserva,
    consultarStockDisponible,
    buscarSiguienteDisponibilidadServicio,
    obtenerPagosPendientesReserva,
    obtenerTodosLosPagosReserva,
    obtenerPagosReservaConReembolsos,
    cancelarReservaConReembolsos,
    actualizarTicketUrlReserva,
    actualizarEstadoPago
  };
}
