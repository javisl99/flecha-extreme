import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';
import { Cliente } from '@/shared/types';

interface UseClientesReturn {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  crearCliente: (nuevoCliente: Omit<Cliente, 'id'>) => Promise<{ data: Cliente | null; error: unknown }>;
  actualizarCliente: (id: string, datosActualizados: Partial<Cliente>) => Promise<{ data: Cliente | null; error: unknown }>;
  eliminarCliente: (id: string) => Promise<{ error: unknown }>;
  refreshClientes: () => Promise<void>;
  getCliente: (id: string) => Promise<{ nombre: string; apellidos: string } | null>;
}

export function useClientes(): UseClientesReturn {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Transformar los datos para que coincidan con la interfaz Cliente
      const clientesTransformados = (data || []).map(cliente => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        email: cliente.email,
        movil: cliente.movil,
        dni: cliente.dni,
        fechaRegistro: cliente.created_at,
        notas: cliente.notas || undefined
      }));

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

        // Añadir un pequeño retraso para evitar problemas de conexión
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 100);
        });

        const { data, error } = await supabaseClient
          .from('cliente')
          .select('*')
          .throwOnError();

        if (error) throw error;

        if (isMounted) {
          // Transformar los datos para que coincidan con la interfaz Cliente
          const clientesTransformados = (data || []).map(cliente => ({
            id: cliente.id,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            email: cliente.email,
            movil: cliente.movil,
            dni: cliente.dni,
            fechaRegistro: cliente.created_at,
            notas: cliente.notas || undefined
          }));

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

  const crearCliente = async (nuevoCliente: Omit<Cliente, 'id'>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('cliente')
        .insert([{
          nombre: nuevoCliente.nombre,
          apellidos: nuevoCliente.apellidos,
          email: nuevoCliente.email,
          movil: nuevoCliente.movil,
          dni: nuevoCliente.dni,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
        .throwOnError();

      if (error) throw error;

      // Transformar el cliente creado
      const clienteTransformado = {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        movil: data.movil,
        dni: data.dni,
        fechaRegistro: data.created_at,
        notas: data.notas || undefined
      };

      // Actualizar la lista de clientes localmente
      setClientes(prevClientes => [...prevClientes, clienteTransformado]);
      
      // Refrescar la lista completa para asegurar consistencia
      await refreshClientes();
      
      return { data: clienteTransformado, error: null };
    } catch (err) {
      console.error('Error al crear el cliente:', err);
      setError('Error al crear el cliente');
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

      // Transformar el cliente actualizado
      const clienteTransformado = {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        movil: data.movil,
        dni: data.dni,
        fechaRegistro: data.created_at,
        notas: data.notas || undefined
      };

      // Actualizar la lista de clientes localmente
      setClientes(prevClientes => 
        prevClientes.map(cliente => 
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

      // Actualizar la lista de clientes localmente
      setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== id));
      
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
    getCliente
  };
} 