import { useState, useEffect } from 'react';
import { useUserContext } from '@/context/UserContext';
import supabaseClient from '@/lib/supabaseClient';

type DatabaseRole = 'admin' | 'fl-admin' | 'fl-empleado';
type DisplayRole = 'Developer' | 'Gerente' | 'Empleado';

type Usuario = {
  id: string;
  nombre: string;
  apellidos: string;
  id_empresa: string;
  rol: DatabaseRole;
  displayRol: DisplayRole;
  email: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

const transformRole = (role: DatabaseRole): DisplayRole => {
  const roleMap: Record<DatabaseRole, DisplayRole> = {
    'admin': 'Developer',
    'fl-admin': 'Gerente',
    'fl-empleado': 'Empleado'
  };
  return roleMap[role];
};

export function useUserData() {
  const { user } = useUserContext();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsuario() {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabaseClient
          .from('usuario')
          .select('*')
          .eq('email', user.email)
          .single();

        if (error) {
          throw error;
        }

        // Transformar el rol antes de guardar los datos
        const usuarioConRolTransformado = {
          ...data,
          displayRol: transformRole(data.rol as DatabaseRole)
        };

        setUsuario(usuarioConRolTransformado);
      } catch (err) {
        console.error('Error al obtener datos del usuario:', err);
        setError('Error al cargar los datos del usuario');
      } finally {
        setLoading(false);
      }
    }

    fetchUsuario();
  }, [user?.email]);

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error('Error al actualizar la contraseña:', err);
      return { 
        success: false, 
        error: 'Error al actualizar la contraseña. Por favor, inténtalo de nuevo.' 
      };
    }
  };

  return {
    usuario,
    loading,
    error,
    updatePassword
  };
} 