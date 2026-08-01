"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { istemciBilgisi } from "@/lib/istemci";

/**
 * Records a sign-in. Called right after a successful login, from the server so
 * the IP and location are read from the request rather than accepted from the
 * browser. The user is identified by the session cookie, never by an argument.
 *
 * Failure is swallowed on purpose: a login must not be blocked because the
 * history table is missing or unreachable.
 */
export async function oturumKaydet() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const bilgi = istemciBilgisi(await headers());

    const { error } = await supabase.rpc("oturum_kaydet", {
      p_ip: bilgi.ip,
      p_ulke: bilgi.ulke,
      p_sehir: bilgi.sehir,
      p_bolge: bilgi.bolge,
      p_tarayici: bilgi.tarayici,
      p_isletim_sistemi: bilgi.isletimSistemi,
      p_cihaz: bilgi.cihaz,
    });

    if (error) console.error("[oturum] kayıt yazılamadı:", error.message);
  } catch (e) {
    console.error("[oturum] kayıt sırasında beklenmeyen hata:", e);
  }
}
