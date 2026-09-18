"use client";

import { useRef, useState } from "react";
import { useBildirim } from "@/components/Bildirim";
import { createClient } from "@/lib/supabase/client";
import { depoUrl } from "@/lib/depo";
import { slugYap } from "@/lib/duyuru";
import { ZenginEditor } from "@/components/admin/ZenginEditor";
import { saveYazi, silYazi, kategoriEkle } from "@/app/kontrol-9f4x2k/(protected)/blog/actions";
import type { Yazi, Kategori, IcLinkHedef } from "@/lib/yazilar";

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

export function YaziEditoru({
  mevcut,
  varsayilanYazar,
  kategoriler = [],
  icHedefler = [],
}: {
  mevcut?: Yazi | null;
  varsayilanYazar?: string;
  kategoriler?: Kategori[];
  icHedefler?: IcLinkHedef[];
}) {
  const bildir = useBildirim();

  const [baslik, setBaslik] = useState(mevcut?.baslik ?? "");
  const [slug, setSlug] = useState(mevcut?.slug ?? "");
  const [slugElle, setSlugElle] = useState(Boolean(mevcut));
  const [ozet, setOzet] = useState(mevcut?.ozet ?? "");
  const [kapakYol, setKapakYol] = useState<string | null>(mevcut?.kapakYol ?? null);
  const [durum, setDurum] = useState<"taslak" | "yayin">(mevcut?.durum ?? "taslak");
  const [yayinYerel, setYayinYerel] = useState(isoDanYerel(mevcut?.yayinTarihi ?? null));
  const [seoBaslik, setSeoBaslik] = useState(mevcut?.seoBaslik ?? "");
  const [seoAciklama, setSeoAciklama] = useState(mevcut?.seoAciklama ?? "");
  const [yazar, setYazar] = useState(mevcut?.yazar || varsayilanYazar || "");
  const [kategoriId, setKategoriId] = useState<string>(mevcut?.kategoriId ?? "");
  const [kategoriListe, setKategoriListe] = useState<Kategori[]>(kategoriler);
  const [etiketMetni, setEtiketMetni] = useState((mevcut?.etiketler ?? []).join(", "));
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

  const kaydet = async () => {
    if (!baslik.trim() || !slug.trim()) return bildir.hata("Başlık ve URL zorunludur.");
    setKaydediliyor(true);
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
      seoBaslik: seoBaslik.trim(),
      seoAciklama: seoAciklama.trim(),
      yazar: yazar.trim(),
      kategoriId: kategoriId || null,
      etiketler: etiketMetni
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      icerikGuncellendi,
    });
    // Başarılıysa action redirect ediyor; buraya yalnızca hata dönerse geliyoruz.
    setKaydediliyor(false);
    if (r?.error) bildir.hata(r.error);
  };

  const sil = async () => {
    if (!mevcut) return;
    if (!window.confirm("Bu yazı kalıcı olarak silinsin mi?")) return;
    const r = await silYazi(mevcut.slug);
    if (r?.error) bildir.hata(r.error);
  };

  const kapakUrl = depoUrl("kapaklar", kapakYol);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Sol: başlık + içerik */}
      <div className="flex flex-col gap-5">
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
          <span className={ETIKET}>İçerik</span>
          <ZenginEditor
            baslangicJson={mevcut?.icerikJson ?? null}
            baslangicHtml={mevcut?.icerikHtml ?? ""}
            icHedefler={icHedefler}
            yaziSlug={slug}
            onDegisim={(d) => (icerik.current = d)}
          />
        </div>
      </div>

      {/* Sağ: yayın ayarları + SEO */}
      <aside className="flex flex-col gap-5">
        <div className="rounded-[14px] border border-ink/11 bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className={ETIKET}>Durum</span>
              <select
                value={durum}
                onChange={(e) => setDurum(e.target.value as "taslak" | "yayin")}
                className={GIRDI}
              >
                <option value="taslak">Taslak</option>
                <option value="yayin">Yayında</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className={ETIKET}>Yayın tarihi (boşsa yayınlarken şimdi)</span>
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
                <span className="flex-none py-[11px] pl-[12px] font-mono text-[13px] text-[#8A90A0]">/blog/</span>
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

            <div className="flex flex-col gap-2">
              <span className={ETIKET}>Etiketler (virgülle ayır)</span>
              <input
                value={etiketMetni}
                onChange={(e) => setEtiketMetni(e.target.value)}
                placeholder="meta ads, facebook, bütçe"
                className={GIRDI}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[14px] border border-ink/11 bg-white p-5">
          <span className={ETIKET}>Kapak görseli · 1600×1000</span>
          <label className="mt-[10px] flex aspect-[16/10] cursor-pointer items-center justify-center overflow-hidden rounded-[11px] border border-dashed border-ink/20 bg-mist text-center transition hover:border-brand">
            {kapakUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={kapakUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-[13px] text-[#656B7A]">
                {kapakYukleniyor ? "Yükleniyor…" : "Sürükle veya seç"}
              </span>
            )}
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
          {kapakYol && (
            <button
              type="button"
              onClick={() => setKapakYol(null)}
              className="mt-[10px] text-[13px] font-semibold text-[#5C6273] hover:text-danger"
            >
              Kapağı kaldır
            </button>
          )}
        </div>

        <div className="rounded-[14px] border border-ink/11 bg-white p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className={ETIKET}>SEO başlığı (boşsa yazı başlığı)</span>
              <input value={seoBaslik} onChange={(e) => setSeoBaslik(e.target.value)} className={GIRDI} />
            </div>
            <div className="flex flex-col gap-2">
              <span className={ETIKET}>SEO açıklaması (boşsa özet)</span>
              <textarea
                value={seoAciklama}
                onChange={(e) => setSeoAciklama(e.target.value)}
                rows={3}
                className={`${GIRDI} h-auto py-3 leading-[1.5]`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={kaydediliyor}
            onClick={kaydet}
            className="h-[50px] w-full rounded-[11px] bg-brand text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-50"
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
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
    </div>
  );
}
