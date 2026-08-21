import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import type { TabloAdi } from "@/lib/supabase/tipler";
import { Icon } from "@/components/Icon";
import { iyzicoAyari, odemeSorgula } from "@/lib/iyzico";
import { epostaYapilandirildiMi } from "@/lib/eposta";
import { EpostaTesti } from "@/components/admin/EpostaTesti";

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
  /*
    Tablo adları TabloAdi birliğiyle yazılıyor: bir tablo yeniden
    adlandırıldığında ya da silindiğinde tanılama ekranı derlemede kırılıyor.
    Öncesinde düz metindi ve ekran, olmayan bir tabloyu "YOK" diye
    raporlayıp doğru çalışıyormuş gibi görünürdü.
  */
  const tablolar: { ad: TabloAdi; faz: string }[] = [
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
    { ad: "oturum_kayitlari", faz: "Faz 8" },
    { ad: "site_icerik", faz: "Faz 9" },
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

  // --- iyzico ---
  //
  // Sadece "anahtar tanımlı mı" demek yetmiyor: yanlış anahtar da tanımlıdır.
  // Bu yüzden gerçekten iyzico'ya sorulan bir istek atılıyor. Uydurma bir token
  // gönderiyoruz; para hareketi olmuyor ama imzamızın kabul edilip edilmediğini
  // iyzico'nun cevabı söylüyor.
  const iyzicoAyar = iyzicoAyari();
  const iyzico: Satir[] = [
    {
      ad: "IYZICO_API_KEY / SECRET_KEY",
      durum: iyzicoAyar ? "ok" : "hata",
      deger: iyzicoAyar ? "tanımlı" : "tanımsız",
      not: iyzicoAyar ? undefined : "Öğrenci panelinde “Kartla öde” düğmesi hiç görünmez.",
    },
    {
      ad: "IYZICO_ORTAM",
      durum: iyzicoAyar?.canli ? "uyari" : "ok",
      deger: iyzicoAyar?.canli ? "canli — GERÇEK PARA" : "sandbox (test)",
      not: iyzicoAyar?.canli
        ? "Bu ortamda yapılan her ödeme gerçek kartlardan tahsil edilir."
        : "Test kartlarıyla çalışır, gerçek tahsilat yapılmaz.",
    },
  ];

  if (iyzicoAyar) {
    try {
      const deneme = await odemeSorgula(iyzicoAyar, "tani-amacli-gecersiz-token");
      const mesaj = `${deneme.errorCode ?? "-"} · ${deneme.errorMessage ?? deneme.status}`;
      // İmza reddi ile "böyle bir ödeme yok" cevabını ayırmamız gerekiyor:
      // ikincisi bizim için BAŞARI — istek imzalanıp kabul edilmiş demek.
      const imzaSorunu = /imza|signature|api ?key|yetki|authoriz|unauthorized/i.test(
        `${deneme.errorCode ?? ""} ${deneme.errorMessage ?? ""}`,
      );
      iyzico.push({
        ad: "iyzico bağlantısı ve imza",
        durum: imzaSorunu ? "hata" : "ok",
        deger: imzaSorunu ? `REDDEDİLDİ: ${mesaj}` : `çalışıyor (iyzico cevabı: ${mesaj})`,
        not: imzaSorunu
          ? "Anahtarlar yanlış ya da sandbox anahtarı canlı ortama verilmiş. Ödeme başlatılamaz."
          : "Uydurma token'a “bulunamadı” cevabı geldi — istek imzalanıp kabul ediliyor demek.",
      });
    } catch (e) {
      iyzico.push({
        ad: "iyzico bağlantısı ve imza",
        durum: "hata",
        deger: e instanceof Error ? e.message : "bilinmeyen hata",
        not: "iyzico'ya hiç ulaşılamadı; ağ ya da adres sorunu.",
      });
    }
  }

  const { error: denemeTabloHatasi } = await admin
    .from("odeme_denemeleri")
    .select("*", { count: "exact", head: true });
  iyzico.push({
    ad: "odeme_denemeleri tablosu",
    durum: denemeTabloHatasi ? "hata" : "ok",
    deger: denemeTabloHatasi ? "YOK" : "var",
    not: denemeTabloHatasi ? "iyzico migration'ı çalıştırılmamış." : undefined,
  });

  const { error: onlineSutunHatasi } = await admin
    .from("payments")
    .select("online_odeme", { count: "exact", head: true });
  iyzico.push({
    ad: "payments.online_odeme sütunu",
    durum: onlineSutunHatasi ? "hata" : "ok",
    deger: onlineSutunHatasi ? `HATA: ${onlineSutunHatasi.message}` : "var",
    not: onlineSutunHatasi ? "Öğrencinin “Ödemelerim” sayfası bu yüzden hata verir." : undefined,
  });

  // Son denemeler: gerçek bir test ödemesinden sonra ne olduğunu burası söylüyor.
  const { data: sonDenemeler } = await admin
    .from("odeme_denemeleri")
    .select("durum, tutar, taksit, kart_son4, hata_kodu, hata_mesaji, created_at, callback_at")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const d of sonDenemeler ?? []) {
    // callback_at, "baslatildi"nın iki anlamını ayırıyor: öğrenci vazgeçtiyse
    // iyzico bize hiç dönmez; ödeme geçip dönüş kaybolduysa damga vardır.
    const donus = d.callback_at
      ? "iyzico geri döndü"
      : d.durum === "baslatildi"
        ? "iyzico geri DÖNMEDİ"
        : "";
    iyzico.push({
      ad: new Date(d.created_at).toLocaleString("tr-TR"),
      durum: d.durum === "basarili" ? "ok" : d.durum === "basarisiz" ? "hata" : "uyari",
      deger: `${d.durum} · ${d.tutar} ₺${d.kart_son4 ? ` · ****${d.kart_son4}` : ""}${
        d.taksit && d.taksit > 1 ? ` · ${d.taksit} taksit` : ""
      }${donus ? ` · ${donus}` : ""}`,
      not:
        d.hata_mesaji
          ? `${d.hata_kodu ?? ""} ${d.hata_mesaji}`.trim()
          : d.durum === "baslatildi"
            ? "Ödemeler sayfasındaki “iyzico'ya sor” düğmesi sonucu kesinleştirir."
            : undefined,
    });
  }

  if ((sonDenemeler?.length ?? 0) === 0 && !denemeTabloHatasi) {
    iyzico.push({ ad: "Ödeme denemeleri", durum: "uyari", deger: "henüz hiç deneme yok" });
  }

  // --- E-posta bildirimleri ---
  /*
    Zamanlanmış görevler.

    Bu bölüm somut bir arızadan doğdu: bütün HTTP cron görevleri aylarca 401
    aldı ve hiçbir yerde görünmedi. cron.job_run_details "succeeded" yazıyor —
    çünkü net.http_post'un KENDİSİ başarılı; cevabın 401 olduğunu yalnızca
    net._http_response biliyor ve oraya kimse bakmıyordu. Ödeme mutabakatı da
    o görevlerden biriydi.
  */
  const gorevler: Satir[] = [];
  const { data: saglik, error: saglikHatasi } = await admin.rpc("gorev_sagligi");
  const s0 = saglik?.[0];

  if (saglikHatasi || !s0) {
    gorevler.push({
      ad: "Görev çağrıları",
      durum: "uyari",
      deger: saglikHatasi ? `okunamadı: ${saglikHatasi.message}` : "kayıt yok",
      not: "gorev_sagligi() fonksiyonu kurulmamış olabilir.",
    });
  } else if (s0.toplam === 0) {
    gorevler.push({
      ad: "Son 24 saat",
      durum: "uyari",
      deger: "hiç çağrı yok",
      not: "Zamanlayıcı hiç çalışmamış. cron.job listesini kontrol et.",
    });
  } else {
    gorevler.push({
      ad: "Son 24 saatteki çağrılar",
      durum: s0.basarisiz === 0 ? "ok" : s0.basarili === 0 ? "hata" : "uyari",
      deger: `${s0.toplam} çağrı · ${s0.basarili} başarılı · ${s0.basarisiz} başarısız`,
      not:
        s0.basarili === 0
          ? "HİÇBİRİ geçmiyor. 401 ise anahtar ayrışmış: private.gorev_ayarlari ile Vercel'deki GOREV_ANAHTARI aynı olmalı."
          : s0.basarisiz > 0
            ? "Bir kısmı düşüyor; geçici ağ hatası ya da zaman aşımı olabilir."
            : undefined,
    });
    gorevler.push({
      ad: "Son cevap",
      durum: s0.son_durum && s0.son_durum >= 200 && s0.son_durum < 300 ? "ok" : "hata",
      deger: `HTTP ${s0.son_durum ?? "—"}${s0.son_zaman ? ` · ${new Date(s0.son_zaman).toLocaleString("tr-TR")}` : ""}`,
      not: s0.son_durum === 401 ? "Görev anahtarı eşleşmiyor." : undefined,
    });
  }

  const posta: Satir[] = [
    {
      ad: "RESEND_API_KEY",
      durum: process.env.RESEND_API_KEY ? "ok" : "hata",
      deger: process.env.RESEND_API_KEY ? "tanımlı" : "tanımsız",
    },
    {
      ad: "BILDIRIM_GONDEREN",
      durum: process.env.BILDIRIM_GONDEREN ? "ok" : "hata",
      deger: process.env.BILDIRIM_GONDEREN ?? "tanımsız",
      not: "Resend'de doğrulanmış alan adından bir adres olmalı.",
    },
    {
      ad: "BILDIRIM_EPOSTA",
      durum: process.env.BILDIRIM_EPOSTA ? "ok" : "hata",
      deger: process.env.BILDIRIM_EPOSTA ?? "tanımsız",
      not: "Ödeme bildirimlerinin gideceği adres(ler). Virgülle birden çok yazılabilir.",
    },
    {
      ad: "Ödeme bildirimi",
      durum: epostaYapilandirildiMi() ? "ok" : "uyari",
      deger: epostaYapilandirildiMi() ? "açık" : "kapalı",
      not: epostaYapilandirildiMi()
        ? "Kartla ödeme geçtiğinde mail gidiyor. Ödemenin kendisi bundan etkilenmiyor."
        : "Ödemeler normal çalışır, yalnızca bildirim gitmez.",
    },
  ];

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
    <main className="p-4 pb-14 sm:p-7">
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
      <Bolum baslik="Kartla ödeme (iyzico)" satirlar={iyzico} />
      <Bolum baslik="Zamanlanmış görevler" satirlar={gorevler} />
      <Bolum baslik="E-posta bildirimleri" satirlar={posta} alt={<EpostaTesti />} />
      <Bolum baslik="Tablolar (hangi migration uygulanmış)" satirlar={tabloDurumu} />
      <Bolum baslik="Ortam değişkenleri" satirlar={env} />
    </main>
  );
}

function Bolum({
  baslik,
  satirlar,
  alt,
}: {
  baslik: string;
  satirlar: Satir[];
  /** Bölümün altına eklenen eylem alanı (ör. test düğmesi). */
  alt?: React.ReactNode;
}) {
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
            {/* Etiket dar ekranda kendi satırını doldurur, değer alt satıra iner.
                Sabit 240px + flex-1 ikilisinde değer sütunu 22px'e çöküyordu. */}
            <span className="grow basis-[240px] font-mono text-[12px] text-ink sm:grow-0">{s.ad}</span>
            <span className="min-w-0 grow basis-[240px]">
              <span className="block text-[13.5px] break-words" style={{ color: r.fg }}>
                {s.deger}
              </span>
              {s.not && <span className="mt-[3px] block text-[12.5px] text-[#656B7A]">{s.not}</span>}
            </span>
          </div>
        );
      })}
      {alt}
    </section>
  );
}
