"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBildirim } from "@/components/Bildirim";
import { createClient } from "@/lib/supabase/client";
import { depoUrl } from "@/lib/depo";
import { slugYap } from "@/lib/duyuru";
import { ZenginEditor } from "@/components/admin/ZenginEditor";
import { YonlendirmeKarariPenceresi } from "@/components/admin/YonlendirmeKarari";
import { SurumGecmisi } from "@/components/admin/SurumGecmisi";
import { SeoKarti, YayinKontrolListesi, YayinKontrolPenceresi } from "@/components/admin/BlogSeoPaneli";
import { gorunenBaslik, seoAnalizEt, turkceKatla } from "@/lib/blog-seo-analiz";
import { eksikKontroller, yayinKontrolleri } from "@/lib/blog-yayin-kontrol";
import { etiketleriAyir, etiketleriDuzenle, etiketleriTopla } from "@/lib/blog-etiket";
import { KapakSecici } from "@/components/admin/BlogKapakSecici";
import { EtiketAlani } from "@/components/admin/BlogEtiketAlani";
import { BlogKapak } from "@/components/blog/BlogKapak";
import {
  saveYazi,
  silYazi,
  kategoriEkle,
  type YonlendirmeKarari,
  type YaziSurumu,
} from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import {
  taslakAnahtar,
  taslakOku,
  taslakYaz,
  taslakSil,
  taslakDegerli,
  taslakNispiZaman,
  type BlogTaslak,
  type TaslakAlanlar,
} from "@/lib/blog-taslak";
import type { Yazi, Kategori, IcLinkHedef, YaziDurum, YaziSeoOzeti } from "@/lib/yazilar";

const ETIKET = "font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase";
const GIRDI =
  "h-[46px] w-full rounded-[10px] border border-ink/14 bg-white px-[14px] text-[15px] text-ink outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(28,86,243,0.14)]";

/** ISO tarihi datetime-local girdisinin beklediği "YYYY-MM-DDTHH:mm" biçimine. */
function isoDanYerel(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/*
  Zamanlı yayın saati TÜRKİYE SAATİYLE giriliyor ve öyle gösteriliyor,
  tarayıcının saat diliminden bağımsız: yurt dışında açılan bir panelde
  "09:00" yazmak başka bir saate zamanlamasın. Türkiye 2016'dan beri sabit
  UTC+3 (yaz saati yok).
*/
const TR_OFSET = "+03:00";

/** ISO → Türkiye saatiyle "YYYY-MM-DDTHH:mm". */
function isoDanTrYerel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 3_600_000);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
}

