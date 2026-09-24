import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { KayitTamamlaFormu } from "@/components/auth/KayitTamamlaFormu";
import { createClient } from "@/lib/supabase/server";
import { getPanelProfile } from "@/lib/panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesabını tamamla",
  robots: { index: false, follow: false },
};

/**
 * Google ile ilk girişte bir kez: ad/soyad, telefon ve onaylar.
 * Panel, onayı olmayan Google hesabını buraya yönlendiriyor (panel/layout.tsx);
 * onayı olan ya da e-postayla kaydolan kişi buraya gelirse panele döner.
 */
export default async function KayitTamamlaPage() {
  const profil = await getPanelProfile();
  if (!profil) redirect("/giris");
  if (!profil.kayitTamamlanmadi) redirect("/panel");

  // Profilde ad yoksa Google'ın verdiği adla doldur (kişi düzeltebilir).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const m = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metin = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const tam = metin(m.full_name) || metin(m.name);
  const parcalar = tam.split(/\s+/).filter(Boolean);
  const ad = profil.ad || metin(m.given_name) || parcalar.slice(0, -1).join(" ") || parcalar[0] || "";
  const soyad = profil.soyad || metin(m.family_name) || (parcalar.length > 1 ? parcalar[parcalar.length - 1] : "");

  return (
    <AuthShell>
      <KayitTamamlaFormu email={profil.email} ad={ad} soyad={soyad} />
    </AuthShell>
  );
}
