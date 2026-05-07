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
  buscarClienteDuplicado: (candidate: ClienteCandidate, ignoreId?: string) => Promise<ClienteDuplicadoResult>;
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

function transformClienteRow(cliente: {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  dni?: string | null;
  created_at: string;
  notas?: string | null;
}) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    apellidos: cliente.apellidos,
    email: cliente.email,
    movil: cliente.movil,
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

export function useClientes(): UseClientesReturn {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, [user, usuario]);

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
          movil: nuevoCliente.movil.trim(),
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
      await refreshClientes();

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
          ...(datosActualizados.movil && { movil: datosActualizados.movil }),
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

  return {
    clientes,
    loading,
    error,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    refreshClientes,
    getCliente,
    buscarClienteDuplicado
  };
}
