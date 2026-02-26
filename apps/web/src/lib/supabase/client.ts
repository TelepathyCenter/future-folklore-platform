import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@future-folklore-platform/db';

type DbClient = ReturnType<typeof createBrowserClient<Database>>;

export function createClient(): DbClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
