import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zksopamdvsgwirwymngm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprc29wYW1kdnNnd2lyd3ltbmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTQwMjksImV4cCI6MjA3ODk3MDAyOX0.BlnHIr4tlcmCxsJJWib1NLSfodwJya6MSe5Jb8MHdyU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

