// Hook personalizado para usar Supabase
// Implementación futura para el MVP

import { useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';

export function useSupabase() {
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  // Funciones mockeadas que serán reemplazadas por las reales
  
  return {
    supabase: supabaseClient,
    loading,
    error,
  };
}

export default useSupabase; 