import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useTickets } from './useTickets';
import { resolvePaymentMethodIdByCode } from '@/lib/contabilidadCatalogos';
import type {
  CampamentoInscripcion,
  CampamentoParticipante,
  CampamentoParticipanteDescuento,
  CampamentoParticipanteDescuentoSeleccionado,
  CampamentoPrograma,
  DescuentoCatalogo,
  DescuentoTipoValor,
  PagoDescuentoSnapshot,
  ReservaServicioItemMetadata,
  ServicioHorarioRegla
} from '@/lib/campamento';
import {
  calculateCampamentoDiscountAmount,
  roundCampamentoCurrency
} from '@/lib/campamento';

export interface NuevaActividadTarifaInput {
  codigo?: string;
  nombreTarifa?: string;
  duracionMin?: number | null;
  precio: number;
  metadata?: Record<string, unknown>;
  activo?: boolean;
}

export interface NuevaActividadInventarioInput {
  poolId?: string;
  codigo?: string;
  nombre?: string;
  unidad?: string;
  cantidadTotal?: number;
  consumoPorUnidad?: number;
  obligatorio?: boolean;
  activo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface NuevaActividad {
  nombre: string;
  tipo: 'alquiler' | 'curso' | 'ruta' | 'campamento' | 'sport' | 'parking' | 'otros';
  numeroPersonas?: number;
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
  reserva?: boolean;
  precio_reserva?: number;
  modoPrecio?: 'por_persona' | 'fijo';
  tarifas?: NuevaActividadTarifaInput[];
  inventario?: NuevaActividadInventarioInput | null;
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

export interface CampamentoParticipanteInput {
  participanteId?: string | null;
  nombre: string;
  dni?: string;
  descuentos?: CampamentoParticipanteDescuentoSeleccionado[];
}

export interface CampamentoProgramaInput {
  servicioId: string;
  fechaInicio: string;
  fechaFin: string;
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
  turnoCodigo?: string | null;
  turnoLabel?: string | null;
  estado?: string;
  notas?: string;
}

export interface CampamentoProgramaDetalle extends CampamentoPrograma {
  inscripciones: CampamentoInscripcion[];
}

export interface CampamentoInscripcionInput {
  campamentoProgramaId: string;
  idCliente: string | null;
  idActividad: string;
  idEmpresa: string;
  tarifaId: string;
  precioUnitario: number;
  precioTotal: number;
  cantidadParticipantes: number;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
  nota?: string;
  participantes: CampamentoParticipanteInput[];
}

export interface PagoDescuentoSnapshotDraft {
  reserva_id: string;
  campamento_participante_id?: string | null;
  descuento_id?: string | null;
  participante_nombre: string;
  descuento_nombre: string;
  tipo_valor: DescuentoTipoValor;
  valor_configurado: number;
  importe_aplicado: number;
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

export interface ReservaItem {
  id: string;
  inicio: string;
  fin: string;
  cantidad: number;
  precio_unitario?: number;
  subtotal: number;
  estado: string;
  tarifa_id?: string | null;
  tarifa_codigo?: string | null;
  tarifa_nombre?: string | null;
  servicio_categoria?: string | null;
  metadata?: ReservaServicioItemMetadata;
}

export interface ReservaServicioItemInput {
  inicio: string;
  fin: string;
  cantidad: number;
  subtotal: number;
  tarifa_id?: string | null;
  metadata?: ReservaServicioItemMetadata;
}

export type EstadoAsignacionTramosReserva = 'no_aplica' | 'pendiente' | 'parcial' | 'completa';

export interface Reserva {
  id: string;
  kind?: 'reserva' | 'campamento_programa';
  id_cliente?: string;
  servicio_id?: string | null;
  tarifa_id?: string | null;
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
  total_bruto?: number;
  total_descuento?: number;
  total_neto?: number;
  precio: number;
  estado: string;
  cantidad_reservada: number;
  numero_personas_reserva?: number;
  metadata?: ReservaServicioItemMetadata;
  items?: ReservaItem[];
  numero_tramos?: number;
  duracion_total_min?: number | null;
  duracion_asignada_min?: number;
  duracion_restante_min?: number;
  estado_asignacion_tramos?: EstadoAsignacionTramosReserva;
  nota?: string;
  ticket_url?: string;
  ticket_url_reserva?: string;
  campamento_programa_id?: string | null;
  campamento_programa?: CampamentoPrograma;
  total_inscripciones?: number;
  total_participantes?: number;
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
  descuentos_snapshot?: PagoDescuentoSnapshot[];
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
const ESTADOS_ASIGNACION_TRAMOS = ['no_aplica', 'pendiente', 'parcial', 'completa'] as const;

function compareIsoDateStrings(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

const MADRID_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function getMadridDateKey(value: string | Date) {
  return MADRID_DATE_KEY_FORMATTER.format(new Date(value));
}

function isFutureMadridDay(value: string) {
  return getMadridDateKey(value) > getMadridDateKey(new Date());
}

function calculateReservaItemDurationMinutes(inicio: string, fin: string) {
  const diffMs = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0;
  }

  return Math.round(diffMs / 60000);
}

function isEstadoAsignacionTramosReserva(value: unknown): value is EstadoAsignacionTramosReserva {
  return typeof value === 'string' && ESTADOS_ASIGNACION_TRAMOS.includes(value as EstadoAsignacionTramosReserva);
}

function normalizeReservaItems(
  rawItems: Array<{
    id?: string | null;
    inicio?: string | null;
    fin?: string | null;
    cantidad?: number | string | null;
    precio_unitario?: number | string | null;
    subtotal?: number | string | null;
    estado?: string | null;
    tarifa_id?: string | null;
    metadata?: ReservaServicioItemMetadata | null;
    servicio?: { id?: string | null; nombre?: string | null; categoria?: string | null } | Array<{ id?: string | null; nombre?: string | null; categoria?: string | null }> | null;
    tarifa?: { id?: string | null; codigo?: string | null; nombre_tarifa?: string | null } | Array<{ id?: string | null; codigo?: string | null; nombre_tarifa?: string | null }> | null;
  }> | null | undefined
): ReservaItem[] {
  return (rawItems ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.inicio && item?.fin))
    .map((item, index) => {
      const tarifaRaw = Array.isArray(item.tarifa) ? item.tarifa[0] : item.tarifa;
      const servicioRaw = Array.isArray(item.servicio) ? item.servicio[0] : item.servicio;
      return {
        id: item.id ?? `item-${index}`,
        inicio: item.inicio ?? '',
        fin: item.fin ?? '',
        cantidad: Number(item.cantidad ?? 1),
        precio_unitario: item.precio_unitario !== undefined && item.precio_unitario !== null ? Number(item.precio_unitario) : undefined,
        subtotal: Number(item.subtotal ?? 0),
        estado: item.estado ?? 'pendiente',
        tarifa_id: item.tarifa_id ?? null,
        tarifa_codigo: tarifaRaw?.codigo ?? null,
        tarifa_nombre: tarifaRaw?.nombre_tarifa ?? null,
        servicio_categoria: servicioRaw?.categoria ?? null,
        metadata: (item.metadata as ReservaServicioItemMetadata | null) ?? undefined
      };
    })
    .sort((left, right) => compareIsoDateStrings(left.inicio, right.inicio));
}

function buildReservaFromRow(row: {
  id: string;
  cliente_id?: string | null;
  campamento_programa_id?: string | null;
  servicio_id?: string | null;
  tarifa_id?: string | null;
  cantidad_reservada?: number | string | null;
  numero_personas_reserva?: number | string | null;
  duracion_total_min?: number | string | null;
  estado_asignacion_tramos?: EstadoAsignacionTramosReserva | null;
  estado: string;
  observaciones?: string | null;
  total_bruto?: number | string | null;
  total_descuento?: number | string | null;
  total_neto?: number | string | null;
  ticket_url?: string | null;
  ticket_url_reserva?: string | null;
  created_at: string;
  cliente?: { id?: string; nombre: string; apellidos: string } | Array<{ id?: string; nombre: string; apellidos: string }> | null;
  empresa?: { id?: string; nombre: string } | Array<{ id?: string; nombre: string }> | null;
  servicio_cabecera?: { id?: string | null; nombre?: string | null; categoria?: string | null } | Array<{ id?: string | null; nombre?: string | null; categoria?: string | null }> | null;
  items?: Array<{
    id?: string | null;
    inicio?: string | null;
    fin?: string | null;
    cantidad?: number | string | null;
    precio_unitario?: number | string | null;
    subtotal?: number | string | null;
    estado?: string | null;
    tarifa_id?: string | null;
    metadata?: ReservaServicioItemMetadata | null;
    servicio?: { id?: string | null; nombre?: string | null; categoria?: string | null } | Array<{ id?: string | null; nombre?: string | null; categoria?: string | null }> | null;
    tarifa?: { id?: string | null; codigo?: string | null; nombre_tarifa?: string | null } | Array<{ id?: string | null; codigo?: string | null; nombre_tarifa?: string | null }> | null;
  }> | null;
}): Reserva {
  const items = normalizeReservaItems(row.items);
  const firstItem = items[0];
  const clienteItem = Array.isArray(row.cliente) ? row.cliente[0] : row.cliente;
  const empresaItem = Array.isArray(row.empresa) ? row.empresa[0] : row.empresa;
  const servicioCabecera = Array.isArray(row.servicio_cabecera) ? row.servicio_cabecera[0] : row.servicio_cabecera;
  const firstRawItem = (row.items ?? [])[0];
  const servicioItem = Array.isArray(firstRawItem?.servicio) ? firstRawItem.servicio[0] : firstRawItem?.servicio;
  const actividadNombre = servicioItem?.nombre ?? servicioCabecera?.nombre ?? 'Actividad no encontrada';
  const itemMetadata = firstItem?.metadata;
  const fechaInicio = firstItem?.inicio ?? row.created_at;
  const fechaFin = items.length > 0 ? items[items.length - 1].fin : row.created_at;
  const duracionTotalMin = row.duracion_total_min !== undefined && row.duracion_total_min !== null
    ? Number(row.duracion_total_min)
    : null;
  const duracionAsignadaMin = items
    .filter((item) => item.estado !== 'cancelada')
    .reduce((total, item) => total + calculateReservaItemDurationMinutes(item.inicio, item.fin), 0);
  const estadoAsignacionTramos = isEstadoAsignacionTramosReserva(row.estado_asignacion_tramos)
    ? row.estado_asignacion_tramos
    : 'no_aplica';
  const duracionRestanteMin = duracionTotalMin && duracionTotalMin > 0
    ? Math.max(duracionTotalMin - duracionAsignadaMin, 0)
    : 0;

  return {
    id: row.id,
    kind: 'reserva',
    id_cliente: row.cliente_id ?? undefined,
    servicio_id: row.servicio_id ?? servicioCabecera?.id ?? undefined,
    tarifa_id: row.tarifa_id ?? firstItem?.tarifa_id ?? undefined,
    cliente: clienteItem
      ? {
          id: clienteItem.id,
          nombre: clienteItem.nombre,
          apellidos: clienteItem.apellidos
        }
      : undefined,
    actividad: { nombre: actividadNombre },
    empresa: empresaItem ? { nombre: empresaItem.nombre } : undefined,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    total_bruto: Number(row.total_bruto ?? row.total_neto ?? items.reduce((total, item) => total + item.subtotal, 0)),
    total_descuento: Number(row.total_descuento ?? 0),
    total_neto: Number(row.total_neto ?? items.reduce((total, item) => total + item.subtotal, 0)),
    precio: Number(row.total_neto ?? items.reduce((total, item) => total + item.subtotal, 0)),
    estado: row.estado,
    cantidad_reservada: Number(row.cantidad_reservada ?? firstItem?.cantidad ?? 1),
    numero_personas_reserva: Number(row.numero_personas_reserva ?? itemMetadata?.numero_personas ?? firstItem?.cantidad ?? row.cantidad_reservada ?? 1),
    metadata: itemMetadata,
    items,
    numero_tramos: items.length,
    duracion_total_min: duracionTotalMin,
    duracion_asignada_min: duracionAsignadaMin,
    duracion_restante_min: duracionRestanteMin,
    estado_asignacion_tramos: estadoAsignacionTramos,
    nota: row.observaciones ?? undefined,
    ticket_url: row.ticket_url ?? undefined,
    ticket_url_reserva: row.ticket_url_reserva ?? undefined,
    campamento_programa_id: row.campamento_programa_id ?? null
  };
}

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

function buildNormalizedCode(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function buildCampamentoParticipanteLookupKey(input: {
  participanteId?: string | null;
  nombre: string;
  dni?: string | null;
}) {
  const participantId = input.participanteId?.trim() ?? '';
  if (participantId) {
    return `id:${participantId}`;
  }

  return `raw:${normalizeCampamentoParticipanteNombre(input.nombre).toLowerCase()}|${normalizeCampamentoParticipanteDni(input.dni)}`;
}

function mapCampamentoParticipanteDescuentoRow(
  descuento: {
    id?: string | null;
    campamento_participante_id?: string | null;
    descuento_id?: string | null;
    importe_aplicado?: number | string | null;
    created_at?: string | null;
    descuento_catalogo?: {
      codigo?: string | null;
      nombre?: string | null;
      tipo_valor?: DescuentoTipoValor | null;
      valor?: number | string | null;
    } | Array<{
      codigo?: string | null;
      nombre?: string | null;
      tipo_valor?: DescuentoTipoValor | null;
      valor?: number | string | null;
    }> | null;
  }
): CampamentoParticipanteDescuento {
  const descuentoCatalogo = Array.isArray(descuento.descuento_catalogo)
    ? descuento.descuento_catalogo[0]
    : descuento.descuento_catalogo;

  return {
    id: descuento.id ?? '',
    campamento_participante_id: descuento.campamento_participante_id ?? null,
    descuento_id: descuento.descuento_id ?? null,
    codigo: descuentoCatalogo?.codigo ?? null,
    nombre: descuentoCatalogo?.nombre ?? 'Descuento',
    tipo_valor: descuentoCatalogo?.tipo_valor === 'porcentaje' ? 'porcentaje' : 'importe_fijo',
    valor_configurado: Number(descuentoCatalogo?.valor ?? 0),
    importe_aplicado: Number(descuento.importe_aplicado ?? 0),
    created_at: descuento.created_at ?? undefined
  };
}

function mapPagoDescuentoSnapshotRow(
  snapshot: {
    id?: string | null;
    pago_id?: string | null;
    reserva_id?: string | null;
    campamento_participante_id?: string | null;
    descuento_id?: string | null;
    participante_nombre?: string | null;
    descuento_nombre?: string | null;
    tipo_valor?: DescuentoTipoValor | null;
    valor_configurado?: number | string | null;
    importe_aplicado?: number | string | null;
    created_at?: string | null;
  }
): PagoDescuentoSnapshot {
  return {
    id: snapshot.id ?? '',
    pago_id: snapshot.pago_id ?? '',
    reserva_id: snapshot.reserva_id ?? '',
    campamento_participante_id: snapshot.campamento_participante_id ?? null,
    descuento_id: snapshot.descuento_id ?? null,
    participante_nombre: snapshot.participante_nombre ?? '',
    descuento_nombre: snapshot.descuento_nombre ?? 'Descuento',
    tipo_valor: snapshot.tipo_valor === 'porcentaje' ? 'porcentaje' : 'importe_fijo',
    valor_configurado: Number(snapshot.valor_configurado ?? 0),
    importe_aplicado: Number(snapshot.importe_aplicado ?? 0),
    created_at: snapshot.created_at ?? undefined
  };
}

function buildTarifaNombreDefault(duracionMin: number | null) {
  if (!duracionMin || duracionMin <= 0) {
    return 'Tarifa estándar';
  }

  const { duracion_valor, duracion_unidad } = mapDuracionMinToUnidad(duracionMin);
  const unidadLabel =
    duracion_unidad === 'hora'
      ? duracion_valor === 1 ? 'hora' : 'horas'
      : duracion_unidad === 'minuto'
        ? duracion_valor === 1 ? 'minuto' : 'minutos'
        : duracion_unidad;

  return `Estándar ${duracion_valor} ${unidadLabel}`;
}

function mapCampamentoPeriodoToDuration(periodo: unknown) {
  if (periodo === 'dia') {
    return { duracion_valor: 1, duracion_unidad: 'dia' };
  }

  if (periodo === 'semana') {
    return { duracion_valor: 1, duracion_unidad: 'semana' };
  }

  if (periodo === 'mes') {
    return { duracion_valor: 1, duracion_unidad: 'mes' };
  }

  return null;
}

function mapTarifaDuration(tarifa: {
  duracion_min: number | null;
  codigo?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  if (typeof tarifa.duracion_min === 'number' && tarifa.duracion_min > 0) {
    return mapDuracionMinToUnidad(tarifa.duracion_min);
  }

  const metadataPeriodo =
    tarifa.metadata?.campamento_periodo ??
    tarifa.metadata?.periodo ??
    tarifa.metadata?.unidad;
  const fromMetadata = mapCampamentoPeriodoToDuration(metadataPeriodo);
  if (fromMetadata) {
    return fromMetadata;
  }

  if (tarifa.codigo?.includes('MONTH')) {
    return { duracion_valor: 1, duracion_unidad: 'mes' };
  }

  if (tarifa.codigo?.includes('WEEK')) {
    return { duracion_valor: 1, duracion_unidad: 'semana' };
  }

  if (tarifa.codigo?.includes('DAY')) {
    return { duracion_valor: 1, duracion_unidad: 'dia' };
  }

  return { duracion_valor: 1, duracion_unidad: 'hora' };
}

function normalizeCampamentoProgramaRow(row: {
  id: string;
  servicio_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_semana: number[] | null;
  hora_inicio: string;
  hora_fin: string;
  turno_codigo?: string | null;
  turno_label?: string | null;
  estado: string;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
  servicio?: { codigo?: string | null; nombre?: string | null } | Array<{ codigo?: string | null; nombre?: string | null }> | null;
  total_inscripciones?: number | string | null;
  total_participantes?: number | string | null;
  total_facturado?: number | string | null;
}): CampamentoPrograma {
  const servicioRaw = Array.isArray(row.servicio) ? row.servicio[0] : row.servicio;

  return {
    id: row.id,
    servicio_id: row.servicio_id,
    servicio_codigo: servicioRaw?.codigo ?? null,
    servicio_nombre: servicioRaw?.nombre ?? 'Campamento',
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    dias_semana: Array.isArray(row.dias_semana) ? row.dias_semana.map((value) => Number(value)).sort((a, b) => a - b) : [],
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    turno_codigo: row.turno_codigo ?? null,
    turno_label: row.turno_label ?? null,
    estado: row.estado,
    notas: row.notas ?? null,
    total_inscripciones: Number(row.total_inscripciones ?? 0),
    total_participantes: Number(row.total_participantes ?? 0),
    total_facturado: Number(row.total_facturado ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toISOWithFallback(fecha: string, hora: string | undefined, fallbackEnd = false): string {
  const hhmm = hora && /^\d{2}:\d{2}$/.test(hora) ? hora : fallbackEnd ? '23:59' : '00:00';
  return new Date(`${fecha}T${hhmm}:00`).toISOString();
}

function normalizeCampamentoParticipanteNombre(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeCampamentoParticipanteNombreKey(value: string) {
  return normalizeCampamentoParticipanteNombre(value).toLowerCase();
}

function normalizeCampamentoParticipanteDni(value?: string | null) {
  return value?.trim().replace(/\s+/g, '').toUpperCase() ?? '';
}

export function useActividades() {
  const { supabase } = useSupabase();
  const { deleteTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolverCatalogoParticipantes = useCallback(async (
    participantes: CampamentoParticipanteInput[]
  ): Promise<Array<{ participanteId: string; nombre: string; dni: string | null }>> => {
    if (participantes.length === 0) {
      return [];
    }

    const resolved: Array<{ participanteId: string; nombre: string; dni: string | null }> = [];

    for (const participante of participantes) {
      const nombre = normalizeCampamentoParticipanteNombre(participante.nombre);
      const dniNormalizado = normalizeCampamentoParticipanteDni(participante.dni);

      if (!nombre) {
        throw new Error('Todos los participantes deben tener nombre');
      }

      const participanteId = participante.participanteId?.trim() || null;
      if (participanteId) {
        const { data: byId, error: byIdError } = await supabase
          .from('campamento_participante_catalogo')
          .select('id,nombre,dni')
          .eq('id', participanteId)
          .maybeSingle();

        if (byIdError) {
          throw byIdError;
        }

        if (byId?.id) {
          resolved.push({
            participanteId: byId.id,
            nombre: byId.nombre,
            dni: byId.dni ?? null
          });
          continue;
        }
      }

      if (dniNormalizado) {
        const { data: byDni, error: byDniError } = await supabase
          .from('campamento_participante_catalogo')
          .select('id,nombre,dni')
          .eq('dni_normalizado', dniNormalizado)
          .maybeSingle();

        if (byDniError) {
          throw byDniError;
        }

        if (byDni?.id) {
          resolved.push({
            participanteId: byDni.id,
            nombre: byDni.nombre,
            dni: byDni.dni ?? null
          });
          continue;
        }
      } else {
        const { data: byNombre, error: byNombreError } = await supabase
          .from('campamento_participante_catalogo')
          .select('id,nombre,dni')
          .eq('nombre_normalizado', normalizeCampamentoParticipanteNombreKey(nombre))
          .is('dni_normalizado', null)
          .maybeSingle();

        if (byNombreError) {
          throw byNombreError;
        }

        if (byNombre?.id) {
          resolved.push({
            participanteId: byNombre.id,
            nombre: byNombre.nombre,
            dni: byNombre.dni ?? null
          });
          continue;
        }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('campamento_participante_catalogo')
        .insert([
          {
            nombre,
            dni: dniNormalizado || null,
            updated_at: new Date().toISOString()
          }
        ])
        .select('id,nombre,dni')
        .single();

      if (insertError || !inserted?.id) {
        const conflictError = insertError as { code?: string } | null;
        if (conflictError?.code === '23505') {
          const fallbackQuery = dniNormalizado
            ? supabase
                .from('campamento_participante_catalogo')
                .select('id,nombre,dni')
                .eq('dni_normalizado', dniNormalizado)
                .maybeSingle()
            : supabase
                .from('campamento_participante_catalogo')
                .select('id,nombre,dni')
                .eq('nombre_normalizado', normalizeCampamentoParticipanteNombreKey(nombre))
                .is('dni_normalizado', null)
                .maybeSingle();

          const { data: existingAfterConflict, error: fallbackError } = await fallbackQuery;
          if (fallbackError) {
            throw fallbackError;
          }

          if (existingAfterConflict?.id) {
            resolved.push({
              participanteId: existingAfterConflict.id,
              nombre: existingAfterConflict.nombre,
              dni: existingAfterConflict.dni ?? null
            });
            continue;
          }
        }

        throw insertError ?? new Error('No se pudo crear el participante en el catálogo');
      }

      resolved.push({
        participanteId: inserted.id,
        nombre: inserted.nombre,
        dni: inserted.dni ?? null
      });
    }

    const seen = new Set<string>();
    resolved.forEach((participante) => {
      const key = `id:${participante.participanteId}`;
      if (seen.has(key)) {
        throw new Error('No puedes añadir el mismo participante más de una vez en la misma inscripción');
      }
      seen.add(key);
    });

    return resolved;
  }, [supabase]);

  const obtenerDescuentosActivosCampamento = useCallback(async (): Promise<DescuentoCatalogo[]> => {
    const { data, error: fetchError } = await supabase
      .from('descuento_catalogo')
      .select('id,codigo,nombre,tipo_valor,valor,scope,acumulable,activo,orden,created_at,updated_at')
      .eq('scope', 'campamento_inscripcion')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return (data ?? []).map((descuento) => ({
      id: descuento.id,
      codigo: descuento.codigo,
      nombre: descuento.nombre,
      tipo_valor: descuento.tipo_valor === 'porcentaje' ? 'porcentaje' : 'importe_fijo',
      valor: Number(descuento.valor ?? 0),
      scope: 'campamento_inscripcion',
      acumulable: descuento.acumulable ?? true,
      activo: descuento.activo ?? true,
      orden: Number(descuento.orden ?? 0),
      created_at: descuento.created_at,
      updated_at: descuento.updated_at
    }));
  }, [supabase]);

  const resolverDescuentosCampamentoSeleccionados = useCallback(async (
    participantes: CampamentoParticipanteInput[]
  ) => {
    const discountIds = Array.from(new Set(
      participantes.flatMap((participante) =>
        (participante.descuentos ?? []).map((descuento) => descuento.descuento_id)
      ).filter((value): value is string => Boolean(value))
    ));

    if (discountIds.length === 0) {
      return new Map<string, DescuentoCatalogo>();
    }

    const { data, error: fetchError } = await supabase
      .from('descuento_catalogo')
      .select('id,codigo,nombre,tipo_valor,valor,scope,acumulable,activo,orden,created_at,updated_at')
      .in('id', discountIds)
      .eq('scope', 'campamento_inscripcion')
      .eq('activo', true);

    if (fetchError) {
      throw fetchError;
    }

    const descuentos = new Map<string, DescuentoCatalogo>();
    (data ?? []).forEach((descuento) => {
      descuentos.set(descuento.id, {
        id: descuento.id,
        codigo: descuento.codigo,
        nombre: descuento.nombre,
        tipo_valor: descuento.tipo_valor === 'porcentaje' ? 'porcentaje' : 'importe_fijo',
        valor: Number(descuento.valor ?? 0),
        scope: 'campamento_inscripcion',
        acumulable: descuento.acumulable ?? true,
        activo: descuento.activo ?? true,
        orden: Number(descuento.orden ?? 0),
        created_at: descuento.created_at,
        updated_at: descuento.updated_at
      });
    });

    if (descuentos.size !== discountIds.length) {
      throw new Error('Alguno de los descuentos seleccionados ya no está disponible.');
    }

    return descuentos;
  }, [supabase]);

  const obtenerParticipantesCampamentoBatch = useCallback(async (reservaIds: string[]) => {
    const participantesPorReserva = new Map<string, CampamentoParticipante[]>();
    if (reservaIds.length === 0) {
      return participantesPorReserva;
    }

    const { data, error: fetchError } = await supabase
      .from('campamento_participante')
      .select(`
        id,
        reserva_id,
        participante_id,
        nombre,
        dni,
        created_at,
        updated_at,
        descuentos:campamento_participante_descuento(
          id,
          campamento_participante_id,
          descuento_id,
          importe_aplicado,
          created_at,
          descuento_catalogo:descuento_catalogo(codigo,nombre,tipo_valor,valor)
        )
      `)
      .in('reserva_id', reservaIds)
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    (data ?? []).forEach((participante) => {
      const current = participantesPorReserva.get(participante.reserva_id) ?? [];
      current.push({
        id: participante.id,
        reserva_id: participante.reserva_id,
        participante_id: participante.participante_id ?? null,
        nombre: participante.nombre,
        dni: participante.dni ?? null,
        descuentos_aplicados: ((participante.descuentos ?? []) as Array<{
          id?: string | null;
          campamento_participante_id?: string | null;
          descuento_id?: string | null;
          importe_aplicado?: number | string | null;
          created_at?: string | null;
          descuento_catalogo?: {
            codigo?: string | null;
            nombre?: string | null;
            tipo_valor?: DescuentoTipoValor | null;
            valor?: number | string | null;
          } | Array<{
            codigo?: string | null;
            nombre?: string | null;
            tipo_valor?: DescuentoTipoValor | null;
            valor?: number | string | null;
          }> | null;
        }>).map(mapCampamentoParticipanteDescuentoRow),
        created_at: participante.created_at,
        updated_at: participante.updated_at
      });
      participantesPorReserva.set(participante.reserva_id, current);
    });

    return participantesPorReserva;
  }, [supabase]);

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
      const tarifasActivas = (actividad.tarifas ?? []).filter((tarifa) => tarifa.activo !== false);
      const duracionesConfiguradas = tarifasActivas
        .map((tarifa) => tarifa.duracionMin)
        .filter((duracion): duracion is number => typeof duracion === 'number' && duracion > 0);
      const modoPrecio =
        actividad.tipo === 'alquiler'
          ? 'fijo'
          : actividad.modoPrecio ?? (
            actividad.tipo === 'campamento' || actividad.tipo === 'curso' || actividad.tipo === 'sport'
              ? 'por_persona'
              : 'fijo'
          );

      const payload = {
        empresa_id: empresa.id,
        codigo: buildNormalizedCode(actividad.nombre),
        nombre: actividad.nombre,
        categoria,
        modo_precio: modoPrecio,
        modo_agenda: actividad.fecha || actividad.horaInicio || actividad.horaFin ? 'sesion_manual' : 'libre',
        reservable: actividad.reserva ?? true,
        activo: true,
        capacidad_max: actividad.numeroPersonas ?? null,
        duracion_minima_min: duracionesConfiguradas.length > 0 ? Math.min(...duracionesConfiguradas) : null,
        duracion_maxima_min: duracionesConfiguradas.length > 0 ? Math.max(...duracionesConfiguradas) : null,
        deposito_permitido: (actividad.precio_reserva ?? 0) > 0,
        deposito_obligatorio: false,
        deposito_default: actividad.precio_reserva ?? 0,
        notas: null
      };

      const { data: servicioInsertado, error: insertError } = await supabase
        .from('servicio')
        .insert([payload])
        .select('id')
        .single();

      if (insertError || !servicioInsertado?.id) {
        return { success: false, message: `Error al crear la actividad: ${insertError?.message ?? 'Sin identificador devuelto'}` };
      }

      if (actividad.inventario) {
        let poolId = actividad.inventario.poolId ?? null;

        if (!poolId && actividad.inventario.codigo) {
          const { data: existingPool, error: poolFetchError } = await supabase
            .from('inventario_pool')
            .select('id')
            .eq('empresa_id', empresa.id)
            .eq('codigo', actividad.inventario.codigo)
            .maybeSingle();

          if (poolFetchError) {
            return { success: false, message: `Error al localizar el pool de inventario: ${poolFetchError.message}` };
          }

          poolId = existingPool?.id ?? null;
        }

        if (!poolId) {
          if (!actividad.inventario.codigo || !actividad.inventario.nombre) {
            return { success: false, message: 'Para crear inventario nuevo debes indicar al menos código y nombre del pool' };
          }

          const { data: newPool, error: poolInsertError } = await supabase
            .from('inventario_pool')
            .insert([
              {
                empresa_id: empresa.id,
                codigo: actividad.inventario.codigo,
                nombre: actividad.inventario.nombre,
                unidad: actividad.inventario.unidad ?? 'unidad',
                cantidad_total: actividad.inventario.cantidadTotal ?? 0,
                activo: actividad.inventario.activo ?? true,
                metadata: actividad.inventario.metadata ?? {}
              }
            ])
            .select('id')
            .single();

          if (poolInsertError || !newPool?.id) {
            return { success: false, message: `Error al crear el pool de inventario: ${poolInsertError?.message ?? 'Sin identificador'}` };
          }

          poolId = newPool.id;
        }

        const { error: linkPoolError } = await supabase.from('servicio_consumo_pool').insert([
          {
            servicio_id: servicioInsertado.id,
            pool_id: poolId,
            consumo_por_unidad: actividad.inventario.consumoPorUnidad ?? 1,
            obligatorio: actividad.inventario.obligatorio ?? true,
            activo: actividad.inventario.activo ?? true
          }
        ]);

        if (linkPoolError) {
          return { success: false, message: `Error al enlazar el inventario con la actividad: ${linkPoolError.message}` };
        }
      }

      if (tarifasActivas.length > 0) {
        const tarifasPayload = tarifasActivas.map((tarifa, index) => {
          const duracionMin = typeof tarifa.duracionMin === 'number' && tarifa.duracionMin > 0
            ? tarifa.duracionMin
            : null;
          const codigoTarifa = tarifa.codigo
            ? buildNormalizedCode(tarifa.codigo)
            : duracionMin
              ? `STD_${duracionMin}M`
              : `STD_${index + 1}`;

          return {
            servicio_id: servicioInsertado.id,
            codigo: codigoTarifa,
            nombre_tarifa: tarifa.nombreTarifa ?? buildTarifaNombreDefault(duracionMin),
            duracion_min: duracionMin,
            precio: tarifa.precio,
            activo: tarifa.activo ?? true,
            metadata: tarifa.metadata ?? {}
          };
        });

        const { error: tarifasInsertError } = await supabase.from('servicio_tarifa').insert(tarifasPayload);

        if (tarifasInsertError) {
          return { success: false, message: `Error al crear las tarifas de la actividad: ${tarifasInsertError.message}` };
        }
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
        const { duracion_valor, duracion_unidad } = mapTarifaDuration({
          duracion_min: tarifa.duracion_min,
          codigo: tarifa.codigo,
          metadata: (tarifa.metadata as Record<string, unknown> | null) ?? {}
        });
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

  const obtenerProgramasCampamento = useCallback(async (): Promise<CampamentoPrograma[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data: programasData, error: programasError } = await supabase
        .from('campamento_programa')
        .select(`
          id,
          servicio_id,
          fecha_inicio,
          fecha_fin,
          dias_semana,
          hora_inicio,
          hora_fin,
          turno_codigo,
          turno_label,
          estado,
          notas,
          created_at,
          updated_at,
          servicio:servicio(codigo,nombre)
        `)
        .order('fecha_inicio', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (programasError) {
        throw programasError;
      }

      const programasBase = (programasData ?? []).map((row) => normalizeCampamentoProgramaRow(row));
      if (programasBase.length === 0) {
        return [];
      }

      const programasIds = programasBase.map((programa) => programa.id);
      const { data: reservasData, error: reservasError } = await supabase
        .from('reserva_servicio')
        .select(`
          id,
          campamento_programa_id,
          total_neto,
          items:reserva_servicio_item(cantidad),
          participantes:campamento_participante(id)
        `)
        .in('campamento_programa_id', programasIds);

      if (reservasError) {
        throw reservasError;
      }

      const resumenPorPrograma = new Map<string, { totalInscripciones: number; totalParticipantes: number; totalFacturado: number }>();
      (reservasData ?? []).forEach((reserva) => {
        const programaId = reserva.campamento_programa_id;
        if (!programaId) return;

        const current = resumenPorPrograma.get(programaId) ?? {
          totalInscripciones: 0,
          totalParticipantes: 0,
          totalFacturado: 0
        };
        const item = Array.isArray(reserva.items) ? reserva.items[0] : reserva.items;
        const participantes = Array.isArray(reserva.participantes) ? reserva.participantes.length : 0;

        current.totalInscripciones += 1;
        current.totalParticipantes += participantes || Number(item?.cantidad ?? 0);
        current.totalFacturado += Number(reserva.total_neto ?? 0);
        resumenPorPrograma.set(programaId, current);
      });

      return programasBase.map((programa) => {
        const resumen = resumenPorPrograma.get(programa.id);
        return {
          ...programa,
          total_inscripciones: resumen?.totalInscripciones ?? 0,
          total_participantes: resumen?.totalParticipantes ?? 0,
          total_facturado: Number((resumen?.totalFacturado ?? 0).toFixed(2))
        };
      });
    } catch (err: unknown) {
      console.error('Error al obtener programas de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener programas de campamento';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const crearProgramaCampamento = async (
    input: CampamentoProgramaInput
  ): Promise<{ success: boolean; message: string; programaId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('campamento_programa')
        .insert([
          {
            servicio_id: input.servicioId,
            fecha_inicio: input.fechaInicio,
            fecha_fin: input.fechaFin,
            dias_semana: input.diasSemana,
            hora_inicio: input.horaInicio,
            hora_fin: input.horaFin,
            turno_codigo: input.turnoCodigo ?? null,
            turno_label: input.turnoLabel ?? null,
            estado: input.estado ?? 'activo',
            notas: input.notas ?? null
          }
        ])
        .select('id')
        .single();

      if (insertError || !data?.id) {
        throw insertError ?? new Error('No se pudo crear el programa de campamento');
      }

      return {
        success: true,
        message: 'Programa de campamento creado correctamente',
        programaId: data.id
      };
    } catch (err: unknown) {
      console.error('Error al crear programa de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear programa de campamento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const actualizarProgramaCampamento = async (
    id: string,
    input: Partial<CampamentoProgramaInput> & { estado?: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (input.servicioId !== undefined) payload.servicio_id = input.servicioId;
      if (input.fechaInicio !== undefined) payload.fecha_inicio = input.fechaInicio;
      if (input.fechaFin !== undefined) payload.fecha_fin = input.fechaFin;
      if (input.diasSemana !== undefined) payload.dias_semana = input.diasSemana;
      if (input.horaInicio !== undefined) payload.hora_inicio = input.horaInicio;
      if (input.horaFin !== undefined) payload.hora_fin = input.horaFin;
      if (input.turnoCodigo !== undefined) payload.turno_codigo = input.turnoCodigo;
      if (input.turnoLabel !== undefined) payload.turno_label = input.turnoLabel;
      if (input.estado !== undefined) payload.estado = input.estado;
      if (input.notas !== undefined) payload.notas = input.notas;

      const { error: updateError } = await supabase
        .from('campamento_programa')
        .update(payload)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      return { success: true, message: 'Programa de campamento actualizado correctamente' };
    } catch (err: unknown) {
      console.error('Error al actualizar programa de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar programa de campamento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerParticipantesCampamento = async (
    reservaId: string
  ): Promise<{ success: boolean; participantes?: CampamentoParticipante[]; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('campamento_participante')
        .select(`
          id,
          reserva_id,
          participante_id,
          nombre,
          dni,
          created_at,
          updated_at,
          descuentos:campamento_participante_descuento(
            id,
            campamento_participante_id,
            descuento_id,
            importe_aplicado,
            created_at,
            descuento_catalogo:descuento_catalogo(codigo,nombre,tipo_valor,valor)
          )
        `)
        .eq('reserva_id', reservaId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return {
        success: true,
        participantes: (data ?? []).map((participante) => ({
          id: participante.id,
          reserva_id: participante.reserva_id,
          participante_id: participante.participante_id ?? null,
          nombre: participante.nombre,
          dni: participante.dni ?? null,
          descuentos_aplicados: ((participante.descuentos ?? []) as Array<{
            id?: string | null;
            campamento_participante_id?: string | null;
            descuento_id?: string | null;
            importe_aplicado?: number | string | null;
            created_at?: string | null;
            descuento_catalogo?: {
              codigo?: string | null;
              nombre?: string | null;
              tipo_valor?: DescuentoTipoValor | null;
              valor?: number | string | null;
            } | Array<{
              codigo?: string | null;
              nombre?: string | null;
              tipo_valor?: DescuentoTipoValor | null;
              valor?: number | string | null;
            }> | null;
          }>).map(mapCampamentoParticipanteDescuentoRow),
          created_at: participante.created_at,
          updated_at: participante.updated_at
        })),
        message: 'Participantes obtenidos correctamente'
      };
    } catch (err: unknown) {
      console.error('Error al obtener participantes de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener participantes del campamento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const actualizarParticipantesCampamento = async (
    reservaId: string,
    participantes: CampamentoParticipanteInput[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('campamento_participante')
        .delete()
        .eq('reserva_id', reservaId);

      if (deleteError) {
        throw deleteError;
      }

      if (participantes.length > 0) {
        const participantesCatalogo = await resolverCatalogoParticipantes(participantes);
        const payload = participantesCatalogo.map((participante) => ({
          reserva_id: reservaId,
          participante_id: participante.participanteId,
          nombre: participante.nombre,
          dni: participante.dni
        }));

        const { error: insertError } = await supabase.from('campamento_participante').insert(payload);
        if (insertError) {
          throw insertError;
        }
      }

      return { success: true, message: 'Participantes actualizados correctamente' };
    } catch (err: unknown) {
      console.error('Error al actualizar participantes de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar participantes del campamento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const obtenerDetalleProgramaCampamento = useCallback(
    async (programaId: string): Promise<{ success: boolean; programa?: CampamentoProgramaDetalle; message: string }> => {
      try {
        setLoading(true);
        setError(null);

        const { data: programaData, error: programaError } = await supabase
          .from('campamento_programa')
          .select(`
            id,
            servicio_id,
            fecha_inicio,
            fecha_fin,
            dias_semana,
            hora_inicio,
            hora_fin,
            turno_codigo,
            turno_label,
            estado,
            notas,
            created_at,
            updated_at,
            servicio:servicio(codigo,nombre)
          `)
          .eq('id', programaId)
          .single();

        if (programaError || !programaData) {
          throw programaError ?? new Error('Programa de campamento no encontrado');
        }

        const programaBase = normalizeCampamentoProgramaRow(programaData);

        const { data: reservasData, error: reservasError } = await supabase
          .from('reserva_servicio')
          .select(`
            id,
            cliente_id,
            campamento_programa_id,
            estado,
            observaciones,
            total_bruto,
            total_descuento,
            total_neto,
            created_at,
            updated_at,
            cliente:cliente(id,nombre,apellidos),
            items:reserva_servicio_item(
              inicio,
              fin,
              cantidad,
              precio_unitario,
              subtotal,
              tarifa_id,
              tarifa:servicio_tarifa(id,codigo,nombre_tarifa)
            )
          `)
          .eq('campamento_programa_id', programaId)
          .order('created_at', { ascending: true });

        if (reservasError) {
          throw reservasError;
        }

        const reservaIds = (reservasData ?? []).map((reserva) => reserva.id);
        const participantesResult = reservaIds.length > 0
          ? await obtenerParticipantesCampamentoBatch(reservaIds)
          : new Map<string, CampamentoParticipante[]>();

        const inscripciones: CampamentoInscripcion[] = (reservasData ?? []).map((reserva) => {
          const clienteRaw = Array.isArray(reserva.cliente) ? reserva.cliente[0] : reserva.cliente;
          const item = Array.isArray(reserva.items) ? reserva.items[0] : reserva.items;
          const tarifaRaw = Array.isArray(item?.tarifa) ? item?.tarifa[0] : item?.tarifa;
          const participantes = participantesResult.get(reserva.id) ?? [];

          return {
            id: reserva.id,
            campamento_programa_id: programaId,
            cliente_id: reserva.cliente_id ?? null,
            cliente: clienteRaw
              ? {
                  id: clienteRaw.id,
                  nombre: clienteRaw.nombre,
                  apellidos: clienteRaw.apellidos
                }
              : undefined,
            fecha_inicio: item?.inicio ?? reserva.created_at,
            fecha_fin: item?.fin ?? reserva.created_at,
            hora_inicio: item?.inicio ?? reserva.created_at,
            hora_fin: item?.fin ?? reserva.created_at,
            tarifa_id: item?.tarifa_id ?? null,
            tarifa_codigo: tarifaRaw?.codigo ?? null,
            tarifa_nombre: tarifaRaw?.nombre_tarifa ?? null,
            cantidad_participantes: Number(item?.cantidad ?? participantes.length ?? 0),
            precio_unitario: Number(item?.precio_unitario ?? 0),
            precio_bruto: Number(reserva.total_bruto ?? item?.subtotal ?? reserva.total_neto ?? 0),
            descuento_total: Number(reserva.total_descuento ?? 0),
            precio_total: Number(reserva.total_neto ?? item?.subtotal ?? 0),
            precio_total_neto: Number(reserva.total_neto ?? item?.subtotal ?? 0),
            estado: reserva.estado,
            nota: reserva.observaciones ?? null,
            participantes,
            created_at: reserva.created_at,
            updated_at: reserva.updated_at
          };
        });

        return {
          success: true,
          programa: {
            ...programaBase,
            total_inscripciones: inscripciones.length,
            total_participantes: inscripciones.reduce((total, inscripcion) => total + inscripcion.cantidad_participantes, 0),
            total_facturado: Number(inscripciones.reduce((total, inscripcion) => total + inscripcion.precio_total, 0).toFixed(2)),
            inscripciones
          },
          message: 'Detalle del programa obtenido correctamente'
        };
      } catch (err: unknown) {
        console.error('Error al obtener detalle del programa de campamento:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al obtener detalle del programa de campamento';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [obtenerParticipantesCampamentoBatch, supabase]
  );

  const crearInscripcionCampamento = async (
    input: CampamentoInscripcionInput
  ): Promise<{ success: boolean; message: string; reservaId?: string; descuentosSnapshot?: PagoDescuentoSnapshotDraft[] }> => {
    try {
      setLoading(true);
      setError(null);

      const totalBruto = roundCampamentoCurrency(input.precioTotal);
      const descuentosCatalogo = await resolverDescuentosCampamentoSeleccionados(input.participantes);
      const participantesCatalogo = input.participantes.length > 0
        ? await resolverCatalogoParticipantes(input.participantes)
        : [];

      const participantesConDescuentos = participantesCatalogo.map((participante, index) => {
        const participanteInput = input.participantes[index];
        const descuentosSeleccionados = participanteInput?.descuentos ?? [];
        const seen = new Set<string>();
        const descuentosAplicados = descuentosSeleccionados.map((descuentoSeleccionado) => {
          if (seen.has(descuentoSeleccionado.descuento_id)) {
            throw new Error(`El participante ${participante.nombre} tiene el mismo descuento seleccionado más de una vez.`);
          }

          seen.add(descuentoSeleccionado.descuento_id);
          const descuento = descuentosCatalogo.get(descuentoSeleccionado.descuento_id);
          if (!descuento) {
            throw new Error(`El descuento seleccionado para ${participante.nombre} ya no está disponible.`);
          }

          return {
            descuento,
            importe_aplicado: calculateCampamentoDiscountAmount(input.precioUnitario, descuento)
          };
        });

        return {
          ...participante,
          descuentosAplicados
        };
      });

      const totalDescuento = roundCampamentoCurrency(
        participantesConDescuentos.reduce(
          (total, participante) => total + participante.descuentosAplicados.reduce((subtotal, descuento) => subtotal + descuento.importe_aplicado, 0),
          0
        )
      );
      const totalNeto = roundCampamentoCurrency(Math.max(totalBruto - totalDescuento, 0));

      const { data: reservaData, error: reservaError } = await supabase
        .from('reserva_servicio')
        .insert([
          {
            empresa_id: input.idEmpresa,
            cliente_id: input.idCliente,
            campamento_programa_id: input.campamentoProgramaId,
            canal: 'backoffice',
            estado: input.estado,
            observaciones: input.nota ?? null,
            total_bruto: totalBruto,
            total_descuento: totalDescuento,
            total_neto: totalNeto,
            deposito_total_requerido: 0,
            deposito_total_cobrado: 0
          }
        ])
        .select('id')
        .single();

      if (reservaError || !reservaData?.id) {
        throw reservaError ?? new Error('No se pudo crear la inscripción del campamento');
      }

      const itemMetadata: ReservaServicioItemMetadata = {
        numero_personas: input.cantidadParticipantes
      };

      const { error: itemError } = await supabase.from('reserva_servicio_item').insert([
        {
          reserva_id: reservaData.id,
          servicio_id: input.idActividad,
          tarifa_id: input.tarifaId,
          inicio: input.fechaInicio,
          fin: input.fechaFin,
          cantidad: input.cantidadParticipantes,
          precio_unitario: input.precioUnitario,
          descuento_unitario: 0,
          subtotal: totalBruto,
          deposito_requerido: 0,
          deposito_cobrado: 0,
          estado: input.estado,
          notas: input.nota ?? null,
          metadata: itemMetadata
        }
      ]);

      if (itemError) {
        await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
        throw itemError;
      }

      let descuentosSnapshot: PagoDescuentoSnapshotDraft[] = [];

      if (participantesConDescuentos.length > 0) {
        const participantesPayload = participantesConDescuentos.map((participante) => ({
          reserva_id: reservaData.id,
          participante_id: participante.participanteId,
          nombre: participante.nombre,
          dni: participante.dni
        }));

        const { data: participantesInsertados, error: participantesError } = await supabase
          .from('campamento_participante')
          .insert(participantesPayload)
          .select('id,reserva_id,participante_id,nombre,dni,created_at,updated_at');

        if (participantesError) {
          await supabase.from('reserva_servicio_item').delete().eq('reserva_id', reservaData.id);
          await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
          throw participantesError;
        }

        const participantesInsertadosPorKey = new Map(
          (participantesInsertados ?? []).map((participante) => [
            buildCampamentoParticipanteLookupKey({
              participanteId: participante.participante_id ?? null,
              nombre: participante.nombre,
              dni: participante.dni ?? null
            }),
            participante
          ])
        );

        const descuentosPayload = participantesConDescuentos.flatMap((participante) => {
          const participanteInsertado = participantesInsertadosPorKey.get(buildCampamentoParticipanteLookupKey({
            participanteId: participante.participanteId,
            nombre: participante.nombre,
            dni: participante.dni
          }));

          if (!participanteInsertado) {
            return [];
          }

          return participante.descuentosAplicados.map((descuentoAplicado) => ({
            campamento_participante_id: participanteInsertado.id,
            descuento_id: descuentoAplicado.descuento.id,
            importe_aplicado: descuentoAplicado.importe_aplicado
          }));
        });

        const totalDescuentosEsperados = participantesConDescuentos.reduce(
          (total, participante) => total + participante.descuentosAplicados.length,
          0
        );

        if (descuentosPayload.length !== totalDescuentosEsperados) {
          await supabase.from('campamento_participante').delete().eq('reserva_id', reservaData.id);
          await supabase.from('reserva_servicio_item').delete().eq('reserva_id', reservaData.id);
          await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
          throw new Error('No se pudieron relacionar todos los participantes con sus descuentos.');
        }

        if (descuentosPayload.length > 0) {
          const { error: descuentosError } = await supabase
            .from('campamento_participante_descuento')
            .insert(descuentosPayload);

          if (descuentosError) {
            await supabase.from('campamento_participante').delete().eq('reserva_id', reservaData.id);
            await supabase.from('reserva_servicio_item').delete().eq('reserva_id', reservaData.id);
            await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
            throw descuentosError;
          }
        }

        descuentosSnapshot = participantesConDescuentos.flatMap((participante) => {
          const participanteInsertado = participantesInsertadosPorKey.get(buildCampamentoParticipanteLookupKey({
            participanteId: participante.participanteId,
            nombre: participante.nombre,
            dni: participante.dni
          }));

          return participante.descuentosAplicados.map((descuentoAplicado) => ({
            reserva_id: reservaData.id,
            campamento_participante_id: participanteInsertado?.id ?? null,
            descuento_id: descuentoAplicado.descuento.id,
            participante_nombre: participante.nombre,
            descuento_nombre: descuentoAplicado.descuento.nombre,
            tipo_valor: descuentoAplicado.descuento.tipo_valor,
            valor_configurado: descuentoAplicado.descuento.valor,
            importe_aplicado: descuentoAplicado.importe_aplicado
          }));
        });
      }

      return {
        success: true,
        message: 'Inscripción de campamento creada correctamente',
        reservaId: reservaData.id,
        descuentosSnapshot
      };
    } catch (err: unknown) {
      console.error('Error al crear inscripción de campamento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la inscripción del campamento';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const crearReserva = async (datosReserva: {
    id_cliente: string | null;
    id_actividad: string;
    id_empresa: string;
    cantidad_reservada: number;
    tarifa_id?: string | null;
    numero_personas?: number;
    precio: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'confirmada' | 'pendiente' | 'completada' | 'cancelada';
    estado_asignacion_tramos?: EstadoAsignacionTramosReserva;
    duracion_total_min?: number | null;
    nota?: string;
    metadata?: ReservaServicioItemMetadata;
    items?: ReservaServicioItemInput[];
  }): Promise<{ success: boolean; message: string; reservaId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const fallbackCantidad = Math.max(1, Number(datosReserva.cantidad_reservada ?? 1));
      const estadoAsignacionTramos = isEstadoAsignacionTramosReserva(datosReserva.estado_asignacion_tramos)
        ? datosReserva.estado_asignacion_tramos
        : 'no_aplica';
      const permiteCabeceraSinItems = estadoAsignacionTramos !== 'no_aplica';
      const rawItems = datosReserva.items && datosReserva.items.length > 0
        ? datosReserva.items
        : permiteCabeceraSinItems
          ? []
          : [{
              inicio: datosReserva.fecha_inicio,
              fin: datosReserva.fecha_fin,
              cantidad: fallbackCantidad,
              subtotal: Number(datosReserva.precio ?? 0),
              tarifa_id: datosReserva.tarifa_id ?? null,
              metadata: datosReserva.metadata
            }];
      const itemsPayload = rawItems.map((item) => {
        const cantidad = Math.max(1, Number(item.cantidad ?? fallbackCantidad));
        const subtotal = Number(item.subtotal ?? 0);
        const metadata: ReservaServicioItemMetadata = {
          ...(datosReserva.metadata ?? {}),
          ...(item.metadata ?? {})
        };

        if (datosReserva.numero_personas && datosReserva.numero_personas > 0) {
          metadata.numero_personas = datosReserva.numero_personas;
        }

        return {
          servicio_id: datosReserva.id_actividad,
          tarifa_id: item.tarifa_id ?? datosReserva.tarifa_id ?? null,
          inicio: item.inicio,
          fin: item.fin,
          cantidad,
          precio_unitario: cantidad > 0 ? Number((subtotal / cantidad).toFixed(2)) : subtotal,
          descuento_unitario: 0,
          subtotal,
          deposito_requerido: 0,
          deposito_cobrado: 0,
          estado: datosReserva.estado,
          notas: datosReserva.nota ?? null,
          metadata
        };
      });
      const precioTotal = Number(
        (itemsPayload.length > 0
          ? itemsPayload.reduce((total, item) => total + Number(item.subtotal ?? 0), 0)
          : Number(datosReserva.precio ?? 0)
        ).toFixed(2)
      );

      const { data: reservaData, error: reservaError } = await supabase
        .from('reserva_servicio')
        .insert([
          {
            empresa_id: datosReserva.id_empresa,
            cliente_id: datosReserva.id_cliente,
            servicio_id: datosReserva.id_actividad,
            tarifa_id: datosReserva.tarifa_id ?? null,
            cantidad_reservada: fallbackCantidad,
            numero_personas_reserva: datosReserva.numero_personas ?? null,
            duracion_total_min: datosReserva.duracion_total_min ?? null,
            estado_asignacion_tramos: estadoAsignacionTramos,
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

      if (itemsPayload.length > 0) {
        const { error: itemError } = await supabase.from('reserva_servicio_item').insert(
          itemsPayload.map((item) => ({
            reserva_id: reservaData.id,
            ...item
          }))
        );

        if (itemError) {
          await supabase.from('reserva_servicio').delete().eq('id', reservaData.id);
          throw itemError;
        }
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
    descuentosSnapshot?: PagoDescuentoSnapshotDraft[];
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

      if (datosPago.descuentosSnapshot && datosPago.descuentosSnapshot.length > 0) {
        const { error: descuentosSnapshotError } = await supabase
          .from('pago_descuento_snapshot')
          .insert(
            datosPago.descuentosSnapshot.map((snapshot) => ({
              pago_id: data.id,
              reserva_id: snapshot.reserva_id,
              campamento_participante_id: snapshot.campamento_participante_id ?? null,
              descuento_id: snapshot.descuento_id ?? null,
              participante_nombre: snapshot.participante_nombre,
              descuento_nombre: snapshot.descuento_nombre,
              tipo_valor: snapshot.tipo_valor,
              valor_configurado: roundCampamentoCurrency(snapshot.valor_configurado),
              importe_aplicado: roundCampamentoCurrency(snapshot.importe_aplicado)
            }))
          );

        if (descuentosSnapshotError) {
          await supabase.from('pago_aplicacion').delete().eq('pago_id', data.id);
          await supabase.from('pago').delete().eq('id', data.id);
          throw descuentosSnapshotError;
        }
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
          campamento_programa_id,
          servicio_id,
          tarifa_id,
          cantidad_reservada,
          numero_personas_reserva,
          duracion_total_min,
          estado_asignacion_tramos,
          estado,
          observaciones,
          total_bruto,
          total_descuento,
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
            precio_unitario,
            subtotal,
            estado,
            tarifa_id,
            metadata,
            servicio:servicio(id, nombre, categoria),
            tarifa:servicio_tarifa(id,codigo,nombre_tarifa)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const servicioIds = Array.from(new Set((data ?? []).map((row) => row.servicio_id).filter((id): id is string => Boolean(id))));
      const { data: serviciosData, error: serviciosError } = servicioIds.length > 0
        ? await supabase
            .from('servicio')
            .select('id, nombre, categoria')
            .in('id', servicioIds)
        : { data: [], error: null };

      if (serviciosError) {
        throw serviciosError;
      }

      const servicioLookup = new Map(
        (serviciosData ?? []).map((servicio) => [
          servicio.id,
          {
            id: servicio.id,
            nombre: servicio.nombre,
            categoria: servicio.categoria
          }
        ])
      );

      const reservasBase: Reserva[] = (data ?? []).map((row) =>
        buildReservaFromRow({
          ...row,
          servicio_cabecera: row.servicio_id ? servicioLookup.get(row.servicio_id) ?? null : null
        })
      );

      const reservas = reservasBase.filter((reserva) => {
        if (!reserva.campamento_programa_id) {
          return true;
        }

        const matchingRow = (data ?? []).find((row) => row.id === reserva.id);
        const firstItem = (matchingRow?.items ?? [])[0];
        const servicioItem = Array.isArray(firstItem?.servicio) ? firstItem.servicio[0] : firstItem?.servicio;
        return servicioItem?.categoria !== 'campamento';
      });

      const programasCampamento = await obtenerProgramasCampamento();
      const programasComoReserva: Reserva[] = programasCampamento.map((programa) => ({
        id: programa.id,
        kind: 'campamento_programa',
        actividad: { nombre: programa.servicio_nombre },
        empresa: { nombre: 'Flecha Extreme' },
        fecha_inicio: `${programa.fecha_inicio}T${programa.hora_inicio}:00`,
        fecha_fin: `${programa.fecha_fin}T${programa.hora_fin}:00`,
        precio: Number(programa.total_facturado ?? 0),
        estado: programa.estado,
        cantidad_reservada: Number(programa.total_inscripciones ?? 0),
        numero_personas_reserva: Number(programa.total_participantes ?? 0),
        nota: programa.notas ?? undefined,
        campamento_programa_id: programa.id,
        campamento_programa: programa,
        total_inscripciones: programa.total_inscripciones ?? 0,
        total_participantes: programa.total_participantes ?? 0
      }));

      return {
        success: true,
        reservas: [...programasComoReserva, ...reservas].sort(
          (left, right) => new Date(right.fecha_inicio).getTime() - new Date(left.fecha_inicio).getTime()
        ),
        message: 'Reservas obtenidas correctamente'
      };
    } catch (err: unknown) {
      console.error('Error al obtener reservas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reservas';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [obtenerProgramasCampamento, supabase]);

  const obtenerReservaPorId = useCallback(async (
    reservaId: string
  ): Promise<{ success: boolean; reserva?: Reserva; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reserva_servicio')
        .select(`
          id,
          cliente_id,
          campamento_programa_id,
          servicio_id,
          tarifa_id,
          cantidad_reservada,
          numero_personas_reserva,
          duracion_total_min,
          estado_asignacion_tramos,
          estado,
          observaciones,
          total_bruto,
          total_descuento,
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
            precio_unitario,
            subtotal,
            estado,
            tarifa_id,
            metadata,
            servicio:servicio(id, nombre, categoria),
            tarifa:servicio_tarifa(id,codigo,nombre_tarifa)
          )
        `)
        .eq('id', reservaId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        return { success: false, message: 'Reserva no encontrada' };
      }

      const servicioLookup = new Map<string, { id: string; nombre: string; categoria: string }>();
      if (data.servicio_id) {
        const { data: servicioData, error: servicioError } = await supabase
          .from('servicio')
          .select('id, nombre, categoria')
          .eq('id', data.servicio_id)
          .maybeSingle();

        if (servicioError) {
          throw servicioError;
        }

        if (servicioData) {
          servicioLookup.set(servicioData.id, {
            id: servicioData.id,
            nombre: servicioData.nombre,
            categoria: servicioData.categoria
          });
        }
      }

      const reserva: Reserva = buildReservaFromRow({
        ...data,
        servicio_cabecera: data.servicio_id ? servicioLookup.get(data.servicio_id) ?? null : null
      });

      return {
        success: true,
        reserva,
        message: 'Reserva obtenida correctamente'
      };
    } catch (err: unknown) {
      console.error('Error al obtener reserva por id:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener reserva por id';
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

  const asignarTramosReservaCurso = async (
    reservaId: string,
    items: ReservaServicioItemInput[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      if (!items.length) {
        throw new Error('Debes indicar al menos un tramo para asignar.');
      }

      const reservaResult = await obtenerReservaPorId(reservaId);
      if (!reservaResult.success || !reservaResult.reserva) {
        throw new Error(reservaResult.message || 'No se pudo cargar la reserva.');
      }

      const reserva = reservaResult.reserva;
      if (reserva.kind === 'campamento_programa') {
        throw new Error('No se pueden asignar tramos a un programa de campamento.');
      }

      if ((reserva.estado_asignacion_tramos ?? 'no_aplica') === 'no_aplica') {
        throw new Error('Esta reserva no admite asignación diferida de tramos.');
      }

      if (!reserva.servicio_id) {
        throw new Error('La reserva no tiene servicio asociado.');
      }

      if (!reserva.duracion_total_min || reserva.duracion_total_min <= 0) {
        throw new Error('La reserva no tiene duración total configurada.');
      }

      const remainingMinutes = Math.max(
        reserva.duracion_restante_min ?? (reserva.duracion_total_min - (reserva.duracion_asignada_min ?? 0)),
        0
      );
      if (remainingMinutes <= 0) {
        throw new Error('La reserva ya tiene todas sus horas asignadas.');
      }

      const existingActiveItems = (reserva.items ?? [])
        .filter((item) => item.estado !== 'cancelada')
        .sort((left, right) => compareIsoDateStrings(left.inicio, right.inicio));

      const normalizedItems = items
        .map((item) => ({
          ...item,
          cantidad: Math.max(1, Number(item.cantidad ?? reserva.cantidad_reservada ?? 1)),
          subtotal: Number(item.subtotal ?? 0),
          tarifa_id: item.tarifa_id ?? reserva.tarifa_id ?? null
        }))
        .sort((left, right) => compareIsoDateStrings(left.inicio, right.inicio));

      let assignedMinutes = 0;
      for (let index = 0; index < normalizedItems.length; index += 1) {
        const item = normalizedItems[index];
        const itemMinutes = calculateReservaItemDurationMinutes(item.inicio, item.fin);

        if (itemMinutes <= 0) {
          throw new Error('Todos los tramos deben tener una duración válida.');
        }

        assignedMinutes += itemMinutes;

        const currentStart = new Date(item.inicio).getTime();
        const currentEnd = new Date(item.fin).getTime();

        if (index > 0) {
          const previousEnd = new Date(normalizedItems[index - 1].fin).getTime();
          if (previousEnd > currentStart) {
            throw new Error('Los nuevos tramos no pueden solaparse entre sí.');
          }
        }

        const overlapsExisting = existingActiveItems.some((existing) => {
          const existingStart = new Date(existing.inicio).getTime();
          const existingEnd = new Date(existing.fin).getTime();
          return currentStart < existingEnd && currentEnd > existingStart;
        });

        if (overlapsExisting) {
          throw new Error('Alguno de los nuevos tramos se solapa con un tramo ya asignado a la reserva.');
        }
      }

      if (assignedMinutes > remainingMinutes) {
        throw new Error('Los tramos seleccionados superan las horas pendientes de la reserva.');
      }

      for (const item of normalizedItems) {
        const { data, error: availabilityError } = await supabase.rpc('rpc_consultar_disponibilidad_servicio', {
          p_servicio_id: reserva.servicio_id,
          p_inicio: item.inicio,
          p_fin: item.fin,
          p_cantidad: item.cantidad
        });

        if (availabilityError) {
          throw availabilityError;
        }

        const availabilityRow = Array.isArray(data) ? data[0] : null;
        if (!availabilityRow?.disponible) {
          throw new Error(`No hay disponibilidad suficiente para el tramo ${new Date(item.inicio).toLocaleString('es-ES')}.`);
        }
      }

      const itemPayload = normalizedItems.map((item) => {
        const itemMinutes = calculateReservaItemDurationMinutes(item.inicio, item.fin);
        const proportionalSubtotal = reserva.duracion_total_min && reserva.duracion_total_min > 0
          ? Number(((reserva.precio * itemMinutes) / reserva.duracion_total_min).toFixed(2))
          : 0;
        const subtotal = Number((item.subtotal > 0 ? item.subtotal : proportionalSubtotal).toFixed(2));
        const metadata: ReservaServicioItemMetadata = {
          ...(item.metadata ?? {})
        };

        if (reserva.numero_personas_reserva && reserva.numero_personas_reserva > 0) {
          metadata.numero_personas = reserva.numero_personas_reserva;
        }

        return {
          reserva_id: reserva.id,
          servicio_id: reserva.servicio_id,
          tarifa_id: reserva.tarifa_id ?? item.tarifa_id ?? null,
          inicio: item.inicio,
          fin: item.fin,
          cantidad: item.cantidad,
          precio_unitario: item.cantidad > 0 ? Number((subtotal / item.cantidad).toFixed(2)) : subtotal,
          descuento_unitario: 0,
          subtotal,
          deposito_requerido: 0,
          deposito_cobrado: 0,
          estado: reserva.estado,
          notas: reserva.nota ?? null,
          metadata
        };
      });

      const { error: insertError } = await supabase.from('reserva_servicio_item').insert(itemPayload);
      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        message: 'Tramos asignados correctamente'
      };
    } catch (err: unknown) {
      console.error('Error al asignar tramos de la reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al asignar tramos de la reserva';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const eliminarTramoReservaCurso = async (
    reservaId: string,
    itemId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data: itemData, error: fetchError } = await supabase
        .from('reserva_servicio_item')
        .select('id,reserva_id,inicio')
        .eq('id', itemId)
        .eq('reserva_id', reservaId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!itemData?.id) {
        throw new Error('El tramo no existe o no pertenece a la reserva.');
      }

      if (!isFutureMadridDay(itemData.inicio)) {
        throw new Error('Solo se pueden eliminar tramos de días posteriores al actual.');
      }

      const { error: deleteError } = await supabase
        .from('reserva_servicio_item')
        .delete()
        .eq('id', itemId)
        .eq('reserva_id', reservaId);

      if (deleteError) {
        throw deleteError;
      }

      return {
        success: true,
        message: 'Tramo eliminado correctamente'
      };
    } catch (err: unknown) {
      console.error('Error al eliminar tramo de la reserva:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el tramo de la reserva';
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
          cliente:cliente(id, nombre, apellidos, email),
          descuentos_snapshot:pago_descuento_snapshot(
            id,
            pago_id,
            reserva_id,
            campamento_participante_id,
            descuento_id,
            participante_nombre,
            descuento_nombre,
            tipo_valor,
            valor_configurado,
            importe_aplicado,
            created_at
          )
        `)
        .eq('origen_tipo', 'reserva')
        .eq('origen_id', reservaId)
        .eq('estado', 'pendiente');

      if (fetchError) {
        throw fetchError;
      }

      return {
        success: true,
        pagos: (data ?? []).map((pago) => ({
          ...pago,
          descuentos_snapshot: ((pago.descuentos_snapshot ?? []) as Array<{
            id?: string | null;
            pago_id?: string | null;
            reserva_id?: string | null;
            campamento_participante_id?: string | null;
            descuento_id?: string | null;
            participante_nombre?: string | null;
            descuento_nombre?: string | null;
            tipo_valor?: DescuentoTipoValor | null;
            valor_configurado?: number | string | null;
            importe_aplicado?: number | string | null;
            created_at?: string | null;
          }>).map(mapPagoDescuentoSnapshotRow)
        })),
        message: 'Pagos pendientes obtenidos correctamente'
      };
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
        .select(`
          *,
          descuentos_snapshot:pago_descuento_snapshot(
            id,
            pago_id,
            reserva_id,
            campamento_participante_id,
            descuento_id,
            participante_nombre,
            descuento_nombre,
            tipo_valor,
            valor_configurado,
            importe_aplicado,
            created_at
          )
        `)
        .eq('origen_tipo', 'reserva')
        .eq('origen_id', reservaId);

      if (fetchError) {
        throw fetchError;
      }

      return {
        success: true,
        pagos: (data ?? []).map((pago) => ({
          ...pago,
          descuentos_snapshot: ((pago.descuentos_snapshot ?? []) as Array<{
            id?: string | null;
            pago_id?: string | null;
            reserva_id?: string | null;
            campamento_participante_id?: string | null;
            descuento_id?: string | null;
            participante_nombre?: string | null;
            descuento_nombre?: string | null;
            tipo_valor?: DescuentoTipoValor | null;
            valor_configurado?: number | string | null;
            importe_aplicado?: number | string | null;
            created_at?: string | null;
          }>).map(mapPagoDescuentoSnapshotRow)
        })),
        message: 'Todos los pagos obtenidos correctamente'
      };
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
            descuentos_snapshot:pago_descuento_snapshot(
              id,
              pago_id,
              reserva_id,
              campamento_participante_id,
              descuento_id,
              participante_nombre,
              descuento_nombre,
              tipo_valor,
              valor_configurado,
              importe_aplicado,
              created_at
            ),
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
            descuentos_snapshot: ((pago.descuentos_snapshot ?? []) as Array<{
              id?: string | null;
              pago_id?: string | null;
              reserva_id?: string | null;
              campamento_participante_id?: string | null;
              descuento_id?: string | null;
              participante_nombre?: string | null;
              descuento_nombre?: string | null;
              tipo_valor?: DescuentoTipoValor | null;
              valor_configurado?: number | string | null;
              importe_aplicado?: number | string | null;
              created_at?: string | null;
            }>).map(mapPagoDescuentoSnapshotRow),
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
    obtenerProgramasCampamento,
    crearProgramaCampamento,
    actualizarProgramaCampamento,
    obtenerDetalleProgramaCampamento,
    obtenerDescuentosActivosCampamento,
    crearInscripcionCampamento,
    obtenerParticipantesCampamento,
    actualizarParticipantesCampamento,
    crearReserva,
    crearPago,
    obtenerIdEmpresa,
    obtenerIdCliente,
    obtenerReservas,
    obtenerReservaPorId,
    actualizarReserva,
    asignarTramosReservaCurso,
    eliminarTramoReservaCurso,
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
