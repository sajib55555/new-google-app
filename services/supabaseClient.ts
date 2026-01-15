
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zmpiqfhzsdmtwdbkceko.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcGlxZmh6c2RtdHdkYmtjZWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDYxNTksImV4cCI6MjA4NDA4MjE1OX0.vO4BCKiJvqKKAyveMl0snBNZ2P4Y4ItxRkZZKADKPX4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
