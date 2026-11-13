const SUPABASE_URL = 'https://nwvsesrnhuhcihftagcp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-tePuMa2rXckjabvey4hWA_dFkB0bJx';

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
};

function headers(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
}

export async function supabaseAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || 'Supabase authentication failed.');
  return data;
}

export async function saveSupabaseSession(session: SupabaseSession) {
  try { localStorage.setItem('gaukripa_supabase_session', JSON.stringify(session)); } catch {}
}

export function getSupabaseSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem('gaukripa_supabase_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSupabaseSession() {
  try { localStorage.removeItem('gaukripa_supabase_session'); } catch {}
}

export async function supabaseRest<T>(table: string, query = '', accessToken?: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: { ...headers(accessToken), Accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Supabase database request failed.');
  return data as T;
}

export async function invokeGauKripaPayments<T>(body: Record<string, unknown>): Promise<T> {
  const session = getSupabaseSession();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gaukripa-payments`, {
    method: 'POST',
    headers: headers(session?.access_token),
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Secure payment request failed.');
  return data as T;
}
