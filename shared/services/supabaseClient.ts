
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_API_KEY || '';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('Supabase Error: VITE_SUPABASE_PROJECT_URL tidak valid atau kosong. Pastikan diawali dengan https://');
}

// Regular client with anon key (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (bypasses RLS) - use only for sync operations
// WARNING: Service role key has full access, use carefully
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : supabase; // Fallback to regular client if no service role key
