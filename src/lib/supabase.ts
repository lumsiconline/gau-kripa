import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = String((import.meta as any).env?.VITE_SUPABASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = String((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const SUPABASE_FUNCTIONS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';

export function getSupabaseProjectRef(): string {
  if (!SUPABASE_URL) return 'local-mode';
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    return hostname.split('.')[0] || 'supabase';
  } catch {
    return 'supabase';
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
