import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';
import { Cliente } from '@/shared/types';

type MotivoClienteDuplicado = 'dni' | 'nombre_apellidos';

interface ClienteDuplicadoResult {
  cliente: Cliente | null;
  motivo: MotivoClienteDuplicado | null;
}

interface ClienteCandidate {
  nombre: string;
  apellidos: string;
  dni?: string;
}

interface UseClientesReturn {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  crearCliente: (nuevoCliente: Omit<Cliente, 'id'>) => Promise<{ data: Cliente | null; error: unknown }>;
  actualizarCliente: (id: string, datosActualizados: Partial<Cliente>) => Promise<{ data: Cliente | null; error: unknown }>;
  eliminarCliente: (id: string) => Promise<{ error: unknown }>;
  refreshClientes: () => Promise<void>;
  getCliente: (id: string) => Promise<{ nombre: string; apellidos: string } | null>;
  obtenerClientePorId: (id: string) => Promise<Cliente | null>;
  buscarClienteDuplicado: (candidate: ClienteCandidate, ignoreId?: string) => Promise<ClienteDuplicadoResult>;
  buscarClientes: (termino: string, limite?: number) => Promise<Cliente[]>;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeName(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeDni(value?: string) {
  return value?.trim().toUpperCase() ?? '';
}

function normalizeMovil(value?: string) {
  const normalized = normalizeWhitespace(value ?? '').replace(/\D/g, '');
  return normalized.length > 0 ? normalized : null;
}

function transformClienteRow(cliente: {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  movil: string | number | null;
  dni?: string | null;
  created_at: string;
  notas?: string | null;
}) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    apellidos: cliente.apellidos,
    email: cliente.email,
    movil: String(cliente.movil ?? ''),
    dni: cliente.dni ?? undefined,
    fechaRegistro: cliente.created_at,
    notas: cliente.notas || undefined
  } satisfies Cliente;
}

function getDuplicateErrorMessage(motivo: MotivoClienteDuplicado) {
  return motivo === 'dni'
    ? 'Ya existe un cliente con ese DNI.'
    : 'Ya existe un cliente con el mismo nombre y apellidos.';
}

