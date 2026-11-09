import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service Role Admin Client
 * Strictly server-only. Bypasses Row-Level Security for system-level operations:
 *  - Writing immutable audit_logs (#87)
 *  - Background auto-dispatch RPC (#41)
 *  - Nightly scoring snapshots (#83-#85)
 *  - Sanitized anonymous issue intake (#30)
 */
export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase Service Role key in environment variables.');
  }

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
