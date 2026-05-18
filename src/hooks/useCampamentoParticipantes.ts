import { useCallback, useEffect, useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';
import type { CampamentoParticipanteCatalogo } from '@/lib/campamento';

type MotivoParticipanteDuplicado = 'dni' | 'nombre';

interface ParticipanteDuplicadoResult {
  participante: CampamentoParticipanteCatalogo | null;
  motivo: MotivoParticipanteDuplicado | null;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeName(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeDni(value?: string) {
  return value?.trim().replace(/\s+/g, '').toUpperCase() ?? '';
}

function transformParticipanteRow(row: {
  id: string;
  nombre: string;
  dni?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}): CampamentoParticipanteCatalogo {
  return {
    id: row.id,
    nombre: row.nombre,
    dni: row.dni ?? null,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined
  };
}

export function useCampamentoParticipantes() {
  const [participantes, setParticipantes] = useState<CampamentoParticipanteCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshParticipantes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from('campamento_participante_catalogo')
        .select('id,nombre,dni,created_at,updated_at')
        .order('nombre', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setParticipantes((data ?? []).map(transformParticipanteRow));
    } catch (err) {
      console.error('Error al cargar catálogo de participantes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el catálogo de participantes');
      setParticipantes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshParticipantes();
  }, [refreshParticipantes]);

  const buscarParticipanteDuplicado = useCallback(async (candidate: {
    nombre: string;
    dni?: string;
  }): Promise<ParticipanteDuplicadoResult> => {
    const normalizedNombre = normalizeName(candidate.nombre);
    const normalizedDni = normalizeDni(candidate.dni);

    if (normalizedDni) {
      const duplicateByDni = participantes.find(
        (participante) => normalizeDni(participante.dni ?? undefined) === normalizedDni
      );
      if (duplicateByDni) {
        return { participante: duplicateByDni, motivo: 'dni' };
      }

      const { data: dniData, error: dniError } = await supabaseClient
        .from('campamento_participante_catalogo')
        .select('id,nombre,dni,created_at,updated_at')
        .eq('dni_normalizado', normalizedDni)
        .limit(1);

      if (dniError) {
        throw dniError;
      }

      const duplicated = (dniData ?? []).map(transformParticipanteRow)[0] ?? null;
      if (duplicated) {
        return { participante: duplicated, motivo: 'dni' };
      }
    }

    const duplicateByName = participantes.find(
      (participante) =>
        normalizeName(participante.nombre) === normalizedNombre &&
        normalizeDni(participante.dni ?? undefined) === ''
    );
    if (duplicateByName) {
      return { participante: duplicateByName, motivo: 'nombre' };
    }

    const { data: nombreData, error: nombreError } = await supabaseClient
      .from('campamento_participante_catalogo')
      .select('id,nombre,dni,created_at,updated_at')
      .eq('nombre_normalizado', normalizedNombre)
      .is('dni_normalizado', null)
      .limit(1);

    if (nombreError) {
      throw nombreError;
    }

    const duplicatedByName = (nombreData ?? []).map(transformParticipanteRow)[0] ?? null;
    if (duplicatedByName) {
      return { participante: duplicatedByName, motivo: 'nombre' };
    }

    return { participante: null, motivo: null };
  }, [participantes]);

  const crearParticipante = useCallback(async (input: {
    nombre: string;
    dni?: string;
  }): Promise<{ data: CampamentoParticipanteCatalogo | null; error: unknown }> => {
    try {
      setError(null);
      const duplicate = await buscarParticipanteDuplicado(input);
      if (duplicate.participante) {
        return { data: duplicate.participante, error: null };
      }

      const nombre = normalizeWhitespace(input.nombre);
      const dni = normalizeDni(input.dni);
      const { data, error: insertError } = await supabaseClient
        .from('campamento_participante_catalogo')
        .insert([
          {
            nombre,
            dni: dni || null,
            updated_at: new Date().toISOString()
          }
        ])
        .select('id,nombre,dni,created_at,updated_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      const participante = transformParticipanteRow(data);
      setParticipantes((prev) => [...prev, participante].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      return { data: participante, error: null };
    } catch (err) {
      console.error('Error al crear participante:', err);
      setError(err instanceof Error ? err.message : 'Error al crear participante');
      return { data: null, error: err };
    }
  }, [buscarParticipanteDuplicado]);

  return {
    participantes,
    loading,
    error,
    refreshParticipantes,
    buscarParticipanteDuplicado,
    crearParticipante
  };
}
