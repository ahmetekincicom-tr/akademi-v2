"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  seansEkle,
  seansDurumDegistir,
  seansSil,
  seansKayitLinki,
} from "@/app/kontrol-9f4x2k/(protected)/seanslar/actions";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { seansAyir } from "@/lib/seans";
import { guvenliUrl } from "@/lib/guvenli-url";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type SeansSatir = {
  id: string;
  isim: string;
  program: string;
  baslangic: string;
  sureDk: number;
  konu: string;
  toplantiLink: string;
  kayitLink: string;
  durum: "planlandi" | "tamamlandi" | "iptal";
};

/**
 * Hem birebir eğitim oturumlarını hem eğitim sonrası seansları yönetiyor.
 * İkisi ayrı kavram ama ekran işi birebir aynı: kişi seç, tarih ver, durum
 * değiştir, kayıt bağlantısı yapıştır. İki kopya bırakmak yerine metinler ve
 * server action'lar dışarıdan veriliyor.
 */
export type OturumMetinleri = {
  baslik: string;
  birim: string;
  yeniDugme: string;
  yeniBaslik: string;
  eklendi: string;
};

/**
 * Ekleme sonucu.
 *
 * `typeof seansEkle` yazılmıyor: bileşen iki farklı eylemle çalışıyor
 * (seanslar ve birebir eğitim) ve birebir eğitim tarafı ayrıca `uyari`
 * döndürüyor — kayıt oldu ama bildirim maili gitmedi durumu. Tek bir
 * eylemin imzasına bağlanmak diğerinin alanını görünmez yapıyordu.
 */
type EkleSonuc = { error?: string; uyari?: string };

export type OturumEylemleri = {
  /*
    Girdi tipi seansEkle'ninkinden türetiliyor ama ekstraKatilimcilar
    eklenerek: birebir eğitim tarafı kurumsal ortak oturumu destekliyor,
    seans takvimi desteklemiyor. Tek bir eylemin imzasına bağlanmak
    diğerinin alanını görünmez yapıyordu — EkleSonuc'ta da aynı sorun vardı.
  */
  ekle: (input: Parameters<typeof seansEkle>[0] & { ekstraKatilimcilar?: string[] }) => Promise<EkleSonuc>;
  /*
    Dönüş tipi eylemin kendisinden değil ortak EkleSonuc'tan: birebir eğitim
    tarafında durum değişikliği ve silme artık uyarı da döndürebiliyor
    (takvim etkinliği kaldırılamadıysa). Tipi dar bırakmak o uyarıyı
    görünmez yapardı.
  */
  durumDegistir: (...p: Parameters<typeof seansDurumDegistir>) => Promise<EkleSonuc>;
  sil: (...p: Parameters<typeof seansSil>) => Promise<EkleSonuc>;
  kayitLinki: typeof seansKayitLinki;
};

const VARSAYILAN_METIN: OturumMetinleri = {
  baslik: "Birebir seanslar",
  birim: "seans",
  yeniDugme: "Seans planla",
  yeniBaslik: "Yeni seans",
  eklendi: "Seans planlandı.",
};

const VARSAYILAN_EYLEM: OturumEylemleri = {
  ekle: seansEkle,
  durumDegistir: seansDurumDegistir,
  sil: seansSil,
  kayitLinki: seansKayitLinki,
};

