import { useCallback, useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';
import type { Empleado } from '@/hooks/useEmpleados';
import {
  buildEmptyWeekDays,
  formatDateInputValue,
  getStartOfWeekMonday,
  normalizeTimeValue,
} from '@/lib/empleadoHorarios';

export interface HorarioEmpleadoDia {
  id: string | null;
  semana_empleado_id: string;
  dia_semana: number;
  manana_inicio: string | null;
  manana_fin: string | null;
  tarde_inicio: string | null;
  tarde_fin: string | null;
}

export interface HorarioSemanaEmpleado {
  id: string;
  semana_id: string;
  empleado_id: string;
  orden: number;
  aperturas: number;
  cierres: number;
  horas_fin_semana: number;
  nota: string | null;
  empleado: Empleado;
  dias: HorarioEmpleadoDia[];
}

export interface HorarioSemana {
  id: string;
  semana_inicio: string;
  created_by: string | null;
  updated_by: string | null;
  empleados: HorarioSemanaEmpleado[];
}

interface HorarioSemanaRow {
  id: string;
  semana_inicio: string;
  created_by: string | null;
  updated_by: string | null;
  empleados: Array<{
    id: string;
    semana_id: string;
    empleado_id: string;
    orden: number;
    aperturas: number;
    cierres: number;
    horas_fin_semana: number;
    nota: string | null;
    empleado: Empleado | Empleado[] | null;
    dias: Array<{
      id: string;
      semana_empleado_id: string;
      dia_semana: number;
      manana_inicio: string | null;
      manana_fin: string | null;
      tarde_inicio: string | null;
      tarde_fin: string | null;
    }> | null;
  }> | null;
}

interface CrearSemanaInput {
  semanaInicio: string;
  employeeIds: string[];
  copyFromSemanaInicio?: string;
}

interface ActualizarDiaInput {
  semanaEmpleadoId: string;
  diaSemana: number;
  mananaInicio: string | null;
  mananaFin: string | null;
  tardeInicio: string | null;
  tardeFin: string | null;
}

interface ActualizarResumenSemanaEmpleadoInput {
  semanaEmpleadoId: string;
  aperturas: number;
  cierres: number;
  horasFinSemana: number;
  nota: string | null;
}

interface AgregarEmpleadoASemanaInput {
  semanaId: string;
  empleadoId: string;
}

function normalizeWeekStart(value: string) {
  return formatDateInputValue(getStartOfWeekMonday(value));
}

function hydrateSemana(row: HorarioSemanaRow): HorarioSemana {
  const empleados: HorarioSemanaEmpleado[] = [];

  for (const item of row.empleados || []) {
    const empleado = Array.isArray(item.empleado) ? item.empleado[0] : item.empleado;
    if (!empleado) continue;

    const dayMap = new Map((item.dias || []).map((day) => [day.dia_semana, day]));
    const dias = buildEmptyWeekDays().map((defaultDay) => {
      const existing = dayMap.get(defaultDay.dia_semana);
      return {
        id: existing?.id ?? null,
        semana_empleado_id: item.id,
        dia_semana: defaultDay.dia_semana,
        manana_inicio: normalizeTimeValue(existing?.manana_inicio),
        manana_fin: normalizeTimeValue(existing?.manana_fin),
        tarde_inicio: normalizeTimeValue(existing?.tarde_inicio),
        tarde_fin: normalizeTimeValue(existing?.tarde_fin),
      };
    });

    empleados.push({
      id: item.id,
      semana_id: item.semana_id,
      empleado_id: item.empleado_id,
      orden: item.orden,
      aperturas: item.aperturas,
      cierres: item.cierres,
      horas_fin_semana: Number(item.horas_fin_semana || 0),
      nota: item.nota,
      empleado,
      dias,
    });
  }

  empleados.sort((left, right) => {
    if (left.orden !== right.orden) return left.orden - right.orden;
    return `${left.empleado.nombre} ${left.empleado.apellidos}`.localeCompare(`${right.empleado.nombre} ${right.empleado.apellidos}`, 'es');
  });

  return {
    id: row.id,
    semana_inicio: row.semana_inicio,
    created_by: row.created_by,
    updated_by: row.updated_by,
    empleados,
  };
}

async function insertEmptyDays(semanaEmpleadoIds: string[]) {
  if (!semanaEmpleadoIds.length) return;

  const rows = semanaEmpleadoIds.flatMap((semanaEmpleadoId) =>
    buildEmptyWeekDays().map((day) => ({
      semana_empleado_id: semanaEmpleadoId,
      dia_semana: day.dia_semana,
      manana_inicio: null,
      manana_fin: null,
      tarde_inicio: null,
      tarde_fin: null,
    })),
  );

  const { error } = await supabaseClient.from('empleado_horario_dia').insert(rows);
  if (error) throw error;
}

export function useHorariosEmpleados() {
  const { usuario } = useUserData();
  const [semana, setSemana] = useState<HorarioSemana | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarSemana = useCallback(async (semanaInicio: string) => {
    const normalizedWeekStart = normalizeWeekStart(semanaInicio);

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from('empleado_horario_semana')
        .select(`
          id,
          semana_inicio,
          created_by,
          updated_by,
          empleados:empleado_horario_semana_empleado(
            id,
            semana_id,
            empleado_id,
            orden,
            aperturas,
            cierres,
            horas_fin_semana,
            nota,
            empleado:empleado(
              id,
              nombre,
              apellidos,
              email,
              movil,
              dni,
              created_at,
              updated_at
            ),
            dias:empleado_horario_dia(
              id,
              semana_empleado_id,
              dia_semana,
              manana_inicio,
              manana_fin,
              tarde_inicio,
              tarde_fin
            )
          )
        `)
        .eq('semana_inicio', normalizedWeekStart)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setSemana(null);
        return null;
      }

      const hydrated = hydrateSemana(data as unknown as HorarioSemanaRow);
      setSemana(hydrated);
      return hydrated;
    } catch (err) {
      console.error('Error cargando horarios de empleados:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar los horarios';
      setError(message);
      setSemana(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const crearSemana = useCallback(async ({ semanaInicio, employeeIds, copyFromSemanaInicio }: CrearSemanaInput) => {
    const normalizedWeekStart = normalizeWeekStart(semanaInicio);

    try {
      setSaving(true);
      setError(null);

      if (copyFromSemanaInicio) {
        const normalizedSourceWeekStart = normalizeWeekStart(copyFromSemanaInicio);
        const { error: rpcError } = await supabaseClient.rpc('empleado_horario_copy_week', {
          p_source_week_start: normalizedSourceWeekStart,
          p_target_week_start: normalizedWeekStart,
        });

        if (rpcError) throw rpcError;
        return await cargarSemana(normalizedWeekStart);
      }

      const { data: semanaData, error: insertSemanaError } = await supabaseClient
        .from('empleado_horario_semana')
        .insert({
          semana_inicio: normalizedWeekStart,
          created_by: usuario?.id ?? null,
          updated_by: usuario?.id ?? null,
        })
        .select('id')
        .single();

      if (insertSemanaError) throw insertSemanaError;

      if (employeeIds.length) {
        const { data: semanaEmpleados, error: insertEmployeesError } = await supabaseClient
          .from('empleado_horario_semana_empleado')
          .insert(
            employeeIds.map((empleadoId, index) => ({
              semana_id: semanaData.id,
              empleado_id: empleadoId,
              orden: index,
            })),
          )
          .select('id');

        if (insertEmployeesError) throw insertEmployeesError;
        await insertEmptyDays((semanaEmpleados || []).map((item) => item.id));
      }

      return await cargarSemana(normalizedWeekStart);
    } catch (err) {
      console.error('Error creando semana de horarios:', err);
      const message = err instanceof Error ? err.message : 'Error al crear la semana';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarSemana, usuario?.id]);

  const actualizarDia = useCallback(async ({
    semanaEmpleadoId,
    diaSemana,
    mananaInicio,
    mananaFin,
    tardeInicio,
    tardeFin,
  }: ActualizarDiaInput) => {
    const nextValues = {
      manana_inicio: normalizeTimeValue(mananaInicio),
      manana_fin: normalizeTimeValue(mananaFin),
      tarde_inicio: normalizeTimeValue(tardeInicio),
      tarde_fin: normalizeTimeValue(tardeFin),
    };

    const previousSemana = semana;
    setSemana((current) => {
      if (!current) return current;
      return {
        ...current,
        empleados: current.empleados.map((empleado) => {
          if (empleado.id !== semanaEmpleadoId) return empleado;
          return {
            ...empleado,
            dias: empleado.dias.map((day) => (
              day.dia_semana === diaSemana
                ? { ...day, ...nextValues }
                : day
            )),
          };
        }),
      };
    });

    try {
      setSaving(true);
      setError(null);

      const { error: upsertError } = await supabaseClient
        .from('empleado_horario_dia')
        .upsert({
          semana_empleado_id: semanaEmpleadoId,
          dia_semana: diaSemana,
          ...nextValues,
        }, {
          onConflict: 'semana_empleado_id,dia_semana',
        });

      if (upsertError) throw upsertError;
    } catch (err) {
      console.error('Error actualizando dia de horario:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el dia';
      setError(message);
      setSemana(previousSemana);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [semana]);

  const actualizarResumenSemanaEmpleado = useCallback(async ({
    semanaEmpleadoId,
    aperturas,
    cierres,
    horasFinSemana,
    nota,
  }: ActualizarResumenSemanaEmpleadoInput) => {
    const previousSemana = semana;
    setSemana((current) => {
      if (!current) return current;
      return {
        ...current,
        empleados: current.empleados.map((empleado) => (
          empleado.id === semanaEmpleadoId
            ? {
                ...empleado,
                aperturas,
                cierres,
                horas_fin_semana: horasFinSemana,
                nota,
              }
            : empleado
        )),
      };
    });

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabaseClient
        .from('empleado_horario_semana_empleado')
        .update({
          aperturas,
          cierres,
          horas_fin_semana: horasFinSemana,
          nota,
        })
        .eq('id', semanaEmpleadoId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error actualizando resumen del empleado:', err);
      const message = err instanceof Error ? err.message : 'Error al actualizar el resumen';
      setError(message);
      setSemana(previousSemana);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [semana]);

  const agregarEmpleadoASemana = useCallback(async ({ semanaId, empleadoId }: AgregarEmpleadoASemanaInput) => {
    try {
      setSaving(true);
      setError(null);

      const nextOrder = semana?.empleados.length ?? 0;
      const { data, error: insertError } = await supabaseClient
        .from('empleado_horario_semana_empleado')
        .insert({
          semana_id: semanaId,
          empleado_id: empleadoId,
          orden: nextOrder,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      await insertEmptyDays([data.id]);

      if (semana?.semana_inicio) {
        return await cargarSemana(semana.semana_inicio);
      }

      return null;
    } catch (err) {
      console.error('Error agregando empleado a la semana:', err);
      const message = err instanceof Error ? err.message : 'Error al agregar el empleado';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cargarSemana, semana]);

  const eliminarEmpleadoDeSemana = useCallback(async (semanaEmpleadoId: string) => {
    const previousSemana = semana;
    setSemana((current) => {
      if (!current) return current;
      return {
        ...current,
        empleados: current.empleados.filter((empleado) => empleado.id !== semanaEmpleadoId),
      };
    });

    try {
      setSaving(true);
      setError(null);

      const { error: deleteError } = await supabaseClient
        .from('empleado_horario_semana_empleado')
        .delete()
        .eq('id', semanaEmpleadoId);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error eliminando empleado de la semana:', err);
      const message = err instanceof Error ? err.message : 'Error al eliminar el empleado de la semana';
      setError(message);
      setSemana(previousSemana);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [semana]);

  return {
    semana,
    loading,
    saving,
    error,
    cargarSemana,
    crearSemana,
    actualizarDia,
    actualizarResumenSemanaEmpleado,
    agregarEmpleadoASemana,
    eliminarEmpleadoDeSemana,
  };
}
