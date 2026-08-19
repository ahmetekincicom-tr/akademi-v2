"use server";

import { createClient } from "@/lib/supabase/server";
import { veriHatasi } from "@/lib/auth-hatalari";

/**
 * Cihazın APNs token'ını kaydeder.
 *
 * Token cihaz başına: aynı öğrenci telefondan ve tabletten girerse iki satır
 * olur. Apple token'ı zaman zaman yeniliyor, o yüzden uygulama her açılışta
 * çağırıyor ve çakışmada son görülme tazeleniyor.
 */
export async function cihazKaydet(token: string, platform: "ios" | "android") {
  const temiz = token.trim();
  // APNs token'ı 64 hex karakter; Android'inki daha uzun ve farklı alfabede.
  if (!temiz || temiz.length > 512) return { error: "Geçersiz cihaz kimliği." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Oturum bulunamadı." };

  const { error } = await supabase.from("push_cihazlar").upsert(
    {
      user_id: user.id,
      token: temiz,
      platform,
      son_gorulme: new Date().toISOString(),
      // Cihaz yeniden kaydolduysa eski "geçersiz" damgası düşmeli.
      gecersiz_tarihi: null,
    },
    { onConflict: "token" },
  );

  if (error) return { error: veriHatasi(error) };
  return {};
}
