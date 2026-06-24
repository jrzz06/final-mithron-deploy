import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabaseCookieOptions, resolveSupabasePublishableKey } from "@/lib/supabase/cookie-config";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabasePublishableKey(),
    {
      cookieOptions: resolveSupabaseCookieOptions()
    }
  );
}
