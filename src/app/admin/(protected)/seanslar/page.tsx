import { createClient } from "@/lib/supabase/server";
import { SeansYonetimi, type SeansSatir } from "@/components/admin/SeansYonetimi";

export default async function AdminSeanslarPage() {
  const supabase = await createClient();

  const [{ data: seanslarData }, { data: profiles }, { data: courses }] = await Promise.all([
    supabase
      .from("seanslar")
      .select(
        "id, baslangic, sure_dk, konu, toplanti_link, kayit_link, durum, profiles(ad, soyad, email), courses(baslik)",
      )
      .order("baslangic", { ascending: true }),
    supabase.from("profiles").select("id, ad, soyad, email").order("created_at"),
    supabase.from("courses").select("id, baslik").order("created_at"),
  ]);

  const seanslar: SeansSatir[] = (seanslarData ?? []).map((s) => {
    const kisi = s.profiles as unknown as { ad: string | null; soyad: string | null; email: string | null } | null;
    return {
      id: s.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      program: (s.courses as unknown as { baslik: string } | null)?.baslik ?? "Genel",
      baslangic: s.baslangic,
      sureDk: s.sure_dk,
      konu: s.konu ?? "",
      toplantiLink: s.toplanti_link ?? "",
      kayitLink: s.kayit_link ?? "",
      durum: s.durum,
    };
  });

  return (
    <SeansYonetimi
      seanslar={seanslar}
      ogrenciler={(profiles ?? []).map((p) => ({
        id: p.id,
        ad: [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz",
      }))}
      kurslar={(courses ?? []).map((c) => ({ id: c.id, ad: c.baslik }))}
    />
  );
}
