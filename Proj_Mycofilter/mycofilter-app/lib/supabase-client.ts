/**
 * Supabase client — browser / server variants with demo fallback.
 *
 * The application is usable in DEMO mode when Supabase credentials are absent.
 * Never expose service-role keys in client-side code.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL'

let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (DEMO_MODE) return null
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }
  return _client
}

export default getSupabaseClient
