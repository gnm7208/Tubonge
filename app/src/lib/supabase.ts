import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project settings."
  );
}

// Not using the `Database` generic here: hand-written types don't match supabase-js's
// internal shape closely enough for foreign-table embeds (e.g. `select("*, profiles(...)")`)
// to type-check cleanly. `src/lib/database.types.ts` is still used for local casting/typing.
// Swap in `supabase gen types typescript` output once the project is CLI-linked, if desired.
export const supabase = createClient(url, anonKey);
