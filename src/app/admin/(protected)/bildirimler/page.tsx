import { createClient } from "@/lib/supabase/server";
import { pushYapilandirildiMi } from "@/lib/apns";
import { BildirimGonderim, type PushAlici, type PushGecmis } from "@/components/admin/BildirimGonderim";

export default async function AdminBildirimlerPage() {
  const supabase = await createClient();

  const [{ data: cihazlar }, { data: profiller }, { data: gecmis }] = await Promise.all([
    supabase.from("push_cihazlar").select("user_id, platform, son_gorulme").is("gecersiz_tarihi", null),
    supabase.from("profiles").select("id, ad, soyad, email").neq("role", "admin").order("created_at"),
    supabase
      .from("push_gonderimler")
      .select("id, baslik, govde, cihaz_sayisi, basarili, hata_metni, created_at, hedef_user_id")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const cihazSayisi = new Map<string, number>();
  for (const c of cihazlar ?? []) {
    cihazSayisi.set(c.user_id as string, (cihazSayisi.get(c.user_id as string) ?? 0) + 1);
  }

  const isimler = new Map<string, string>();
  const alicilar: PushAlici[] = (profiller ?? []).map((p) => {
    const isim = [p.ad, p.soyad].filter(Boolean).join(" ") || p.email || "İsimsiz kayıt";
    isimler.set(p.id, isim);
    return { id: p.id, isim, eposta: p.email ?? "", cihaz: cihazSayisi.get(p.id) ?? 0 };
  });

  const kayitlar: PushGecmis[] = (gecmis ?? []).map((g) => ({
    id: g.id,
    baslik: g.baslik,
    govde: g.govde,
    hedef: g.hedef_user_id ? (isimler.get(g.hedef_user_id) ?? "Silinmiş kayıt") : "Tüm öğrenciler",
    cihazSayisi: g.cihaz_sayisi,
    basarili: g.basarili,
    hata: g.hata_metni,
    tarih: g.created_at,
  }));

  return (
    <BildirimGonderim
      alicilar={alicilar}
      gecmis={kayitlar}
      toplamCihaz={cihazlar?.length ?? 0}
      yapilandirildi={pushYapilandirildiMi()}
    />
  );
}
