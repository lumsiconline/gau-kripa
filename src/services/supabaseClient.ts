import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_PUBLISHABLE_KEY, supabase } from '../lib/supabase';

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

export async function getValidSupabaseSession(): Promise<SupabaseSession | null> {
  let current = getSupabaseSession();
  if (!current && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        current = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.session.user.id,
            email: data.session.user.email,
            user_metadata: data.session.user.user_metadata
          }
        };
        await saveSupabaseSession(current);
      }
    } catch {}
  }
  if (!current) return null;
  if (!current.expires_at || current.expires_at * 1000 > Date.now() + 60_000) return current;
  if (!current.refresh_token) {
    clearSupabaseSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: current.refresh_token })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    clearSupabaseSession();
    throw new Error('Your session expired. Please sign in again.');
  }
  await saveSupabaseSession(data as SupabaseSession);
  return data as SupabaseSession;
}

export function clearSupabaseSession() {
  try { localStorage.removeItem('gaukripa_supabase_session'); } catch {}
}

export async function supabaseRest<T>(table: string, query = '', accessToken?: string): Promise<T> {
  let session: SupabaseSession | null = null;
  try { session = await getValidSupabaseSession(); } catch {}
  const authToken = session?.access_token || accessToken;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    headers: { ...headers(authToken), Accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Supabase database request failed.');
  return data as T;
}

export async function invokeGauKripaPayments<T>(body: Record<string, unknown>): Promise<T> {
  const session = await getValidSupabaseSession();
  if (!session?.access_token) throw new Error('Your session has expired. Please Log Out and Sign In again to continue.');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gaukripa-payments`, {
    method: 'POST',
    headers: headers(session.access_token),
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Secure payment request failed (HTTP ${response.status}).`);
  return data as T;
}

export async function supabaseMutation<T>(
  table: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  query: string,
  body?: unknown
): Promise<T> {
  const session = await getValidSupabaseSession();
  if (!session?.access_token) throw new Error('Please sign in with an administrator account.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      ...headers(session.access_token),
      Prefer: 'return=representation'
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.details || data.error || 'Supabase update failed. Check administrator permissions.');
  return data as T;
}

export async function invokeGauKripaChat<T>(body: Record<string, unknown>): Promise<T> {
  const session = await getValidSupabaseSession();
  if (!session?.access_token) throw new Error('Please sign in to use live chat.');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/gaukripa-chat`, {
    method: 'POST',
    headers: headers(session.access_token),
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Live chat request failed (HTTP ${response.status}).`);
  return data as T;
}

export async function uploadGauKripaMedia(file: File): Promise<string> {
  const session = await getValidSupabaseSession();
  if (!session?.access_token) throw new Error('Please sign in with an administrator account before uploading media.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'upload';
  const path = `admin/${session.user.id}/${Date.now()}-${safeName}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/gaukripa-media/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false'
    },
    body: file
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'Media upload failed.');
  return `${SUPABASE_URL}/storage/v1/object/public/gaukripa-media/${path.split('/').map(encodeURIComponent).join('/')}`;
}
