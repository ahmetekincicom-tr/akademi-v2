"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ilanKaydet } from "@/app/kontrol-9f4x2k/(protected)/firsatlar/actions";
import {
  CALISMA_MODELI,
  CALISMA_TIPI,
  DURUM,
  KATEGORI_ONERILERI,
  SEVIYE,
  ilanGirdisiniDogrula,
  type BasvuruTipi,
  type CalismaModeli,
  type CalismaTipi,
  type IlanDurum,
  type IlanGirdi,
  type Seviye,
} from "@/lib/firsat";
import type { YonetimIlani } from "@/lib/firsat-sorgu";
import { depoUrl } from "@/lib/depo";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";
import { SirketLogosu } from "@/components/firsat/IlanOrtak";

/**
 * İlan oluştur / düzenle. Liste alanları (sorumluluklar, aranan…) her satır
 * bir madde olacak şekilde düz metin; öğrenci tarafında madde listesi
 * olarak çiziliyor. Doğrulama sunucudakiyle aynı fonksiyon (lib/firsat.ts).
 */

const ALAN =
  "h-[42px] w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand";
const METIN =
  "w-full rounded-[10px] border border-ink/13 bg-white p-3 text-[14px] leading-[1.6] text-ink outline-none focus:border-brand";
const LOGO_TIPLERI = "image/png,image/jpeg,image/webp";
const LOGO_SINIR = 2 * 1024 * 1024;

function bosGirdi(): IlanGirdi {
  return {
    pozisyon: "",
    sirketAdi: "",
    sirketLogo: null,
    sirketWeb: "",
    kategori: "",
    calismaTipi: "tam_zamanli",
    calismaModeli: "hibrit",
    sehir: "",
    seviye: "fark_etmez",
    aciklama: "",
    sorumluluklar: "",
    arananOzellikler: "",
    tercihenOzellikler: "",
    ucret: "",
    basvuruTipi: "url",
    basvuruAdresi: "",
    sonBasvuru: "",
    durum: "taslak",
    oneCikan: false,
  };
}

function ilandanGirdi(i: YonetimIlani): IlanGirdi {
  return {
    pozisyon: i.pozisyon,
    sirketAdi: i.sirketAdi,
    sirketLogo: i.hamLogo,
    sirketWeb: i.sirketWeb ?? "",
    kategori: i.kategori,
    calismaTipi: i.calismaTipi,
    calismaModeli: i.calismaModeli,
    sehir: i.sehir ?? "",
    seviye: i.seviye,
    aciklama: i.aciklama,
    sorumluluklar: i.sorumluluklar.join("\n"),
    arananOzellikler: i.arananOzellikler.join("\n"),
    tercihenOzellikler: i.tercihenOzellikler.join("\n"),
    ucret: i.ucret ?? "",
    basvuruTipi: i.basvuruTipi,
    basvuruAdresi: i.basvuruAdresi,
    sonBasvuru: i.sonBasvuru ?? "",
    durum: i.durum,
    oneCikan: i.oneCikan,
  };
}

