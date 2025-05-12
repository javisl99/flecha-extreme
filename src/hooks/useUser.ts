import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import supabaseClient from '@/lib/supabaseClient';

type AuthError = {
  message: string;
};

type LoginResponse = {
  success: boolean;
  error?: string;
};

// Función para traducir mensajes de error de Supabase
function translateAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Credenciales de acceso inválidas',
    'Email not confirmed': 'Correo electrónico no confirmado',
    'User already registered': 'Usuario ya registrado',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Email format is invalid': 'El formato del correo electrónico es inválido',
    'Rate limit exceeded': 'Límite de intentos excedido',
    'Email/Password combination is incorrect': 'La combinación de correo/contraseña es incorrecta',
    'Email rate limit exceeded': 'Límite de intentos excedido para este correo',
  };

  return errorMap[errorMessage] || errorMessage;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener el usuario actual al iniciar
    async function getInitialUser() {
      try {
        setLoading(true);
        // Obtener la sesión actual
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
          console.error('Error al obtener la sesión:', error);
          return;
        }
        
        setSession(session);
        setUser(session?.user || null);
        
      } catch (error) {
        console.error('Error al inicializar el usuario:', error);
      } finally {
        setLoading(false);
      }
    }

    getInitialUser();

    // Suscribirse a cambios de autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Limpiar la suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para iniciar sesión con email y contraseña
  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email, 
        password
      });

      if (error) {
        throw error;
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      return { 
        success: false, 
        error: translateAuthError(authError.message) || 'Error al iniciar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar un nuevo usuario
  const register = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Si el usuario se ha creado correctamente pero requiere confirmación por email
      if (data.user && !data.session) {
        return { 
          success: true, 
          error: 'Por favor, verifica tu correo electrónico para continuar'
        };
      }

      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      return { 
        success: false, 
        error: translateAuthError(authError.message) || 'Error al registrar el usuario'
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = async (): Promise<LoginResponse> => {
    try {
      setLoading(true);
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      router.push('/login');
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      return { 
        success: false, 
        error: translateAuthError(authError.message) || 'Error al cerrar sesión'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
} 