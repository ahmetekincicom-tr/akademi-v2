import { createClient } from "@supabase/supabase-js";

// Plain anon-key client for public reads that must work outside request scope
// (generateStaticParams, generateMetadata) where next/headers cookies() is unavailable.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
