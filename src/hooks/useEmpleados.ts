import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useUserData } from '@/hooks/useUserData';
import supabaseClient from '@/lib/supabaseClient';

export interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  movil: string;
  dni: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmpleados() {
  const { user } = useUserContext();
  const { usuario } = useUserData();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para refrescar los empleados
  const refreshEmpleados = useCallback(async () => {
    if (!user || !usuario) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('empleado')
        .select('*')
        .throwOnError();

      if (error) throw error;

      setEmpleados(data || []);
    } catch (err) {
      console.error('Error al refrescar empleados:', err);
      setError('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  }, [user, usuario]);

  // Cargar empleados inicialmente
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchEmpleados = async () => {
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
          .from('empleado')
          .select('*')
          .throwOnError();

        if (error) throw error;

        if (isMounted) {
          setEmpleados(data || []);
        }
      } catch (err) {
        console.error('Error al obtener empleados:', err);
        if (isMounted) {
          setError('Error al cargar los empleados');
          setEmpleados([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmpleados();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, usuario]);

  const crearEmpleado = async (nuevoEmpleado: Omit<Empleado, 'id'>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('empleado')
        .insert([{
          nombre: nuevoEmpleado.nombre,
          apellidos: nuevoEmpleado.apellidos,
          email: nuevoEmpleado.email,
          movil: nuevoEmpleado.movil,
          dni: nuevoEmpleado.dni,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
        .throwOnError();

      if (error) throw error;

      // Actualizar la lista de empleados localmente
      setEmpleados(prevEmpleados => [...prevEmpleados, data]);
      
      // Refrescar la lista completa para asegurar consistencia
      await refreshEmpleados();
      
      return { data, error: null };
    } catch (err) {
      console.error('Error al crear el empleado:', err);
      setError('Error al crear el empleado');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const actualizarEmpleado = async (id: string, datosActualizados: Partial<Empleado>) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseClient
        .from('empleado')
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

      // Actualizar la lista de empleados localmente
      setEmpleados(prevEmpleados => 
        prevEmpleados.map(empleado => 
          empleado.id === id ? data : empleado
        )
      );
      
      return { data, error: null };
    } catch (err) {
      console.error('Error al actualizar el empleado:', err);
      setError('Error al actualizar el empleado');
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const eliminarEmpleado = async (id: string) => {
    if (!usuario) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabaseClient
        .from('empleado')
        .delete()
        .eq('id', id)
        .throwOnError();

      if (error) throw error;

      // Actualizar la lista de empleados localmente
      setEmpleados(prevEmpleados => prevEmpleados.filter(empleado => empleado.id !== id));
      
      return { error: null };
    } catch (err) {
      console.error('Error al eliminar el empleado:', err);
      setError('Error al eliminar el empleado');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    empleados,
    loading,
    error,
    crearEmpleado,
    actualizarEmpleado,
    eliminarEmpleado,
    refreshEmpleados
  };
} 