/** Türkiye saatiyle "YYYY-MM-DDTHH:mm" → ISO. */
function trYereldenIso(yerel: string): string | null {
  if (!yerel) return null;
  const d = new Date(`${yerel}:00${TR_OFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function YaziEditoru({
  mevcut,
  varsayilanYazar,
  kategoriler = [],
  icHedefler = [],
  digerYazilar = [],
}: {
  mevcut?: Yazi | null;
  varsayilanYazar?: string;
  kategoriler?: Kategori[];
  icHedefler?: IcLinkHedef[];
  /** Odak kelime çakışması ve etiket önerisi için (bu yazı da içinde olabilir). */
  digerYazilar?: YaziSeoOzeti[];
}) {
  const bildir = useBildirim();

  const [baslik, setBaslik] = useState(mevcut?.baslik ?? "");
  const [slug, setSlug] = useState(mevcut?.slug ?? "");
  const [slugElle, setSlugElle] = useState(Boolean(mevcut));
  const [ozet, setOzet] = useState(mevcut?.ozet ?? "");
  const [kapakYol, setKapakYol] = useState<string | null>(mevcut?.kapakYol ?? null);
  const [durum, setDurum] = useState<YaziDurum>(mevcut?.durum ?? "taslak");
  const [yayinYerel, setYayinYerel] = useState(isoDanYerel(mevcut?.yayinTarihi ?? null));
  const [zamanYerel, setZamanYerel] = useState(isoDanTrYerel(mevcut?.zamanlananTarih ?? null));
  // Yayındaki yazı yayından kalkarken ya da silinirken açılan karar penceresi.
  const [karar, setKarar] = useState<null | "kaydet" | "sil">(null);
  const [seoBaslik, setSeoBaslik] = useState(mevcut?.seoBaslik ?? "");
  const [seoAciklama, setSeoAciklama] = useState(mevcut?.seoAciklama ?? "");
  const [yazar, setYazar] = useState(mevcut?.yazar || varsayilanYazar || "");
  const [kategoriId, setKategoriId] = useState<string>(mevcut?.kategoriId ?? "");
  const [kategoriListe, setKategoriListe] = useState<Kategori[]>(kategoriler);
  const [etiketMetni, setEtiketMetni] = useState((mevcut?.etiketler ?? []).join(", "));
  const [odakKelime, setOdakKelime] = useState(mevcut?.odakKelime ?? "");
  const [kapakTon, setKapakTon] = useState<string | null>(mevcut?.kapakTon ?? null);
  const [kapakSimge, setKapakSimge] = useState<string | null>(mevcut?.kapakSimge ?? null);
  const [kapakAlt, setKapakAlt] = useState(mevcut?.kapakAlt ?? "");
  // Yayına alırken eksikler penceresi (lib/blog-yayin-kontrol).
  const [kontrolAcik, setKontrolAcik] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kapakYukleniyor, setKapakYukleniyor] = useState(false);
  // Var olan yazıyı düzenlerken: bu kayıt içeriğin güncellenme tarihini
  // değiştirsin mi? Varsayılan kapalı — her save'de dateModified ilerlemesin.
  const [icerikGuncellendi, setIcerikGuncellendi] = useState(false);

  const yeniKategori = async () => {
    const ad = window.prompt("Yeni kategori adı:");
    if (!ad || !ad.trim()) return;
    const r = await kategoriEkle(ad.trim());
    if (r.error || !r.id) return bildir.hata(r.error ?? "Kategori eklenemedi.");
    setKategoriListe((l) => [...l, { id: r.id!, slug: "", ad: ad.trim() }]);
    setKategoriId(r.id);
    bildir.basarili("Kategori eklendi.");
  };

  // İçerik her tuşta ref'e yazılıyor; state yapılsaydı tüm form yeniden çizilirdi.
  const icerik = useRef<{ html: string; json: unknown }>({
    html: mevcut?.icerikHtml ?? "",
    json: mevcut?.icerikJson ?? null,
  });
  // SEO analizi için içeriğin gecikmeli kopyası: her tuşta değil, yazmaya ara
  // verilince (600 ms) yeniden hesaplanıyor.
  const [analizIcerik, setAnalizIcerik] = useState(mevcut?.icerikHtml ?? "");
  const analizZamanlayici = useRef<number | null>(null);
  const analiziPlanla = useCallback((html: string) => {
    if (analizZamanlayici.current) window.clearTimeout(analizZamanlayici.current);
    analizZamanlayici.current = window.setTimeout(() => setAnalizIcerik(html), 600);
  }, []);

  /* --------------------------------------------------- SEO ve kontroller --- */
  const ayniKelime = useMemo(() => {
    const k = turkceKatla(odakKelime.trim());
    if (!k) return [];
    return digerYazilar.filter((y) => y.id !== mevcut?.id && turkceKatla(y.odakKelime.trim()) === k);
  }, [odakKelime, digerYazilar, mevcut?.id]);

  const analiz = useMemo(
    () =>
      seoAnalizEt({
        odakKelime,
        baslik,
        seoBaslik,
        seoAciklama,
        ozet,
        slug,
        icerik: analizIcerik,
        kapakVar: Boolean(kapakYol),
        kapakAlt: kapakAlt || baslik,
        ayniKelime,
      }),
    [odakKelime, baslik, seoBaslik, seoAciklama, ozet, slug, analizIcerik, kapakYol, kapakAlt, ayniKelime],
  );

  const kontroller = useMemo(
    () =>
      yayinKontrolleri({
        baslik,
        ozet,
        seoAciklama,
        icerik: analizIcerik,
        kategoriVar: Boolean(kategoriId),
        kapakVar: Boolean(kapakYol),
        kapakAlt,
        odakKelime,
        ayniKelime: ayniKelime.map((y) => y.baslik),
      }),
    [baslik, ozet, seoAciklama, analizIcerik, kategoriId, kapakYol, kapakAlt, odakKelime, ayniKelime],
  );

  /* -------------------------------------------------- otomatik kaydetme --- */
  // Yerel taslak: her düzenlemede (debounce) localStorage'a yazılır; çökme/PC
  // kapanması sonrası "kaldığın yerden devam" sağlar. Sunucuya kayıt akışı
  // (Kaydet) değişmez.
  const anahtar = useMemo(() => taslakAnahtar(mevcut?.id), [mevcut?.id]);
  const [otoAktif, setOtoAktif] = useState(false); // banner çözülene kadar yazma
  const [taslakUyari, setTaslakUyari] = useState<BlogTaslak | null>(null);
  const [sonKayit, setSonKayit] = useState<number | null>(null);
  const [geriYukleIcerik, setGeriYukleIcerik] = useState<{ html: string; json: unknown } | null>(null);

  // Debounce yazıcısının okuyacağı güncel alan aynası (her render sonrası
  // tazeleniyor; tuş başına state güncellemeden içerik referansıyla birlikte
  // okunabilsin diye).
  const alanlarRef = useRef<TaslakAlanlar | null>(null);
  useEffect(() => {
    alanlarRef.current = {
      baslik,
      slug,
      slugElle,
      ozet,
      kapakYol,
      durum,
      yayinYerel,
      zamanYerel,
      seoBaslik,
      seoAciklama,
      yazar,
      kategoriId,
      etiketMetni,
      odakKelime,
      kapakTon,
      kapakSimge,
      kapakAlt,
      icerikHtml: icerik.current.html,
      icerikJson: icerik.current.json,
    };
  });

  const otoAktifRef = useRef(false);
  useEffect(() => {
    otoAktifRef.current = otoAktif;
  }, [otoAktif]);

  const zamanlayici = useRef<number | null>(null);
  const hemenYaz = useCallback(() => {
    if (!otoAktifRef.current || !alanlarRef.current) return;
    // İçerik state değil ref'te; form yeniden çizilmeden değiştiği için aynayı
    // beklemeden doğrudan en güncel içeriği okuyoruz.
    taslakYaz(
      anahtar,
      { ...alanlarRef.current, icerikHtml: icerik.current.html, icerikJson: icerik.current.json },
      mevcut?.guncelleme ?? null,
    );
    setSonKayit(Date.now());
  }, [anahtar, mevcut?.guncelleme]);

  const planla = useCallback(() => {
    if (!otoAktifRef.current) return;
    if (zamanlayici.current) window.clearTimeout(zamanlayici.current);
    zamanlayici.current = window.setTimeout(hemenYaz, 800);
  }, [hemenYaz]);

  // Açılışta: geçerli bir taslak var mı? Varsa banner göster (autosave askıda),
  // yoksa bayat taslağı temizle ve otomatik kaydı aç. localStorage yalnız
  // istemcide okunabildiği için bu karar montaj sonrası (effect) veriliyor;
  // dış depodan okuyup ilk durumu belirlemek bu kuralın meşru istisnası.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const t = taslakOku(anahtar);
    const sunucu = mevcut
      ? { guncelleme: mevcut.guncelleme, baslik: mevcut.baslik, ozet: mevcut.ozet, icerikHtml: mevcut.icerikHtml }
      : null;
    if (taslakDegerli(t, sunucu)) {
      setTaslakUyari(t);
    } else {
      if (t) taslakSil(anahtar);
      setOtoAktif(true);
    }
    // Yalnızca ilk montajda çalışsın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Form alanları değişince taslağı planla (autosave açıksa).
  useEffect(() => {
    planla();
  }, [baslik, slug, slugElle, ozet, kapakYol, durum, yayinYerel, zamanYerel, seoBaslik, seoAciklama, yazar, kategoriId, etiketMetni, odakKelime, kapakTon, kapakSimge, kapakAlt, planla]);

  const taslaktanDevam = () => {
    const t = taslakUyari;
    if (!t) return;
    setBaslik(t.baslik);
    setSlug(t.slug);
    setSlugElle(t.slugElle);
    setOzet(t.ozet);
    setKapakYol(t.kapakYol);
    setDurum(t.durum);
    setYayinYerel(t.yayinYerel);
    setZamanYerel(t.zamanYerel ?? "");
    setSeoBaslik(t.seoBaslik);
    setSeoAciklama(t.seoAciklama);
    setYazar(t.yazar);
    setKategoriId(t.kategoriId);
    setEtiketMetni(t.etiketMetni);
    setOdakKelime(t.odakKelime ?? "");
    setKapakTon(t.kapakTon ?? null);
    setKapakSimge(t.kapakSimge ?? null);
    setKapakAlt(t.kapakAlt ?? "");
    icerik.current = { html: t.icerikHtml, json: t.icerikJson };
    setAnalizIcerik(t.icerikHtml);
    setGeriYukleIcerik({ html: t.icerikHtml, json: t.icerikJson });
    setSonKayit(t.kayitZamani);
    setTaslakUyari(null);
    setOtoAktif(true);
    bildir.basarili("Taslaktan devam ediliyor.");
  };

  const taslagiYoksay = () => {
    taslakSil(anahtar);
    setTaslakUyari(null);
    setOtoAktif(true);
  };

  const baslikDegis = (v: string) => {
    setBaslik(v);
    if (!slugElle) setSlug(slugYap(v));
  };

  const kapakYukle = async (dosya: File | undefined) => {
    if (!dosya) return;
    if (!dosya.type.startsWith("image/")) return bildir.hata("Yalnızca görsel yükleyebilirsin.");
    if (dosya.size > 5 * 1024 * 1024) return bildir.hata("Görsel 5 MB'tan küçük olmalı.");
    setKapakYukleniyor(true);
    const temizAd = dosya.name.replace(/[^\w.\-]/g, "_");
    const yol = `blog/${Date.now()}-${temizAd}`;
    const { error } = await createClient().storage.from("kapaklar").upload(yol, dosya, { cacheControl: "3600" });
    setKapakYukleniyor(false);
    if (error) return bildir.hata(`Kapak yüklenemedi: ${error.message}`);
    setKapakYol(yol);
  };

  /** Sürüm geçmişinden seçilen hâli forma yükler (kaydetmeden kalıcı olmaz). */
  const surumuYukle = (s: YaziSurumu) => {
    setBaslik(s.baslik);
    setOzet(s.ozet);
    setSeoBaslik(s.seoBaslik);
    setSeoAciklama(s.seoAciklama);
    icerik.current = { html: s.icerikHtml, json: s.icerikJson };
    setAnalizIcerik(s.icerikHtml);
    setGeriYukleIcerik({ html: s.icerikHtml, json: s.icerikJson });
    bildir.basarili("Sürüm editöre yüklendi. Kalıcı olması için Kaydet'e bas.");
  };

  const kaydet = (kontrolOnayli = false) => {
    if (!baslik.trim() || !slug.trim()) return bildir.hata("Başlık ve URL zorunludur.");
    if (durum === "zamanli" && !zamanYerel) return bildir.hata("Zamanlı yayın için tarih ve saat seç.");
    // Yayındaki yazı yayından kalkıyor: önce eski adresinin kaderi soruluyor.
    if (mevcut?.durum === "yayin" && durum !== "yayin") {
      setKarar("kaydet");
      return;
    }
    // Yayına alınıyor (ya da zamanlanıyor): eksikler bir kez gösteriliyor.
    // Zaten yayındaki yazının her düzeltmesinde sorulmuyor. Engellemiyor.
    const yayinaAliniyor = (durum === "yayin" || durum === "zamanli") && mevcut?.durum !== durum;
    if (!kontrolOnayli && yayinaAliniyor && eksikKontroller(kontroller).length) {
      setKontrolAcik(true);
      return;
    }
    void gercektenKaydet(null);
  };

  const gercektenKaydet = async (yonlendirme: YonlendirmeKarari | null) => {
    setKarar(null);
    setKaydediliyor(true);
    // Başarılı kayıt sunucuya yazıyor; yerel taslağa artık gerek yok. İyimser
    // temizlik: başarılıysa action redirect eder, hata dönerse aşağıda geri yazılır.
    taslakSil(anahtar);
    const r = await saveYazi({
      originalSlug: mevcut?.slug,
      slug: slug.trim(),
      baslik: baslik.trim(),
      ozet: ozet.trim(),
      icerikHtml: icerik.current.html,
      icerikJson: icerik.current.json,
      kapakYol,
      durum,
      yayinTarihi: yayinYerel ? new Date(yayinYerel).toISOString() : null,
      zamanlananTarih: durum === "zamanli" ? trYereldenIso(zamanYerel) : null,
      seoBaslik: seoBaslik.trim(),
      seoAciklama: seoAciklama.trim(),
      yazar: yazar.trim(),
      kategoriId: kategoriId || null,
      // Var olan etiketin farklı yazımı ("meta ads" ↔ "Meta Ads") onun yazımına
      // çevriliyor: aynı adrese düşen iki etiket olmasın (BlogEtiketAlani).
      etiketler: etiketleriDuzenle(
        etiketleriAyir(etiketMetni),
        etiketleriTopla(digerYazilar.filter((y) => y.id !== mevcut?.id)),
      ),
      icerikGuncellendi,
      yonlendirme,
      odakKelime: odakKelime.trim(),
      kapakTon,
      kapakSimge,
      kapakAlt: kapakAlt.trim(),
    });
    // Başarılıysa action redirect ediyor; buraya yalnızca hata dönerse geliyoruz.
    setKaydediliyor(false);
    if (r?.error) {
      bildir.hata(r.error);
      hemenYaz(); // kayıt başarısız: yerel taslağı geri yaz, emek kaybolmasın
    }
  };

  const sil = () => {
    if (!mevcut) return;
    // Bir kez bile yayınlandıysa adresi Google'da: nereye gideceği soruluyor.
    if (mevcut.hicYayinlandi) {
      setKarar("sil");
      return;
    }
    if (!window.confirm("Bu yazı kalıcı olarak silinsin mi?")) return;
    void gercektenSil(null);
  };

  const gercektenSil = async (yonlendirme: YonlendirmeKarari | null) => {
    if (!mevcut) return;
    setKarar(null);
    const r = await silYazi(mevcut.slug, yonlendirme);
    if (r?.error) bildir.hata(r.error);
  };

  const kapakUrl = depoUrl("kapaklar", kapakYol);
  const kategoriSlug = kategoriListe.find((k) => k.id === kategoriId)?.slug || null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Sol: başlık + içerik. min-w-0: uzun/boşluksuz metin kolonu sağa doğru
          sonsuza uzatmasın — içerik kırılıp sarabilsin diye kolon 0'a kadar
          küçülebilmeli (grid item varsayılan min-width:auto'yu geçersiz kılar). */}
      <div className="flex min-w-0 flex-col gap-5">
        {taslakUyari && (
          <div className="flex flex-col gap-3 rounded-[12px] border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-400/25 text-[12px]" aria-hidden>
                ⏳
              </span>
              <div className="text-[13px] leading-[1.5] text-[#7c5b12]">
                <span className="font-semibold">Kaydedilmemiş taslak bulundu</span> · {taslakNispiZaman(taslakUyari.kayitZamani)}{" "}
                otomatik kaydedildi. Kaldığın yerden devam edebilir ya da bu taslağı yoksayabilirsin.
              </div>
            </div>
            <div className="flex flex-none gap-2">
              <button
                type="button"
                onClick={taslaktanDevam}
                className="h-9 rounded-[9px] bg-brand px-3 text-[13px] font-semibold text-white transition hover:bg-ink"
              >
                Kaldığım yerden devam et
              </button>
              <button
                type="button"
                onClick={taslagiYoksay}
                className="h-9 rounded-[9px] border border-ink/15 bg-white px-3 text-[13px] font-semibold text-[#5C6273] transition hover:border-danger/40 hover:text-danger"
              >
                Yoksay
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className={ETIKET}>Başlık</span>
          <input
            value={baslik}
            onChange={(e) => baslikDegis(e.target.value)}
            placeholder="Örn. Meta Business Suite Nedir?"
            className={`${GIRDI} h-[54px] text-[18px] font-semibold`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={ETIKET}>Özet (kart ve arama açıklaması)</span>
          <textarea
            value={ozet}
            onChange={(e) => setOzet(e.target.value)}
            rows={2}
            placeholder="Yazının bir-iki cümlelik özeti."
            className={`${GIRDI} h-auto py-3 leading-[1.5]`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className={ETIKET}>İçerik</span>
            {sonKayit && (
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.06em] text-[#8A90A0]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Otomatik kaydedildi · {taslakNispiZaman(sonKayit)}
              </span>
            )}
          </div>
          <ZenginEditor
            baslangicJson={mevcut?.icerikJson ?? null}
            baslangicHtml={mevcut?.icerikHtml ?? ""}
            icHedefler={icHedefler}
            yaziSlug={slug}
            geriYukle={geriYukleIcerik}
            onDegisim={(d) => {
              icerik.current = d;
              planla();
              analiziPlanla(d.html);
            }}
            onHazir={setAnalizIcerik}
          />
        </div>
      </div>

      {/* Sağ: yayın ayarları + SEO */}
      <aside className="flex flex-col gap-5">
        <div className="rounded-[14px] border border-ink/11 bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className={ETIKET}>Durum</span>
              <select value={durum} onChange={(e) => setDurum(e.target.value as YaziDurum)} className={GIRDI}>
                <option value="taslak">Taslak</option>
                <option value="yayin">Yayında</option>
                <option value="zamanli">Zamanlı yayın</option>
              </select>
              {mevcut?.durum === "zamanli" && mevcut.zamanlananTarih && durum === "zamanli" && (
                <span className="text-[12.5px] leading-[1.5] text-[#5C6273]">
                  {new Intl.DateTimeFormat("tr-TR", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: "Europe/Istanbul",
                  }).format(new Date(mevcut.zamanlananTarih))}{" "}
                  tarihinde kendiliğinden yayına girecek.
                </span>
              )}
            </div>

            {durum === "zamanli" && (
              <div className="flex flex-col gap-2">
                <span className={ETIKET}>Yayına gireceği an (Türkiye saati)</span>
                <input
                  type="datetime-local"
                  value={zamanYerel}
                  min={isoDanTrYerel(new Date().toISOString())}
                  onChange={(e) => setZamanYerel(e.target.value)}
                  className={GIRDI}
                />
                <span className="text-[12px] leading-[1.5] text-[#8A90A0]">
                  O dakika gelince yazı kendiliğinden yayına girer; o ana kadar sitede görünmez.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className={ETIKET}>
                {durum === "zamanli" ? "Görünen yayın tarihi (boşsa zamanlanan an)" : "Yayın tarihi (boşsa yayınlarken şimdi)"}
              </span>
              <input
                type="datetime-local"
                value={yayinYerel}
                onChange={(e) => setYayinYerel(e.target.value)}
                className={GIRDI}
              />
            </div>

            {/* İçerik güncelleme tarihi: teknik updated_at'ten AYRI. Her save'de
                otomatik değişmiyor; yalnızca bu kutu işaretlenirse damgalanıyor. */}
            {mevcut && (
              <div className="flex flex-col gap-1.5 rounded-[10px] border border-ink/12 bg-mist p-3">
                <span className={ETIKET}>Son içerik güncellemesi</span>
                <span className="text-[13px] text-[#5C6273]">
                  {mevcut.icerikGuncelleme
                    ? new Date(mevcut.icerikGuncelleme).toLocaleDateString("tr-TR")
                    : "— (yayından beri güncellenmedi)"}
                </span>
                <label className="mt-1 flex items-start gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={icerikGuncellendi}
                    onChange={(e) => setIcerikGuncellendi(e.target.checked)}
                    className="mt-[3px]"
                  />
                  <span>
                    Bu değişiklik içeriğin güncellenme tarihini değiştirsin
                    <span className="mt-0.5 block text-[11.5px] text-[#8A90A0]">
                      Yalnızca gerçek içerik güncellemelerinde işaretleyin (yeni bölüm, düzeltme, güncel
                      ekran görüntüsü). Yazım/teknik düzeltmelerde boş bırakın.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className={ETIKET}>URL</span>
              <div className="flex items-center overflow-hidden rounded-[10px] border border-ink/14 bg-white focus-within:border-brand">
                {/* Yazılar kökte sunuluyor (/meta-capi-nedir/), /blog/ altında değil. */}
                <span className="flex-none py-[11px] pl-[12px] font-mono text-[13px] text-[#8A90A0]">/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugElle(true);
                    setSlug(slugYap(e.target.value));
                  }}
                  className="h-[44px] min-w-0 flex-1 bg-white px-[6px] text-[14px] text-ink outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className={ETIKET}>Yazar</span>
              <input value={yazar} onChange={(e) => setYazar(e.target.value)} className={GIRDI} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={ETIKET}>Kategori</span>
                <button type="button" onClick={yeniKategori} className="text-[12px] font-semibold text-brand hover:text-ink">
                  + Yeni
                </button>
              </div>
              <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className={GIRDI}>
                <option value="">— Kategorisiz —</option>
                {kategoriListe.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
            </div>

            <EtiketAlani deger={etiketMetni} onDegis={setEtiketMetni} yazilar={digerYazilar} haricId={mevcut?.id} />
          </div>
        </div>

        <div className="rounded-[14px] border border-ink/11 bg-white p-5">
          <span className={ETIKET}>Kapak · görsel 1600×1000</span>
          <label className="mt-[10px] block cursor-pointer overflow-hidden rounded-[11px] border border-dashed border-ink/20 bg-mist transition hover:border-brand">
            {kapakUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={kapakUrl} alt="" className="aspect-[16/10] h-full w-full object-cover" />
            ) : (
              // Görsel yoksa sitede çizilecek kapak (kategori ya da seçilen renk/simge).
              <BlogKapak gorsel={null} kategoriSlug={kategoriSlug} ozel={{ ton: kapakTon, simge: kapakSimge }} />
            )}
            <span className="flex min-h-11 items-center justify-center border-t border-ink/10 bg-white px-3 text-center text-[13px] font-semibold text-[#5C6273]">
              {kapakYukleniyor ? "Yükleniyor…" : kapakUrl ? "Görseli değiştir" : "Görsel yükle (isteğe bağlı)"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                void kapakYukle(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {kapakYol ? (
            <>
              <label className="mt-4 flex flex-col gap-2">
                <span className={ETIKET}>Kapak açıklaması (alt metin)</span>
                <input
                  value={kapakAlt}
                  onChange={(e) => setKapakAlt(e.target.value)}
                  maxLength={300}
                  placeholder={baslik || "Görselde ne var?"}
                  className={GIRDI}
                />
                <span className="text-[12px] leading-[1.5] text-[#8A90A0]">
                  Boşsa yazı başlığı kullanılır. Görsel başlığı tekrar etmiyorsa (ekran görüntüsü, grafik) ne
                  gösterdiğini yaz.
                </span>
              </label>
              <button
                type="button"
                onClick={() => setKapakYol(null)}
                className="mt-2 min-h-11 text-[13px] font-semibold text-[#5C6273] hover:text-danger"
              >
                Kapağı kaldır
              </button>
            </>
          ) : (
            <KapakSecici
              kategoriSlug={kategoriSlug}
              ton={kapakTon}
              simge={kapakSimge}
              onTon={setKapakTon}
              onSimge={setKapakSimge}
            />
          )}
        </div>

        <SeoKarti
          odakKelime={odakKelime}
          onOdakKelime={setOdakKelime}
          seoBaslik={seoBaslik}
          onSeoBaslik={setSeoBaslik}
          seoAciklama={seoAciklama}
          onSeoAciklama={setSeoAciklama}
          baslik={baslik}
          ozet={ozet}
          slug={slug}
          tarih={yayinYerel ? new Date(yayinYerel).toISOString() : (mevcut?.yayinTarihi ?? null)}
          gorunenBaslik={gorunenBaslik(seoBaslik, baslik)}
          analiz={analiz}
        />

        <YayinKontrolListesi kontroller={kontroller} />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={kaydediliyor}
            onClick={() => kaydet()}
            className="h-[50px] w-full rounded-[11px] bg-brand text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
          {mevcut && <SurumGecmisi postId={mevcut.id} onGeriYukle={surumuYukle} />}
          {mevcut && (
            <button
              type="button"
              onClick={sil}
              className="h-[44px] w-full rounded-[11px] border border-ink/13 bg-white text-[14px] font-semibold text-[#5C6273] hover:border-danger/45 hover:text-danger"
            >
              Yazıyı sil
            </button>
          )}
        </div>
      </aside>

      {kontrolAcik && (
        <YayinKontrolPenceresi
          kontroller={kontroller}
          zamanli={durum === "zamanli"}
          onIptal={() => setKontrolAcik(false)}
          onDevam={() => {
            setKontrolAcik(false);
            kaydet(true);
          }}
        />
      )}

      {karar && mevcut && (
        <YonlendirmeKarariPenceresi
          baslik={karar === "sil" ? "Yazı silinecek. Adresi nereye gitsin?" : "Yazı yayından kalkıyor. Adresi nereye gitsin?"}
          aciklama={`/${mevcut.slug}/ adresi Google'da ve başka sitelerde bağlantı olarak duruyor olabilir. Ziyaretçi bu adrese geldiğinde ne olsun?`}
          onayMetni={karar === "sil" ? "Yazıyı sil" : "Kaydet"}
          yazilar={icHedefler}
          haricSlug={mevcut.slug}
          onIptal={() => setKarar(null)}
          onOnay={(k) => void (karar === "sil" ? gercektenSil(k) : gercektenKaydet(k))}
        />
      )}
    </div>
  );
}
