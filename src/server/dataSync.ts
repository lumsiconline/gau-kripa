import type {
  DbService, DbAstrologer, DbBooking, DbChatSession, DbWallet, DbReview, DbSettings, DbSchema
} from './db';

// Supabase is the production data platform. This module intentionally performs no
// Firebase or Google Cloud calls; browser production APIs write directly to Supabase.
export async function initSupabaseData(_localDb: DbSchema) {}
export async function syncService(_value: DbService) {}
export async function deleteService(_id: string) {}
export async function syncAstrologer(_value: DbAstrologer) {}
export async function syncBooking(_value: DbBooking) {}
export async function syncChatSession(_value: DbChatSession) {}
export async function syncWallet(_value: DbWallet) {}
export async function syncReview(_value: DbReview) {}
export async function deleteReview(_id: string) {}
export async function syncSettings(_value: DbSettings) {}
export async function getSupabaseStats() {
  return {
    connected: false,
    mode: 'supabase_frontend',
    projectId: 'nwvsesrnhuhcihftagcp',
    status: 'Production data reads and writes are handled by Supabase APIs from the website.'
  };
}
