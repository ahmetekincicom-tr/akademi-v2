import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";

/**
 * İstek kapsamı dışında (generateStaticParams, generateMetadata) çalışan, anon
 * anahtarlı herkese açık okuma istemcisi — next/headers cookies() burada yok.
 *
 * Env yoksa ÇÖKMEZ. Vercel derlemesi bir kez tam da bu yüzden başarısız oldu:
 * generateStaticParams derleme anında bu istemciyi kuruyor ve o an
 * NEXT_PUBLIC_SUPABASE_URL tanımsızsa createClient "supabaseUrl is required"
 * fırlatıp bütün derlemeyi kırıyordu. Derleme, canlı bir veritabanının
 * erişilebilirliğine bağlı olmamalı: env yoksa yer tutucu bir istemci
 * dönüyoruz, sorgular hataya düşüp [] veriyor (çağıranların hepsi bunu zaten
 * ele alıyor) ve sayfalar çalışma anında (env varken) ISR ile üretiliyor.
 *
 * Not: Bu yalnızca HERKESE AÇIK okuma istemcisi. Yönetim/oturum tarafı ayrı bir
 * istemci (server.ts, cookie'li) kullanıyor ve orada env katı biçimde gerekli.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn(
      "[supabase/public] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY tanımsız — yer tutucu istemci (derleme kırılmasın; sayfalar çalışma anında üretilir).",
    );
    // Yer tutucu: createClient artık fırlatmıyor; sorgular ağ hatasına düşüp
    // [] dönüyor. Gerçek env çalışma anında varsa normal veri gelir.
    return createClient<Database>("https://placeholder.supabase.co", "placeholder-anon-key");
  }

  return createClient<Database>(url, anon);
}
