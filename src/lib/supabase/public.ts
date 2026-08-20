import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";

// Plain anon-key client for public reads that must work outside request scope
// (generateStaticParams, generateMetadata) where next/headers cookies() is unavailable.
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
