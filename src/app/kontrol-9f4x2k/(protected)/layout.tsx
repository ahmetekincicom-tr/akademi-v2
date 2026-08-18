import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/kontrol-9f4x2k/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("ad, soyad, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/kontrol-9f4x2k/giris?hata=yetki");
  }

  // Sidebar counters — head-only queries so we fetch counts, not rows.
  const [
    { count: ogrenciSayisi },
    { count: acikTalep },
    { count: bekleyenOdeme },
    { count: videosuzDers },
    { count: okunmamisMesaj },
    { count: bekleyenGorusme },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("durum", "acik"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("durum", "bekliyor"),
    supabase.from("lessons").select("id", { count: "exact", head: true }).is("video_url", null),
    supabase.from("iletisim_mesajlari").select("id", { count: "exact", head: true }).eq("okundu", false),
    supabase
      .from("gorusmeler")
      .select("id", { count: "exact", head: true })
      /*
        Yalnızca 'talep'. 'odeme_bekliyor' artık ödemesi tamamlanmamış bir
        taslak: kişi formu doldurdu ama ödemedi, dolayısıyla yönetimin
        yapacağı bir iş yok. Sayaca dahil edilirse rozet hiç eksilmeyen bir
        gürültüye dönüşüyor.
      */
      .eq("durum", "talep"),
  ]);

  const isim = [profile.ad, profile.soyad].filter(Boolean).join(" ") || profile.email || "Yönetici";

  return (
    <AdminShell
      isim={isim}
      email={profile.email ?? ""}
      sayilar={{
        ogrenci: ogrenciSayisi ?? 0,
        talep: acikTalep ?? 0,
        odeme: bekleyenOdeme ?? 0,
        video: videosuzDers ?? 0,
        mesaj: okunmamisMesaj ?? 0,
        gorusme: bekleyenGorusme ?? 0,
      }}
    >
      {children}
    </AdminShell>
  );
}
