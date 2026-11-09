import { createClient } from '@supabase/supabase-js';

// Keep only printable ASCII. Pasting keys into a settings page can add hidden
// characters (spaces, line breaks, zero-width or "smart" characters) that break
// every request to Supabase.
const clean = (value: string | undefined) => (value || '').replace(/[^\x21-\x7E]/g, '');

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
