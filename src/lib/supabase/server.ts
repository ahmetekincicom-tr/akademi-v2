import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/tipler";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // <Database>: sorgular artık gerçek satır tipini döndürüyor. Öncesinde
  // her sonuç tipsizdi ve kod elle yazılmış `as unknown as` iddialarıyla
  // ilerliyordu — o iddialar derleyici tarafından doğrulanmıyordu.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render — safe to ignore since
            // proxy.ts refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
