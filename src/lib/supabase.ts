import { createClient } from '@supabase/supabase-js';

// Obter variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qipdgnizrolzwxnotgqh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcGRnbml6cm9send4bm90Z3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTM0MzEsImV4cCI6MjA3OTQyOTQzMX0.6gPLUg9N9IpLpJWq_nKno9Y2xkpTk1HKHfJhl6jtcQI';

// Avisar no console se estiver usando valores padrão (desenvolvimento)
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Variáveis de ambiente do Supabase não encontradas. ' +
    'Usando valores padrão. Para produção, configure o arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