export function useClientes(options: { eagerLoad?: boolean } = {}): UseClientesReturn {
  const eagerLoad = options.eagerLoad !== false;
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(eagerLoad);
  const [error, setError] = useState<string | null>(null);

  const findLocalDuplicate = useCallback((candidate: ClienteCandidate, ignoreId?: string): ClienteDuplicadoResult => {
    const normalizedNombre = normalizeName(candidate.nombre);
    const normalizedApellidos = normalizeName(candidate.apellidos);
    const normalizedDni = normalizeDni(candidate.dni);

    if (normalizedDni) {
      const duplicateByDni = clientes.find((cliente) => (
        cliente.id !== ignoreId &&
        normalizeDni(cliente.dni) === normalizedDni
      ));

      if (duplicateByDni) {
        return { cliente: duplicateByDni, motivo: 'dni' };
      }
    }

    const duplicateByName = clientes.find((cliente) => (
      cliente.id !== ignoreId &&
      normalizeName(cliente.nombre) === normalizedNombre &&
      normalizeName(cliente.apellidos) === normalizedApellidos
    ));

    if (duplicateByName) {
      return { cliente: duplicateByName, motivo: 'nombre_apellidos' };
    }

    return { cliente: null, motivo: null };
  }, [clientes]);

  const buscarClientes = useCallback(async (termino: string, limite = 10): Promise<Cliente[]> => {
    if (!user || !usuario) return [];

    const normalizedTerm = normalizeWhitespace(termino);
    if (!normalizedTerm) return [];

    const likePattern = `%${normalizedTerm.replace(/[%_]/g, '\\$&')}%`;
    const columns = 'id,nombre,apellidos,email,movil,dni,created_at';

    const [nombreResult, apellidosResult, dniResult] = await Promise.all([
      supabaseClient
        .from('cliente')
        .select(columns)
        .ilike('nombre', likePattern)
        .limit(limite),
      supabaseClient
        .from('cliente')
        .select(columns)
        .ilike('apellidos', likePattern)
        .limit(limite),
      supabaseClient
        .from('cliente')
        .select(columns)
        .ilike('dni', likePattern)
        .limit(limite)
    ]);

    if (nombreResult.error) throw nombreResult.error;
    if (apellidosResult.error) throw apellidosResult.error;
    if (dniResult.error) throw dniResult.error;

    const merged = [...(nombreResult.data ?? []), ...(apellidosResult.data ?? []), ...(dniResult.data ?? [])];
    const unique = new Map<string, Cliente>();

    merged.forEach((cliente) => {
      const transformed = transformClienteRow(cliente);
      unique.set(transformed.id, transformed);
    });

    return [...unique.values()].sort((left, right) => {
      const leftName = `${left.nombre} ${left.apellidos}`.toLowerCase();
      const rightName = `${right.nombre} ${right.apellidos}`.toLowerCase();
      return leftName.localeCompare(rightName, 'es');
    });
  }, [user, usuario]);

  // Función para refrescar los clientes
  const refreshClientes = useCallback(async () => {
    if (!user || !usuario) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('cliente')
        .select('*')
        .throwOnError();

      if (error) throw error;

      const clientesTransformados = (data || []).map(transformClienteRow);
      setClientes(clientesTransformados);
    } catch (err) {
      console.error('Error al refrescar clientes:', err);
      setError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [user, usuario]);

  // Cargar clientes inicialmente
  useEffect(() => {
    if (!eagerLoad) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchClientes = async () => {
      if (!user || !usuario) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        await new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 100);
        });

        const { data, error } = await supabaseClient
          .from('cliente')
          .select('*')
          .throwOnError();

        if (error) throw error;

        if (isMounted) {
          const clientesTransformados = (data || []).map(transformClienteRow);
          setClientes(clientesTransformados);
        }
      } catch (err) {
        console.error('Error al obtener clientes:', err);
        if (isMounted) {
          setError('Error al cargar los clientes');
          setClientes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClientes();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [eagerLoad, user, usuario]);

  const buscarClienteDuplicado = useCallback(async (candidate: ClienteCandidate, ignoreId?: string): Promise<ClienteDuplicadoResult> => {
    const localDuplicate = findLocalDuplicate(candidate, ignoreId);
    if (localDuplicate.cliente) {
      return localDuplicate;
    }

    const normalizedDni = normalizeDni(candidate.dni);
    const normalizedNombre = normalizeWhitespace(candidate.nombre);
    const normalizedApellidos = normalizeWhitespace(candidate.apellidos);

    if (normalizedDni) {
      const { data: dniData, error: dniError } = await supabaseClient
        .from('cliente')
        .select('*')
        .eq('dni', normalizedDni)
        .limit(1);

      if (dniError) {
        throw dniError;
      }

      const duplicatedByDni = (dniData || [])
        .map(transformClienteRow)
        .find((cliente) => cliente.id !== ignoreId);

      if (duplicatedByDni) {
        return { cliente: duplicatedByDni, motivo: 'dni' };
      }
    }

    const { data: nameData, error: nameError } = await supabaseClient
      .from('cliente')
      .select('*')
      .ilike('nombre', normalizedNombre)
      .ilike('apellidos', normalizedApellidos)
      .limit(1);

    if (nameError) {
      throw nameError;
    }

    const duplicatedByName = (nameData || [])
      .map(transformClienteRow)
      .find((cliente) => cliente.id !== ignoreId);

    if (duplicatedByName) {
      return { cliente: duplicatedByName, motivo: 'nombre_apellidos' };
    }

    return { cliente: null, motivo: null };
  }, [findLocalDuplicate]);

  const crearCliente = async (nuevoCliente: Omit<Cliente, 'id'>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const duplicate = await buscarClienteDuplicado({
        nombre: nuevoCliente.nombre,
        apellidos: nuevoCliente.apellidos,
        dni: nuevoCliente.dni
      });

      if (duplicate.cliente && duplicate.motivo) {
        const duplicateError = new Error(getDuplicateErrorMessage(duplicate.motivo));
        setError(duplicateError.message);
        return { data: null, error: duplicateError };
      }

      const { data, error } = await supabaseClient
        .from('cliente')
        .insert([{
          nombre: normalizeWhitespace(nuevoCliente.nombre),
          apellidos: normalizeWhitespace(nuevoCliente.apellidos),
          email: nuevoCliente.email.trim(),
          movil: normalizeMovil(nuevoCliente.movil),
          dni: normalizeDni(nuevoCliente.dni) || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
        .throwOnError();

      if (error) throw error;

      const clienteTransformado = transformClienteRow(data);
      setClientes((prevClientes) => [...prevClientes, clienteTransformado]);
      if (eagerLoad) {
        await refreshClientes();
      }

      return { data: clienteTransformado, error: null };
    } catch (err) {
      console.error('Error al crear el cliente:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el cliente');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const actualizarCliente = async (id: string, datosActualizados: Partial<Cliente>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('cliente')
        .update({
          ...(datosActualizados.nombre && { nombre: datosActualizados.nombre }),
          ...(datosActualizados.apellidos && { apellidos: datosActualizados.apellidos }),
          ...(datosActualizados.email && { email: datosActualizados.email }),
          ...(datosActualizados.movil && { movil: normalizeMovil(datosActualizados.movil) }),
          ...(datosActualizados.dni && { dni: datosActualizados.dni }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
        .throwOnError();

      if (error) throw error;

      const clienteTransformado = transformClienteRow(data);
      setClientes((prevClientes) =>
        prevClientes.map((cliente) =>
          cliente.id === id ? clienteTransformado : cliente
        )
      );

      return { data: clienteTransformado, error: null };
    } catch (err) {
      console.error('Error al actualizar el cliente:', err);
      setError('Error al actualizar el cliente');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const eliminarCliente = async (id: string) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabaseClient
        .from('cliente')
        .delete()
        .eq('id', id)
        .throwOnError();

      if (error) throw error;

      setClientes((prevClientes) => prevClientes.filter((cliente) => cliente.id !== id));

      return { error: null };
    } catch (err) {
      console.error('Error al eliminar el cliente:', err);
      setError('Error al eliminar el cliente');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const getCliente = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('cliente')
        .select('nombre, apellidos')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al obtener el cliente:', err);
      return null;
    }
  }, []);

  const obtenerClientePorId = useCallback(async (id: string): Promise<Cliente | null> => {
    if (!user || !usuario) return null;

    try {
      const { data, error } = await supabaseClient
        .from('cliente')
        .select('id,nombre,apellidos,email,movil,dni,created_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformClienteRow(data);
    } catch (err) {
      console.error('Error al obtener el cliente por ID:', err);
      return null;
    }
  }, [user, usuario]);

  return {
    clientes,
    loading,
    error,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    refreshClientes,
    getCliente,
    obtenerClientePorId,
    buscarClienteDuplicado,
    buscarClientes
  };
}
