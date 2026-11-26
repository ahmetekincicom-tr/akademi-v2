import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { OgrenciDavet, type DavetAdayi } from "@/components/admin/OgrenciDavet";

export const dynamic = "force-dynamic";

/** listUsers sayfa boyu (Supabase üst sınırı 1000). */
const SAYFA = 1000;

/**
 * Hesap daveti: hiç giriş yapmamış hesaplar.
 *
 * "Son giriş" ve "davet gönderildi" bilgisi profiles'ta değil auth.users'ta
 * duruyor; o yüzden liste servis anahtarıyla yönetim API'sinden okunuyor.
 * Sayfanın kendisi (protected) düzeninin yönetici kontrolünün arkasında.
 */
export default async function OgrenciDavetPage() {
  const supabase = await createClient();
  const yonetim = gorevIstemcisi();

  if (!yonetim) {
    return <OgrenciDavet adaylar={[]} hata="SUPABASE_SERVICE_ROLE_KEY tanımlı değil." />;
  }

  const kullanicilar: {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    app_metadata: Record<string, unknown>;
  }[] = [];
  for (let sayfa = 1; sayfa <= 50; sayfa++) {
    const { data, error } = await yonetim.auth.admin.listUsers({ page: sayfa, perPage: SAYFA });
    if (error) return <OgrenciDavet adaylar={[]} hata={`Hesaplar okunamadı: ${error.message}`} />;
    kullanicilar.push(...data.users);
    if (data.users.length < SAYFA) break;
  }

  const { data: profiller } = await supabase.from("profiles").select("id, ad, soyad, role, silme_talebi_tarihi");
  const profil = new Map((profiller ?? []).map((p) => [p.id, p]));

  const adaylar: DavetAdayi[] = kullanicilar
    .filter((k) => k.email && !k.last_sign_in_at)
    .filter((k) => {
      const p = profil.get(k.id);
      // Yöneticiler ve silinmeyi bekleyen hesaplar listede yok.
      return p?.role !== "admin" && !p?.silme_talebi_tarihi;
    })
    .map((k) => {
      const p = profil.get(k.id);
      const davet = (k.app_metadata?.davet ?? null) as { son?: string; sayi?: number } | null;
      return {
        id: k.id,
        ad: [p?.ad, p?.soyad].filter(Boolean).join(" ") || null,
        eposta: k.email!,
        olusturma: k.created_at,
        dogrulanmis: Boolean(k.email_confirmed_at),
        sonDavet: davet?.son ?? null,
        davetSayisi: davet?.sayi ?? 0,
      };
    })
    .sort((a, b) => (a.ad ?? a.eposta).localeCompare(b.ad ?? b.eposta, "tr"));

  return <OgrenciDavet adaylar={adaylar} />;
}
