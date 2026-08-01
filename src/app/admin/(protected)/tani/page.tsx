import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type Satir = { ad: string; durum: "ok" | "uyari" | "hata"; deger: string; not?: string };

/**
 * Reads the database twice — once with the admin's session and once with the
 * anonymous key the public site uses — and prints exactly what each one gets
 * back. When published courses fail to appear, this says why instead of
 * leaving an empty page to interpret.
 */
export default async function TaniPage() {
  const admin = await createClient();
  const anon = createPublicClient();

  const {
    data: { user },
  } = await admin.auth.getUser();

  const satirlar: Satir[] = [];

  // --- Oturum ve rol ---
  satirlar.push({
    ad: "Oturum",
    durum: user ? "ok" : "hata",
    deger: user?.email ?? "oturum yok",
  });

  const { data: profil, error: profilHata } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  satirlar.push({
    ad: "profiles.role",
    durum: profil?.role === "admin" ? "ok" : "hata",
    deger: profilHata ? `HATA: ${profilHata.message}` : (profil?.role ?? "kayıt yok"),
    not: profil?.role !== "admin" ? "Admin yazma işlemleri bu yüzden reddedilir." : undefined,
  });

  // is_admin() politikaların kullandığı fonksiyon; profiles.role doğru olsa da
  // bu false dönüyorsa bütün admin yazmaları sessizce engellenir.
  const { data: isAdminSonuc, error: isAdminHata } = await admin.rpc("is_admin");
  satirlar.push({
    ad: "is_admin() fonksiyonu",
    durum: isAdminHata ? "hata" : isAdminSonuc === true ? "ok" : "hata",
    deger: isAdminHata ? `HATA: ${isAdminHata.message}` : String(isAdminSonuc),
    not: isAdminHata?.message.includes("Could not find")
      ? "Fonksiyon yok — ilk migration çalıştırılmamış olabilir."
      : isAdminSonuc === false
        ? "Politikalar admin'i tanımıyor; yazma işlemleri engellenir."
        : undefined,
  });

  // --- Tabloların varlığı (hangi migration'lar uygulanmış) ---
  const tablolar = [
    { ad: "courses", faz: "Başlangıç" },
    { ad: "enrollments", faz: "Faz 1" },
    { ad: "lesson_progress", faz: "Faz 1" },
    { ad: "payments", faz: "Faz 2" },
    { ad: "support_tickets", faz: "Faz 2" },
    { ad: "documents", faz: "Faz 2" },
    { ad: "seanslar", faz: "Faz 2" },
    { ad: "settings", faz: "Faz 2" },
    { ad: "iletisim_mesajlari", faz: "Faz 3" },
    { ad: "yorumlar", faz: "Faz 4" },
    { ad: "referanslar", faz: "Faz 4" },
    { ad: "yasal_sayfalar", faz: "Faz 5" },
    { ad: "marka", faz: "Faz 6" },
    { ad: "gorusmeler", faz: "Faz 7" },
    { ad: "gorusme_ayarlari", faz: "Faz 7" },
  ];

  const tabloDurumu: Satir[] = [];
  for (const t of tablolar) {
    const { error } = await admin.from(t.ad).select("*", { count: "exact", head: true });
    tabloDurumu.push({
      ad: `${t.ad}`,
      durum: error ? "hata" : "ok",
      deger: error ? "YOK" : "var",
      not: error ? `${t.faz} migration'ı çalıştırılmamış` : t.faz,
    });
  }

  // --- Kursları iki farklı kimlikle oku ---
  const { data: adminKurslar, error: adminKursHata } = await admin
    .from("courses")
    .select("slug, durum, sitede_gorunur")
    .order("created_at");

  const { data: anonKurslar, error: anonKursHata } = await anon
    .from("courses")
    .select("slug, durum, sitede_gorunur")
    .order("created_at");

  // Sitenin gerçekten kullandığı sorgu (iç içe modules/lessons dahil).
  const { error: anonTamHata } = await anon
    .from("courses")
    .select("id, slug, baslik, content, modules(sira, baslik, meta, lessons(sira, baslik, sure))")
    .limit(1);

  const yayindaSayisi = (adminKurslar ?? []).filter((c) => c.durum === "yayinda" && c.sitede_gorunur).length;

  const kurs: Satir[] = [
    {
      ad: "Admin oturumuyla okunan kurs",
      durum: adminKursHata ? "hata" : (adminKurslar?.length ?? 0) > 0 ? "ok" : "uyari",
      deger: adminKursHata ? `HATA: ${adminKursHata.message}` : `${adminKurslar?.length ?? 0} kayıt`,
    },
    {
      ad: "Bunlardan yayında + sitede görünür",
      durum: yayindaSayisi > 0 ? "ok" : "uyari",
      deger: `${yayindaSayisi} kayıt`,
      not: yayindaSayisi === 0 ? "Ön yüzde hiçbir eğitim çıkmaz." : undefined,
    },
    {
      ad: "Anonim (ziyaretçi) anahtarıyla okunan kurs",
      durum: anonKursHata ? "hata" : (anonKurslar?.length ?? 0) > 0 ? "ok" : "hata",
      deger: anonKursHata ? `HATA: ${anonKursHata.message}` : `${anonKurslar?.length ?? 0} kayıt`,
      not:
        !anonKursHata && (anonKurslar?.length ?? 0) === 0 && yayindaSayisi > 0
          ? "Yayında kurs var ama ziyaretçi göremiyor — okuma politikası engelliyor."
          : undefined,
    },
    {
      ad: "Sitenin gerçek sorgusu (modüller dahil)",
      durum: anonTamHata ? "hata" : "ok",
      deger: anonTamHata ? `HATA: ${anonTamHata.message}` : "çalışıyor",
      not: anonTamHata ? "Ana sayfa ve /egitimler bu yüzden boş." : undefined,
    },
  ];

  // --- Yazma denemesi (gerçekten değiştirmeden) ---
  let yazmaDurum: Satir;
  const ilkSlug = adminKurslar?.[0]?.slug;
  if (!ilkSlug) {
    yazmaDurum = { ad: "Yazma yetkisi", durum: "uyari", deger: "test edilecek kurs yok" };
  } else {
    // Aynı değeri geri yazar: içerik değişmez, ama RLS engelliyorsa 0 satır döner.
    const mevcut = adminKurslar![0];
    const { data: yazilan, error: yazmaHata } = await admin
      .from("courses")
      .update({ sitede_gorunur: mevcut.sitede_gorunur })
      .eq("slug", ilkSlug)
      .select("slug");

    yazmaDurum = {
      ad: "Yazma yetkisi (zararsız test)",
      durum: yazmaHata ? "hata" : (yazilan?.length ?? 0) > 0 ? "ok" : "hata",
      deger: yazmaHata
        ? `HATA: ${yazmaHata.message}`
        : (yazilan?.length ?? 0) > 0
          ? "yazabiliyor"
          : "0 satır — RLS engelliyor",
      not:
        !yazmaHata && (yazilan?.length ?? 0) === 0
          ? "Admin panelindeki kaydetme/arşivleme bu yüzden hiçbir şey yapmıyor."
          : undefined,
    };
  }

  // --- Görüşme ayarları: admin panelinde kaydedilen değer gerçekten yazıldı mı,
  // ve öğrenci panelinin okuduğu satır bu mu? İkisini de göster.
  const { data: ayarSatir, error: ayarHata } = await admin
    .from("gorusme_ayarlari")
    .select("ucretsiz_hak, ucret, sure_dk, odeme_aciklamasi, aktif, updated_at")
    .maybeSingle();

  const gorusmeTani: Satir[] = [
    {
      ad: "gorusme_ayarlari satırı",
      durum: ayarHata ? "hata" : ayarSatir ? "ok" : "hata",
      deger: ayarHata ? `HATA: ${ayarHata.message}` : ayarSatir ? "okunuyor" : "satır yok",
      not: !ayarHata && !ayarSatir ? "Migration çalıştırılmamış; panel koddaki varsayılanları gösterir." : undefined,
    },
  ];

  if (ayarSatir) {
    gorusmeTani.push(
      { ad: "ucretsiz_hak", durum: "ok", deger: String(ayarSatir.ucretsiz_hak) },
      { ad: "ucret", durum: "ok", deger: String(ayarSatir.ucret) },
      { ad: "sure_dk", durum: "ok", deger: String(ayarSatir.sure_dk) },
      { ad: "aktif", durum: ayarSatir.aktif ? "ok" : "uyari", deger: String(ayarSatir.aktif) },
      {
        ad: "odeme_aciklamasi",
        durum: ayarSatir.odeme_aciklamasi ? "ok" : "uyari",
        deger: ayarSatir.odeme_aciklamasi ? `${ayarSatir.odeme_aciklamasi.length} karakter` : "boş",
        not: ayarSatir.odeme_aciklamasi ? undefined : "Öğrenci ödeme talimatı göremez.",
      },
      {
        ad: "son güncelleme",
        durum: "ok",
        deger: String(ayarSatir.updated_at),
        not: "Kaydet'e bastıktan sonra bu zaman değişmiyorsa yazma işlemi geçmiyor demektir.",
      },
    );

    // Aynı satırı zararsız biçimde geri yaz: RLS engelliyorsa 0 satır döner.
    const { data: ayarYazma, error: ayarYazmaHata } = await admin
      .from("gorusme_ayarlari")
      .update({ ucretsiz_hak: ayarSatir.ucretsiz_hak })
      .eq("id", true)
      .select("id");

    gorusmeTani.push({
      ad: "Ayar yazma yetkisi",
      durum: ayarYazmaHata ? "hata" : (ayarYazma?.length ?? 0) > 0 ? "ok" : "hata",
      deger: ayarYazmaHata
        ? `HATA: ${ayarYazmaHata.message}`
        : (ayarYazma?.length ?? 0) > 0
          ? "yazabiliyor"
          : "0 satır — RLS engelliyor",
      not:
        !ayarYazmaHata && (ayarYazma?.length ?? 0) === 0
          ? "Hak ve ücret ayarları bu yüzden kaydedilmiyor."
          : undefined,
    });
  }

  const env: Satir[] = [
    {
      ad: "NEXT_PUBLIC_SUPABASE_URL",
      durum: process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "hata",
      deger: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "tanımsız",
    },
    {
      ad: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      durum: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "ok" : "hata",
      deger: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12)}… (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} karakter)`
        : "tanımsız",
    },
  ];

  return (
    <main className="p-7 pb-14">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Sistem tanılama
      </h1>
      <p className="mt-[7px] max-w-[680px] text-[14.5px] text-[#5C6273]">
        Veritabanı hem senin oturumunla hem de ziyaretçilerin gördüğü anonim anahtarla okunur. Kırmızı satır varsa
        sorunun kaynağı odur.
      </p>

      <Bolum baslik="Kimlik ve yetki" satirlar={[...satirlar, yazmaDurum]} />
      <Bolum baslik="Eğitim verisi" satirlar={kurs} />
      <Bolum baslik="Görüşme ayarları (öğrenci panelinin okuduğu satır)" satirlar={gorusmeTani} />
      <Bolum baslik="Tablolar (hangi migration uygulanmış)" satirlar={tabloDurumu} />
      <Bolum baslik="Ortam değişkenleri" satirlar={env} />
    </main>
  );
}

function Bolum({ baslik, satirlar }: { baslik: string; satirlar: Satir[] }) {
  const renk = {
    ok: { bg: "rgba(28,86,243,0.1)", fg: "#1C56F3", ikon: "check" as const },
    uyari: { bg: "rgba(201,138,27,0.14)", fg: "#A5711A", ikon: "x" as const },
    hata: { bg: "rgba(217,60,60,0.12)", fg: "#C13333", ikon: "x" as const },
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/8 px-[22px] py-[15px]">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">{baslik}</h2>
      </div>
      {satirlar.map((s, i) => {
        const r = renk[s.durum];
        return (
          <div key={`${s.ad}-${i}`} className="flex flex-wrap items-start gap-4 border-b border-ink/7 px-[22px] py-[13px] last:border-b-0">
            <span
              className="mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full"
              style={{ background: r.bg, color: r.fg }}
            >
              <Icon name={r.ikon} size={11} strokeWidth={2.6} />
            </span>
            <span className="w-[240px] flex-none font-mono text-[12px] text-ink">{s.ad}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] break-words" style={{ color: r.fg }}>
                {s.deger}
              </span>
              {s.not && <span className="mt-[3px] block text-[12.5px] text-[#8A8F9E]">{s.not}</span>}
            </span>
          </div>
        );
      })}
    </section>
  );
}
