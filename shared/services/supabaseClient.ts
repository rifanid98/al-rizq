
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('Supabase Error: VITE_SUPABASE_PROJECT_URL tidak valid atau kosong. Pastikan diawali dengan https://');
}

// Regular client with anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
