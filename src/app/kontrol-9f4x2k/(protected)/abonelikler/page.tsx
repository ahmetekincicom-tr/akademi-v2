import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { abonelikAyariOku } from "@/lib/abonelik";
import { DURUM_ETIKETI, erisimAcikMi } from "@/lib/abonelik-hesap";
import { iyzicoAyari, iyzicoTestAyari } from "@/lib/iyzico";
import { AbonelikYonetimi, type AbonelikSatiri } from "@/components/admin/AbonelikYonetimi";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminAboneliklerPage() {
  const supabase = await createClient();
  const [ayar, { data }, h] = await Promise.all([
    abonelikAyariOku(supabase),
    supabase
      .from("abonelikler")
      .select(
        "id, kaynak, durum, erisim_bitis, donem_bitis, tutar, test_modu, son_hata, admin_notu, created_at, iyzico_abonelik_kodu, profiles(ad, soyad, email)",
      )
      .order("created_at", { ascending: false })
      .limit(300),
    headers(),
  ]);

  const satirlar: AbonelikSatiri[] = (data ?? []).map((s) => {
    const kisi = s.profiles;
    return {
      id: s.id,
      isim: [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—",
      email: kisi?.email ?? "",
      kaynak: s.kaynak === "yonetici" ? "yonetici" : "iyzico",
      durum: s.durum,
      durumEtiketi: DURUM_ETIKETI[s.durum],
      erisimAcik: erisimAcikMi(s.erisim_bitis),
      erisimBitis: s.erisim_bitis ? tarihBicimi.format(new Date(s.erisim_bitis)) : "—",
      donemBitis: s.donem_bitis ? tarihBicimi.format(new Date(s.donem_bitis)) : "—",
      tutar: s.tutar != null ? Number(s.tutar) : null,
      testModu: s.test_modu,
      sonHata: s.son_hata,
      not: s.admin_notu,
      baslangic: tarihBicimi.format(new Date(s.created_at)),
      iyzicoda: Boolean(s.iyzico_abonelik_kodu),
    };
  });

  // Gerçek (test olmayan) ve izlemesi açık iyzico abonelikleri.
  const gercekAktif = satirlar.filter((s) => s.kaynak === "iyzico" && !s.testModu && s.erisimAcik);
  const aylikGelir = gercekAktif
    .filter((s) => s.durum === "aktif")
    .reduce((t, s) => t + (s.tutar ?? 0), 0);

  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const kok = `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  const canli = iyzicoAyari();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Video aboneliği
      </h1>
      <p className="mt-[7px] max-w-[680px] text-[14.5px] text-[#5C6273]">
        Ders videoları aylık abonelikle açılıyor: eğitime kayıtlı ve aboneliği süren katılımcı izliyor. Birebir seans
        kayıtları abonelikten bağımsız. Kurulum adımları: docs/abonelik.md.
      </p>

      <AbonelikYonetimi
        ayar={ayar}
        satirlar={satirlar}
        ozet={{ aktif: gercekAktif.length, aylikGelir }}
        kurulum={{
          canliAnahtar: Boolean(canli?.canli),
          testAnahtar: iyzicoTestAyari() !== null,
          merchantId: Boolean(process.env.IYZICO_MERCHANT_ID?.trim()),
          bildirimAdresi: `${kok}/api/abonelik/iyzico/bildirim`,
        }}
      />
    </main>
  );
}
