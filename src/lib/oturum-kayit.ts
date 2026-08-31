import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createClient } from "@/lib/supabase/server";
import { istemciBilgisi } from "@/lib/istemci";

/**
 * Giriş hareketine bir satır yazar.
 *
 * IP ve konum istekten okunuyor, tarayıcıdan gelen bir değerden değil — kimin
 * nereden girdiği, istemcinin söylediği şey olmamalı. Kullanıcı da oturum
 * çerezinden belirleniyor, parametreden değil.
 *
 * `client` parametresi ŞART olduğu bir durum var: doğrulama bağlantısıyla
 * gelen istekte oturum o istek sırasında kuruluyor ve yeni çerezler henüz
 * yanıta yazılmamış oluyor. Yeni bir sunucu istemcisi kurmak, istekteki ESKİ
 * çerezleri okumak demek — yani oturum yokmuş gibi görünür ve kayıt sessizce
 * düşerdi. Oturumu kuran istemcinin kendisi geçiliyor.
 *
 * Hata yutuluyor: giriş, geçmiş tablosu yüzünden engellenmemeli.
 */
export async function oturumKaydiniYaz(client?: SupabaseClient<Database>): Promise<void> {
  try {
    const supabase = client ?? (await createClient());
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const bilgi = istemciBilgisi(await headers());

    /*
      null yerine undefined: RPC parametrelerinin hepsi varsayılan değerli ve
      üretilen tipler onları `string | undefined` olarak veriyor. null
      göndermek de çalışıyordu ama tip artık bunu söylüyor — okunamayan bir
      alan "gönderilmedi" demek, "boş" demek değil.
    */
    const { error } = await supabase.rpc("oturum_kaydet", {
      p_ip: bilgi.ip ?? undefined,
      p_ulke: bilgi.ulke ?? undefined,
      p_sehir: bilgi.sehir ?? undefined,
      p_bolge: bilgi.bolge ?? undefined,
      p_tarayici: bilgi.tarayici ?? undefined,
      p_isletim_sistemi: bilgi.isletimSistemi ?? undefined,
      p_cihaz: bilgi.cihaz ?? undefined,
    });

    if (error) console.error("[oturum] kayıt yazılamadı:", error.message);
  } catch (e) {
    console.error("[oturum] kayıt sırasında beklenmeyen hata:", e);
  }
}
