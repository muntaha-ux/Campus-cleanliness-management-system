import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

/**
 * Cookie-aware SSR Server Client
 * For Server Components, Server Actions, and Route Handlers.
 * Automatically refreshes auth tokens and propagates authenticated user's JWT.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public credentials in environment variables.');
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handled silently when called from Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // Handled silently when called from Server Components
        }
      },
    },
  });
}
