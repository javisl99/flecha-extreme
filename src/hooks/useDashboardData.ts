import { useEffect, useMemo, useRef, useState } from 'react';
import { useActividades, type Reserva as ActividadReserva } from '@/hooks/useActividades';
import { type PendingBizum, useContabilidad } from '@/hooks/useContabilidad';
import { type PlazaParking, type TipoParking, useParking } from '@/hooks/useParking';
import { useUserData } from '@/hooks/useUserData';
import type { MovimientoContable, ResumenEfeCuenta } from '@/shared/types';

type DatabaseRole = 'admin' | 'fl-admin' | 'fl-empleado';

export interface DashboardReservation {
  id: string;
  activityName: string;
  activityType: string;
  clientName: string;
  start: Date;
  end: Date;
  startTime: string;
  endTime: string;
  people: number;
  status: string;
}

export interface ParkingTypeSummary {
  tipo: TipoParking;
  label: string;
  total: number;
  occupied: number;
  free: number;
}

export interface DashboardParkingSummary {
  total: number;
  occupied: number;
  free: number;
  byType: ParkingTypeSummary[];
}

export type DashboardAccount = ResumenEfeCuenta;
export type DashboardPendingPayment = PendingBizum;

const PARKING_LABELS: Record<TipoParking, string> = {
  embarcacion: 'Zodiaks',
  tabla: 'Tablas',
  kayak: 'Kayaks',
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  actividad: 'Actividad',
  alquiler: 'Alquiler',
  ruta: 'Ruta',
  curso: 'Curso',
  campamento: 'Campamento',
  otro: 'Otros',
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDayBounds(dateKey: string) {
  return {
    start: new Date(`${dateKey}T00:00:00`),
    end: new Date(`${dateKey}T23:59:59.999`),
  };
}

function parseDateTime(value: string) {
  if (!value) return null;
  return new Date(value.includes('T') ? value : `${value}T00:00:00`);
}

function formatTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeStatus(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function isCanceledStatus(value?: string | null) {
  const status = normalizeStatus(value);
  return status === 'cancelada' || status === 'cancelado';
}

function isCompletedStatus(value?: string | null) {
  const status = normalizeStatus(value);
  return status === 'completada' || status === 'completado' || status === 'cerrado';
}

function buildClientName(reserva: ActividadReserva) {
  const fullName = `${reserva.cliente?.nombre ?? ''} ${reserva.cliente?.apellidos ?? ''}`.trim();
  return fullName || 'Cliente sin asignar';
}

function getActivityType(reserva: ActividadReserva) {
  const rawType = reserva.items?.[0]?.servicio_categoria;
  if (rawType && ACTIVITY_TYPE_LABELS[rawType]) {
    return ACTIVITY_TYPE_LABELS[rawType];
  }

  if (reserva.kind === 'campamento_programa') {
    return ACTIVITY_TYPE_LABELS.campamento;
  }

  return ACTIVITY_TYPE_LABELS.actividad;
}

function getReservationIntervals(reserva: ActividadReserva) {
  const itemIntervals = (reserva.items ?? [])
    .map((item) => {
      const start = parseDateTime(item.inicio);
      const end = parseDateTime(item.fin);
      return start && end ? { start, end } : null;
    })
    .filter((interval): interval is { start: Date; end: Date } => Boolean(interval));

  if (itemIntervals.length > 0) {
    return itemIntervals;
  }

  const start = parseDateTime(reserva.fecha_inicio);
  const end = parseDateTime(reserva.fecha_fin);
  return start && end ? [{ start, end }] : [];
}

function intervalTouchesDay(interval: { start: Date; end: Date }, dateKey: string) {
  const bounds = getDayBounds(dateKey);
  return interval.start <= bounds.end && interval.end >= bounds.start;
}

function buildDashboardReservation(
  reserva: ActividadReserva,
  interval: { start: Date; end: Date }
): DashboardReservation {
  return {
    id: reserva.id,
    activityName: reserva.actividad?.nombre ?? 'Actividad sin nombre',
    activityType: getActivityType(reserva),
    clientName: buildClientName(reserva),
    start: interval.start,
    end: interval.end,
    startTime: formatTime(interval.start),
    endTime: formatTime(interval.end),
    people: Number(reserva.numero_personas_reserva ?? reserva.cantidad_reservada ?? 1),
    status: reserva.estado,
  };
}

function buildParkingSummary(plazas: PlazaParking[]): DashboardParkingSummary {
  const activePlazas = plazas.filter((plaza) => plaza.activo !== false);
  const byType = (Object.keys(PARKING_LABELS) as TipoParking[]).map((tipo) => {
    const plazasTipo = activePlazas.filter((plaza) => plaza.tipo === tipo);
    const occupied = plazasTipo.filter((plaza) => plaza.reservada || plaza.disponible === false).length;
    return {
      tipo,
      label: PARKING_LABELS[tipo],
      total: plazasTipo.length,
      occupied,
      free: Math.max(0, plazasTipo.length - occupied),
    };
  });

  const total = activePlazas.length;
  const occupied = byType.reduce((sum, item) => sum + item.occupied, 0);

  return {
    total,
    occupied,
    free: Math.max(0, total - occupied),
    byType,
  };
}

function useMinimumLoadingState(loading: boolean, minDurationMs = 800) {
  const [visibleLoading, setVisibleLoading] = useState(loading);
  const loadingStartedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (loading) {
      if (loadingStartedAtRef.current === null) {
        loadingStartedAtRef.current = Date.now();
      }

      if (!visibleLoading) {
        timeoutRef.current = setTimeout(() => {
          setVisibleLoading(true);
          timeoutRef.current = null;
        }, 0);
      }

      return;
    }

    const startedAt = loadingStartedAtRef.current;
    if (startedAt === null) {
      timeoutRef.current = setTimeout(() => {
        setVisibleLoading(false);
        timeoutRef.current = null;
      }, 0);
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, minDurationMs - elapsed);

    if (remaining === 0) {
      loadingStartedAtRef.current = null;
      timeoutRef.current = setTimeout(() => {
        setVisibleLoading(false);
        timeoutRef.current = null;
      }, 0);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      loadingStartedAtRef.current = null;
      timeoutRef.current = null;
      setVisibleLoading(false);
    }, remaining);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loading, minDurationMs, visibleLoading]);

  return visibleLoading;
}

