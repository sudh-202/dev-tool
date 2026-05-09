import { createClient, SupabaseAuthAdapter } from "@neondatabase/neon-js";
import type { Database } from './types';

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || "";
const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL || "";

if (!NEON_AUTH_URL || !NEON_DATA_API_URL) {
  console.warn("Neon is not fully configured. Set VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL in your .env file.");
}

// SupabaseAuthAdapter makes auth calls (.signInWithPassword, .signUp, .getSession, .signOut)
// identical to the Supabase JS client API so no other files need changing.
export const supabase = createClient<Database>({
  auth: { adapter: SupabaseAuthAdapter(), url: NEON_AUTH_URL },
  dataApi: { url: NEON_DATA_API_URL },
});
