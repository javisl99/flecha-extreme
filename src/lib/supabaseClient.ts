import { createClient } from '@supabase/supabase-js';

// Las variables de entorno se cargarán en tiempo de construcción en Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan las variables de entorno de Supabase');
}

const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default supabaseClient; 