export function SeansYonetimi({
  seanslar,
  ogrenciler,
  gruplar,
  kurslar,
  metin = VARSAYILAN_METIN,
  eylem = VARSAYILAN_EYLEM,
}: {
  seanslar: SeansSatir[];
  ogrenciler: { id: string; ad: string }[];
  /**
   * Kurumsal kayıt arkadaşları: userId -> aynı ödemeye bağlı diğer kişiler.
   *
   * Yalnızca birebir eğitim tarafı dolduruyor. Seans takvimi (eğitim sonrası
   * görüşme hakları) kişiye özel; orada grup kavramı yok.
   */
  gruplar?: Record<string, { id: string; ad: string }[]>;
  kurslar: { id: string; ad: string }[];
  metin?: OturumMetinleri;
  eylem?: OturumEylemleri;
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [formAcik, setFormAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();
  const [form, setForm] = useState({
    userId: "",
    courseId: "",
    baslangic: "",
    sureDk: "60",
    konu: "",
    toplantiLink: "",
  });
  /** Ortak oturuma dahil edilecek kurumsal arkadaşlar. */
  const [ekstra, setEkstra] = useState<string[]>([]);

  const { yaklasan, gecmis } = seansAyir(seanslar);

  const kaydet = () => {
    setHata(null);
    startTransition(async () => {
      const r = await eylem.ekle({ ...form, ekstraKatilimcilar: ekstra });
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        bildir.basarili(metin.eklendi);
        // Kayıt oldu ama katılımcıya mail gitmediyse söylenmeli; sessiz
        // kalırsa haberi olduğu sanılır.
        if (r?.uyari) bildir.bilgi(r.uyari);
        setForm({ userId: "", courseId: "", baslangic: "", sureDk: "60", konu: "", toplantiLink: "" });
        setEkstra([]);
        setFormAcik(false);
        router.refresh();
      }
    });
  };

  const durumDegistir = (id: string, durum: SeansSatir["durum"]) => {
    startTransition(async () => {
      const r = await eylem.durumDegistir(id, durum);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Seans durumu güncellendi.");
        if (r?.uyari) bildir.bilgi(r.uyari);
        router.refresh();
      }
    });
  };

  // Kayıt bağlantısı satır içinde düzenleniyor: seans bittikten sonra Drive
  // linkini yapıştırmak tek işlem, ayrı bir form açtırmaya değmiyor.
  const [kayitDuzenlenen, setKayitDuzenlenen] = useState<string | null>(null);
  const [kayitTaslak, setKayitTaslak] = useState("");

  const kayitKaydet = (id: string) => {
    startTransition(async () => {
      const r = await eylem.kayitLinki(id, kayitTaslak);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili(kayitTaslak.trim() ? "Kayıt bağlantısı kaydedildi." : "Kayıt bağlantısı kaldırıldı.");
        setKayitDuzenlenen(null);
        router.refresh();
      }
    });
  };

  const sil = (id: string) => {
    startTransition(async () => {
      const r = await eylem.sil(id);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Seans silindi.");
        if (r?.uyari) bildir.bilgi(r.uyari);
        router.refresh();
      }
    });
  };

  const satir = (s: SeansSatir) => {
    const etiket = seansDurumEtiket[s.durum];
    const st = durumStil(etiket);
    const toplanti = guvenliUrl(s.toplantiLink);
    return (
      <div key={s.id} className="border-b border-ink/7 last:border-b-0">
      <div
        className="flex flex-col gap-3 px-4 py-4 hover:bg-[#F7F9FF] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-[22px] sm:py-[14px]"
      >
        <div className="order-2 font-mono text-[11.5px] text-[#3A3F4F] sm:order-none sm:w-[150px] sm:flex-none">
          {saatBicimi.format(new Date(s.baslangic))}
          <span className="mt-[2px] block text-[10px] text-[#656B7A]">{s.sureDk} dk</span>
        </div>
        <div className="order-1 min-w-0 sm:order-none sm:flex-1">
          <div className="text-sm leading-[1.3] font-semibold">{s.isim}</div>
          <div className="mt-[2px] font-mono text-[10.5px] text-[#656B7A]">
            {s.konu || "Konu belirtilmedi"} · {s.program}
          </div>
        </div>
        {toplanti && (
          <a
            href={toplanti}
            target="_blank"
            rel="noreferrer"
            className="order-3 inline-flex h-8 w-fit flex-none items-center gap-[5px] rounded-[7px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand sm:order-none"
          >
            <Icon name="external" size={13} />
            Toplantı
          </a>
        )}
        <select
          aria-label="Seans durumu"
          value={s.durum}
          disabled={islemde}
          onChange={(e) => durumDegistir(s.id, e.target.value as SeansSatir["durum"])}
          className="h-8 flex-none rounded-[7px] border-0 px-[7px] font-mono text-[9.5px] tracking-[0.08em] uppercase outline-none"
          style={{ background: st.bg, color: st.renk }}
        >
          <option value="planlandi">Planlandı</option>
          <option value="tamamlandi">Tamamlandı</option>
          <option value="iptal">İptal</option>
        </select>
        <button
          type="button"
          disabled={islemde}
          onClick={() => {
            setKayitTaslak(s.kayitLink);
            setKayitDuzenlenen(kayitDuzenlenen === s.id ? null : s.id);
          }}
          className={`order-4 inline-flex h-8 w-fit flex-none items-center gap-[5px] rounded-[7px] border px-3 text-[12.5px] font-semibold transition sm:order-none ${
            s.kayitLink
              ? "border-brand/35 bg-brand/8 text-brand hover:border-brand"
              : "border-ink/13 bg-white text-[#656B7A] hover:border-ink hover:text-ink"
          }`}
        >
          <Icon name="playCircle" size={13} />
          {s.kayitLink ? "Kayıt var" : "Kayıt ekle"}
        </button>
        <button
          type="button"
          disabled={islemde}
          onClick={() => sil(s.id)}
          aria-label="Seansı sil"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-ink/12 text-[#656B7A] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {kayitDuzenlenen === s.id && (
        <div className="flex flex-wrap items-center gap-2 bg-mist px-4 pt-1 pb-4 sm:px-[22px]">
          <input
            value={kayitTaslak}
            onChange={(e) => setKayitTaslak(e.target.value)}
            placeholder="https://drive.google.com/file/d/…/view"
            aria-label="Kayıt bağlantısı"
            className="h-9 min-w-0 grow basis-[260px] rounded-[8px] border border-ink/13 bg-white px-3 text-[13px] text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            disabled={islemde}
            onClick={() => kayitKaydet(s.id)}
            className="h-9 flex-none rounded-[8px] bg-brand px-4 text-[12.5px] font-semibold text-white transition hover:bg-ink disabled:opacity-50"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={() => setKayitDuzenlenen(null)}
            className="h-9 flex-none rounded-[8px] border border-ink/13 bg-white px-4 text-[12.5px] font-semibold text-ink transition hover:border-ink"
          >
            Vazgeç
          </button>
          <span className="basis-full font-mono text-[10.5px] text-[#656B7A]">
            Drive, YouTube, Vimeo veya doğrudan dosya bağlantısı. Yalnızca bu seansın katılımcısı görür.
          </span>
        </div>
      )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            {metin.baslik}
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {yaklasan.length} yaklaşan · {seanslar.length} toplam {metin.birim}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAcik((v) => !v)}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          {!formAcik && <Icon name="plus" size={15} />}
          {formAcik ? "Vazgeç" : metin.yeniDugme}
        </button>
      </div>

      {formAcik && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">{metin.yeniBaslik}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Öğrenci</span>
              <select
                value={form.userId}
                onChange={(e) => {
                  // Öğrenci değişince önceki grubun seçimi taşınmasın.
                  setEkstra([]);
                  setForm({ ...form, userId: e.target.value });
                }}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              >
                <option value="">Seç…</option>
                {ogrenciler.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.ad}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Eğitim</span>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              >
                <option value="">Belirtilmedi</option>
                {kurslar.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Tarih ve saat</span>
              <input
                type="datetime-local"
                value={form.baslangic}
                onChange={(e) => setForm({ ...form, baslangic: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Süre (dk)</span>
              <input
                type="number"
                value={form.sureDk}
                onChange={(e) => setForm({ ...form, sureDk: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Konu</span>
              <input
                type="text"
                value={form.konu}
                onChange={(e) => setForm({ ...form, konu: e.target.value })}
                placeholder="Kampanya optimizasyon seansı"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Toplantı linki</span>
              <input
                type="text"
                value={form.toplantiLink}
                onChange={(e) => setForm({ ...form, toplantiLink: e.target.value })}
                placeholder="https://meet.google.com/…"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
          </div>

          {/*
            Kurumsal ortak oturum.

            Yalnızca seçili öğrencinin bir kurumsal kaydı varsa çiziliyor —
            bireysel katılımcıların çoğunlukta olduğu bir listede sürekli
            duran boş bir kutu, formu uzatmaktan başka bir şey yapmazdı.
          */}
          {(gruplar?.[form.userId]?.length ?? 0) > 0 && (
            <div className="mt-4 rounded-[12px] border border-ink/12 bg-mist px-4 py-3">
              <div className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
                Aynı kurumsal kayıttakiler
              </div>
              <p className="mt-[5px] text-[12.5px] leading-[1.5] text-[#656B7A]">
                İşaretlediklerin aynı saat ve aynı bağlantıyla bu oturuma eklenir; bildirim hepsine gider.
              </p>
              <div className="mt-[10px] flex flex-wrap gap-2">
                {gruplar?.[form.userId]?.map((k) => {
                  const secili = ekstra.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={secili}
                      onClick={() =>
                        setEkstra(secili ? ekstra.filter((x) => x !== k.id) : [...ekstra, k.id])
                      }
                      className={`inline-flex items-center gap-[6px] rounded-full border px-[11px] py-[5px] text-[13px] font-medium transition ${
                        secili
                          ? "border-brand bg-brand text-white"
                          : "border-ink/14 bg-white text-[#4A5060] hover:border-brand hover:text-brand"
                      }`}
                    >
                      {secili && <Icon name="check" size={12} strokeWidth={2.6} />}
                      {k.ad}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

          <button
            type="button"
            onClick={kaydet}
            disabled={islemde}
            className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-60"
          >
            {islemde ? "Kaydediliyor…" : "Seansı kaydet"}
          </button>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[22px] py-[15px]">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Yaklaşan</h2>
        </div>
        {yaklasan.length === 0 ? (
          <div className="px-[22px] py-8 text-center text-sm text-[#656B7A]">Planlanmış seans yok.</div>
        ) : (
          yaklasan.map(satir)
        )}
      </div>

      {gecmis.length > 0 && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="border-b border-ink/8 px-[22px] py-[15px]">
            <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Geçmiş</h2>
          </div>
          {gecmis.map(satir)}
        </div>
      )}
    </main>
  );
}