function Bolum({ baslik, aciklama, children }: { baslik: string; aciklama?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="font-heading text-[16.5px] font-semibold tracking-[-0.02em]">{baslik}</h2>
      {aciklama && <p className="mt-1 text-[13px] text-[#656B7A]">{aciklama}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Alan({ etiket, ipucu, children }: { etiket: string; ipucu?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">
        {etiket} {ipucu && <span className="font-normal text-[#8A90A0]">— {ipucu}</span>}
      </span>
      {children}
    </label>
  );
}

function Secenekler<T extends string>({
  kume,
  deger,
  onSec,
  ad,
}: {
  kume: Record<T, string>;
  deger: T;
  onSec: (v: T) => void;
  ad: string;
}) {
  return (
    <div role="radiogroup" aria-label={ad} className="flex flex-wrap gap-1.5">
      {(Object.keys(kume) as T[]).map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={deger === k}
          onClick={() => onSec(k)}
          className={`h-9 rounded-[9px] border px-3 text-[13px] font-semibold transition ${
            deger === k ? "border-brand bg-brand/8 text-brand" : "border-ink/13 bg-white text-[#3A3F4F] hover:border-ink/30"
          }`}
        >
          {kume[k]}
        </button>
      ))}
    </div>
  );
}

export function IlanFormu({ ilan }: { ilan?: YonetimIlani }) {
  const router = useRouter();
  const bildir = useBildirim();
  const [g, setG] = useState<IlanGirdi>(() => (ilan ? ilandanGirdi(ilan) : bosGirdi()));
  const [islemde, startTransition] = useTransition();
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const alan = <K extends keyof IlanGirdi>(k: K, v: IlanGirdi[K]) => setG((o) => ({ ...o, [k]: v }));

  const logoYukle = async (dosya: File | undefined) => {
    if (!dosya) return;
    if (!LOGO_TIPLERI.split(",").includes(dosya.type)) return bildir.hata("Logo PNG, JPG ya da WebP olmalı.");
    if (dosya.size > LOGO_SINIR) return bildir.hata("Logo 2 MB'tan küçük olmalı.");
    setLogoYukleniyor(true);
    const ad = dosya.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
    const yol = `ilanlar/${Date.now()}-${ad}`;
    const { error } = await createClient().storage.from("logolar").upload(yol, dosya, { cacheControl: "3600" });
    setLogoYukleniyor(false);
    if (error) return bildir.hata(`Logo yüklenemedi: ${error.message}`);
    alan("sirketLogo", yol);
  };

  const kaydet = (durum?: IlanDurum) => {
    const girdi = durum ? { ...g, durum } : g;
    // Önce istemcide aynı kurallarla kontrol: hata anında, alanın yanında.
    const on = ilanGirdisiniDogrula(girdi);
    if ("hata" in on) {
      setHata(on.hata);
      bildir.hata(on.hata);
      return;
    }
    setHata(null);
    startTransition(async () => {
      const r = await ilanKaydet(ilan?.id ?? null, girdi);
      if (r.error) {
        setHata(r.error);
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(girdi.durum === "yayinda" ? "İlan kaydedildi ve yayında." : "İlan kaydedildi.");
      router.push("/kontrol-9f4x2k/firsatlar");
      router.refresh();
    });
  };

  return (
    <main className="flex flex-col gap-5 p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/kontrol-9f4x2k/firsatlar"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C6273] hover:text-brand"
          >
            <Icon name="arrowLeft" size={14} />
            İş ilanları
          </Link>
          <h1 className="mt-2 font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em]">
            {ilan ? "İlanı düzenle" : "Yeni ilan"}
          </h1>
        </div>
        {ilan && (
          <div className="flex gap-2 font-mono text-[11px] text-[#656B7A]">
            <span className="rounded-full bg-mist px-2.5 py-1">{ilan.metrik.goruntulenme} görüntülenme</span>
            <span className="rounded-full bg-mist px-2.5 py-1">{ilan.metrik.basvuruTiklama} başvuru tıklaması</span>
            <span className="rounded-full bg-mist px-2.5 py-1">{ilan.metrik.kayit} kaydetme</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Bolum baslik="Pozisyon ve şirket">
            <Alan etiket="Pozisyon">
              <input
                value={g.pozisyon}
                onChange={(e) => alan("pozisyon", e.target.value)}
                maxLength={120}
                placeholder="Performans Pazarlama Uzmanı"
                className={ALAN}
              />
            </Alan>
            <div className="grid gap-4 sm:grid-cols-2">
              <Alan etiket="Şirket adı">
                <input value={g.sirketAdi} onChange={(e) => alan("sirketAdi", e.target.value)} maxLength={120} className={ALAN} />
              </Alan>
              <Alan etiket="Şirket web sitesi" ipucu="isteğe bağlı">
                <input
                  value={g.sirketWeb}
                  onChange={(e) => alan("sirketWeb", e.target.value)}
                  placeholder="https://"
                  inputMode="url"
                  className={ALAN}
                />
              </Alan>
            </div>
            <div className="flex items-center gap-4">
              <SirketLogosu ilan={{ sirketAdi: g.sirketAdi || "?", sirketLogo: depoUrl("logolar", g.sirketLogo) }} boyut={56} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand">
                  <Icon name="upload" size={14} />
                  {logoYukleniyor ? "Yükleniyor…" : g.sirketLogo ? "Logoyu değiştir" : "Logo yükle"}
                  <input
                    type="file"
                    accept={LOGO_TIPLERI}
                    hidden
                    disabled={logoYukleniyor}
                    onChange={(e) => {
                      void logoYukle(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {g.sirketLogo && (
                  <button
                    type="button"
                    onClick={() => alan("sirketLogo", null)}
                    className="h-9 px-2 text-[13px] font-semibold text-[#5C6273] hover:text-danger"
                  >
                    Kaldır
                  </button>
                )}
                <span className="w-full text-[12px] text-[#8A90A0]">Kare, şeffaf zeminli PNG en iyisi. Yoksa baş harfler gösterilir.</span>
              </div>
            </div>
            <Alan etiket="Kategori">
              <input
                list="ilan-kategorileri"
                value={g.kategori}
                onChange={(e) => alan("kategori", e.target.value)}
                placeholder="Performans pazarlama"
                className={ALAN}
              />
              <datalist id="ilan-kategorileri">
                {KATEGORI_ONERILERI.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </Alan>
          </Bolum>

          <Bolum baslik="Çalışma koşulları">
            <Alan etiket="Çalışma tipi">
              <Secenekler ad="Çalışma tipi" kume={CALISMA_TIPI} deger={g.calismaTipi} onSec={(v: CalismaTipi) => alan("calismaTipi", v)} />
            </Alan>
            <Alan etiket="Çalışma modeli">
              <Secenekler ad="Çalışma modeli" kume={CALISMA_MODELI} deger={g.calismaModeli} onSec={(v: CalismaModeli) => alan("calismaModeli", v)} />
            </Alan>
            <div className="grid gap-4 sm:grid-cols-2">
              <Alan etiket="Şehir" ipucu={g.calismaModeli === "uzaktan" ? "isteğe bağlı" : "zorunlu"}>
                <input value={g.sehir} onChange={(e) => alan("sehir", e.target.value)} placeholder="İstanbul" className={ALAN} />
              </Alan>
              <Alan etiket="Ücret / maaş" ipucu="varsa">
                <input
                  value={g.ucret}
                  onChange={(e) => alan("ucret", e.target.value)}
                  placeholder="45.000 – 55.000 TL net / ay"
                  className={ALAN}
                />
              </Alan>
            </div>
            <Alan etiket="Seviye">
              <Secenekler ad="Seviye" kume={SEVIYE} deger={g.seviye} onSec={(v: Seviye) => alan("seviye", v)} />
            </Alan>
          </Bolum>

          <Bolum baslik="İlan içeriği" aciklama="Liste alanlarında her satır bir madde olur.">
            <Alan etiket="Açıklama">
              <textarea value={g.aciklama} onChange={(e) => alan("aciklama", e.target.value)} rows={6} className={METIN} />
            </Alan>
            <Alan etiket="Sorumluluklar">
              <textarea
                value={g.sorumluluklar}
                onChange={(e) => alan("sorumluluklar", e.target.value)}
                rows={5}
                placeholder={"Meta ve Google kampanyalarını kurmak ve optimize etmek\nHaftalık performans raporu hazırlamak"}
                className={METIN}
              />
            </Alan>
            <Alan etiket="Aranan özellikler">
              <textarea value={g.arananOzellikler} onChange={(e) => alan("arananOzellikler", e.target.value)} rows={5} className={METIN} />
            </Alan>
            <Alan etiket="Tercihen aranan özellikler" ipucu="isteğe bağlı">
              <textarea value={g.tercihenOzellikler} onChange={(e) => alan("tercihenOzellikler", e.target.value)} rows={4} className={METIN} />
            </Alan>
          </Bolum>
        </div>

        {/* Sağ sütun: başvuru ve yayın */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-[calc(var(--baslik-h,64px)+20px)] xl:self-start">
          <Bolum baslik="Başvuru">
            <Secenekler
              ad="Başvuru yöntemi"
              kume={{ url: "Dış bağlantı", eposta: "E-posta" } as Record<BasvuruTipi, string>}
              deger={g.basvuruTipi}
              onSec={(v: BasvuruTipi) => alan("basvuruTipi", v)}
            />
            <Alan etiket={g.basvuruTipi === "url" ? "Başvuru bağlantısı" : "Başvuru e-postası"}>
              <input
                value={g.basvuruAdresi}
                onChange={(e) => alan("basvuruAdresi", e.target.value)}
                placeholder={g.basvuruTipi === "url" ? "https://sirket.com/kariyer/…" : "ik@sirket.com"}
                inputMode={g.basvuruTipi === "url" ? "url" : "email"}
                className={ALAN}
              />
            </Alan>
            <Alan etiket="Son başvuru tarihi" ipucu="bu günün sonuna kadar açık">
              <input type="date" value={g.sonBasvuru} onChange={(e) => alan("sonBasvuru", e.target.value)} className={ALAN} />
            </Alan>
          </Bolum>

          <Bolum baslik="Yayın">
            <Secenekler ad="Durum" kume={DURUM} deger={g.durum} onSec={(v: IlanDurum) => alan("durum", v)} />
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-ink/10 bg-mist/60 px-3 py-2.5 text-[13.5px] text-ink">
              <span>
                <span className="font-semibold">Öne çıkar</span>
                <span className="block text-[12px] text-[#656B7A]">Listenin başında, vurgulu kartla görünür.</span>
              </span>
              <input
                type="checkbox"
                checked={g.oneCikan}
                onChange={(e) => alan("oneCikan", e.target.checked)}
                className="h-4 w-4 accent-[#1C56F3]"
              />
            </label>

            {hata && <div className="text-[13px] text-danger-ink">{hata}</div>}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={islemde || logoYukleniyor}
                onClick={() => kaydet()}
                className="h-[44px] rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:opacity-45"
              >
                {islemde ? "Kaydediliyor…" : g.durum === "yayinda" ? "Kaydet ve yayınla" : `Kaydet (${DURUM[g.durum].toLocaleLowerCase("tr")})`}
              </button>
              {!ilan && g.durum !== "taslak" && (
                <button
                  type="button"
                  disabled={islemde || logoYukleniyor}
                  onClick={() => kaydet("taslak")}
                  className="h-[44px] rounded-[10px] border border-ink/13 bg-white px-4 text-[14px] font-semibold text-ink transition hover:border-ink disabled:opacity-45"
                >
                  Taslak olarak kaydet
                </button>
              )}
            </div>
          </Bolum>
        </div>
      </div>
    </main>
  );
}