export function useDashboardData() {
  const { usuario, loading: userLoading, error: userError } = useUserData();
  const {
    loading: accountingLoading,
    error: accountingError,
    pendingBizums,
    getResumenEfeDiario,
  } = useContabilidad();
  const {
    loading: parkingLoading,
    error: parkingError,
    plazas,
    fetchPlazasParking,
  } = useParking();
  const { obtenerReservas, error: reservationsError } = useActividades();

  const [reservas, setReservas] = useState<ActividadReserva[]>([]);
  const [reservasLoading, setReservasLoading] = useState(true);
  const todayKey = useMemo(() => getLocalDateKey(), []);

  useEffect(() => {
    let mounted = true;

    async function loadOperationalData() {
      setReservasLoading(true);

      const [reservasResult] = await Promise.all([
        obtenerReservas(),
        fetchPlazasParking(),
      ]);

      if (!mounted) return;

      if (reservasResult.success && reservasResult.reservas) {
        setReservas(reservasResult.reservas);
      } else {
        setReservas([]);
      }

      setReservasLoading(false);
    }

    void loadOperationalData();

    return () => {
      mounted = false;
    };
  }, [fetchPlazasParking, obtenerReservas]);

  const resumenEfe = useMemo(() => getResumenEfeDiario(todayKey), [getResumenEfeDiario, todayKey]);
  const role = usuario?.rol as DatabaseRole | undefined;
  const hasManagerAccess = role === 'admin' || role === 'fl-admin';

  const visibleAccounts = useMemo(() => {
    const efectivo = resumenEfe.cuentas.find((item) => item.cuenta.codigo === 'efectivo');
    if (hasManagerAccess) {
      return resumenEfe.cuentas;
    }

    return efectivo ? [efectivo] : [];
  }, [hasManagerAccess, resumenEfe.cuentas]);

  const cashAccount = useMemo(
    () => resumenEfe.cuentas.find((item) => item.cuenta.codigo === 'efectivo') ?? visibleAccounts[0] ?? null,
    [resumenEfe.cuentas, visibleAccounts]
  );

  const latestCashMovement = useMemo<MovimientoContable | null>(
    () => cashAccount?.movimientos[0] ?? null,
    [cashAccount]
  );

  const todayReservations = useMemo(() => {
    const now = new Date();

    return reservas
      .flatMap((reserva) => {
        const remainingInterval = getReservationIntervals(reserva).find(
          (interval) => intervalTouchesDay(interval, todayKey) && interval.end > now
        );

        return remainingInterval ? [buildDashboardReservation(reserva, remainingInterval)] : [];
      })
      .sort((left, right) => left.start.getTime() - right.start.getTime());
  }, [reservas, todayKey]);

  const activityProgress = useMemo(() => {
    const reservationsToday = reservas.filter((reserva) =>
      getReservationIntervals(reserva).some((interval) => intervalTouchesDay(interval, todayKey))
    );
    const total = reservationsToday.filter((reserva) => !isCanceledStatus(reserva.estado)).length;
    const completed = reservationsToday.filter((reserva) => isCompletedStatus(reserva.estado)).length;

    return { completed, total };
  }, [reservas, todayKey]);

  const parkingSummary = useMemo(() => buildParkingSummary(plazas), [plazas]);
  const accountingUiLoading = useMinimumLoadingState(accountingLoading);
  const reservationsUiLoading = useMinimumLoadingState(reservasLoading);
  const parkingUiLoading = useMinimumLoadingState(parkingLoading);

  return {
    usuario,
    role,
    hasManagerAccess,
    todayKey,
    loading: userLoading || accountingLoading || reservasLoading || parkingLoading,
    accountingLoading,
    accountingUiLoading,
    reservationsLoading: reservasLoading,
    reservationsUiLoading,
    parkingLoading,
    parkingUiLoading,
    error: userError || accountingError || reservationsError || parkingError,
    accountingError,
    reservationsError,
    parkingError,
    cashAccount,
    latestCashMovement,
    visibleAccounts,
    todayReservations,
    activityProgress,
    parkingSummary,
    pendingPayments: hasManagerAccess ? pendingBizums : [],
  };
}
