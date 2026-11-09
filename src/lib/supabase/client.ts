import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Browser Client Singleton
 * Used strictly for client-side Realtime subscriptions ('postgres_changes') and Storage uploads.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public credentials in environment variables.');
  }

  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}
