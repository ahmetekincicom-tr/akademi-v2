"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  gorusmePlanla,
  gorusmeOdemeOnayla,
  gorusmeDurumDegistir,
  gorusmeAyarKaydet,
} from "@/app/admin/(protected)/gorusmeler/actions";
import { Icon } from "@/components/Icon";
import { guvenliUrl } from "@/lib/guvenli-url";
import { para, saatBicimi, tarihBicimi } from "@/lib/admin/format";
import { GORUSME_DURUM_ETIKET, type Gorusme, type GorusmeDurum, type GorusmeAyarlari } from "@/lib/gorusme";

const DURUM_RENK: Record<GorusmeDurum, { bg: string; fg: string }> = {
  talep: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  odeme_bekliyor: { bg: "rgba(201,138,27,0.16)", fg: "#A5711A" },
  planlandi: { bg: "rgba(28,86,243,0.12)", fg: "#1C56F3" },
  tamamlandi: { bg: "rgba(24,140,90,0.13)", fg: "#157A4E" },
  iptal: { bg: "rgba(10,13,24,0.07)", fg: "#5C6273" },
};

const ALAN =
  "h-[42px] rounded-[9px] border border-ink/13 bg-white px-[12px] text-[13.5px] text-ink outline-none focus:border-brand";
const ETIKET = "font-mono text-[10px] tracking-[0.12em] text-[#8A8F9E] uppercase";

/** datetime-local yerel saati ister; ISO'nun Z'li hali kutuya girmez. */
function yerelInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function GorusmeYonetimi({
  gorusmeler,
  ayarlar,
}: {
  gorusmeler: Gorusme[];
  ayarlar: GorusmeAyarlari;
}) {
  const router = useRouter();
  const [hata, setHata] = useState<string | null>(null);
  const [acikId, setAcikId] = useState<string | null>(null);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [islemde, startTransition] = useTransition();

  const bekleyen = gorusmeler.filter((g) => g.durum === "talep" || g.durum === "odeme_bekliyor");
  const planli = gorusmeler.filter((g) => g.durum === "planlandi");

  const calistir = (fn: () => Promise<{ error?: string } | void>, sonra?: () => void) => {
    setHata(null);
    startTransition(async () => {
      const r = await fn();
      if (r && "error" in r && r.error) setHata(r.error);
      else {
        sonra?.();
        router.refresh();
      }
    });
  };

  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Danışmanlık görüşmeleri
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {bekleyen.length} bekleyen · {planli.length} planlı · {gorusmeler.length} toplam
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAyarAcik((v) => !v)}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="sliders" size={15} />
          {ayarAcik ? "Ayarları kapat" : "Hak ve ücret ayarları"}
        </button>
      </div>

      {hata && (
        <div className="mt-5 rounded-[11px] border border-danger/35 bg-danger/7 px-4 py-3 text-sm text-danger-ink">
          {hata}
        </div>
      )}

      {!ayarlar.okundu && (
        <div className="mt-5 rounded-[11px] border border-danger/35 bg-danger/7 px-4 py-3 text-[13.5px] text-danger-ink">
          Ayarlar veritabanından okunamadı — aşağıda gördüğün değerler koddaki varsayılanlar, gerçek kayıt değil.
          Görüşme migration&apos;ı çalıştırılmamış olabilir. <strong>/admin/tani</strong> sayfası nedenini söyler.
        </div>
      )}

      {ayarAcik && (
        // Sunucudan gelen değer değişince form yeniden kurulur; böylece kayıt
        // sessizce başarısız olursa admin kendi yazdığını değil, veritabanındaki
        // gerçek değeri görür.
        <AyarFormu
          key={[ayarlar.ucretsizHak, ayarlar.ucret, ayarlar.sureDk, ayarlar.aktif, ayarlar.odemeAciklamasi].join("|")}
          ayarlar={ayarlar}
          islemde={islemde}
          calistir={calistir}
        />
      )}

      {!ayarlar.aktif && (
        <div className="mt-5 rounded-[11px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13.5px] text-[#A5711A]">
          Görüşme talepleri şu anda kapalı — öğrenciler yeni talep oluşturamıyor.
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="border-b border-ink/8 px-[22px] py-[15px]">
          <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Tüm talepler</h2>
        </div>

        {gorusmeler.length === 0 ? (
          <div className="px-[22px] py-10 text-center text-sm text-[#8A8F9E]">Henüz görüşme talebi yok.</div>
        ) : (
          gorusmeler.map((g) => {
            const renk = DURUM_RENK[g.durum];
            const acik = acikId === g.id;
            const link = guvenliUrl(g.toplantiLink);
            return (
              <div key={g.id} className="border-b border-ink/7 last:border-b-0">
                <div className="flex flex-wrap items-center gap-4 px-[22px] py-[14px] hover:bg-[#F7F9FF]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{g.kisiAd}</span>
                      <span
                        className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                        style={{ background: renk.bg, color: renk.fg }}
                      >
                        {GORUSME_DURUM_ETIKET[g.durum]}
                      </span>
                      <span className="rounded-full bg-mist px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
                        {g.ucretsiz ? "ücretsiz hak" : g.odendi ? `ödendi · ${g.ucret ? para(g.ucret) : "—"}` : g.ucret ? `${para(g.ucret)} · ödenmedi` : "ücretli"}
                      </span>
                    </div>
                    <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#8A8F9E]">
                      {g.konu} · talep {tarihBicimi.format(new Date(g.olusturma))}
                    </div>
                  </div>

                  <div className="w-[150px] flex-none font-mono text-[11.5px] text-[#3A3F4F]">
                    {g.baslangic ? (
                      <>
                        {saatBicimi.format(new Date(g.baslangic))}
                        <span className="mt-[2px] block text-[10px] text-[#9CA1AE]">{g.sureDk} dk</span>
                      </>
                    ) : (
                      <span className="text-[10.5px] text-[#9CA1AE]">planlanmadı</span>
                    )}
                  </div>

                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 flex-none items-center gap-[5px] rounded-[7px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                    >
                      <Icon name="external" size={13} />
                      Toplantı
                    </a>
                  )}

                  <select
                    value={g.durum}
                    disabled={islemde}
                    onChange={(e) => calistir(() => gorusmeDurumDegistir(g.id, e.target.value as GorusmeDurum))}
                    className="h-8 flex-none rounded-[7px] border-0 px-[7px] font-mono text-[9.5px] tracking-[0.08em] uppercase outline-none"
                    style={{ background: renk.bg, color: renk.fg }}
                  >
                    {(Object.keys(GORUSME_DURUM_ETIKET) as GorusmeDurum[]).map((d) => (
                      <option key={d} value={d}>
                        {GORUSME_DURUM_ETIKET[d]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setAcikId(acik ? null : g.id)}
                    className="inline-flex h-8 flex-none items-center gap-[5px] rounded-[7px] bg-brand px-3 text-[12.5px] font-semibold text-white transition hover:bg-ink"
                  >
                    {acik ? "Kapat" : "Aç"}
                  </button>
                </div>

                {acik && (
                  <Detay
                    g={g}
                    ayarlar={ayarlar}
                    islemde={islemde}
                    calistir={calistir}
                    kapat={() => setAcikId(null)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

function Detay({
  g,
  ayarlar,
  islemde,
  calistir,
  kapat,
}: {
  g: Gorusme;
  ayarlar: GorusmeAyarlari;
  islemde: boolean;
  calistir: (fn: () => Promise<{ error?: string } | void>, sonra?: () => void) => void;
  kapat: () => void;
}) {
  const [baslangic, setBaslangic] = useState(yerelInput(g.baslangic));
  const [sureDk, setSureDk] = useState(String(g.sureDk || ayarlar.sureDk));
  const [toplantiLink, setToplantiLink] = useState(g.toplantiLink);
  const [adminNotu, setAdminNotu] = useState(g.adminNotu);
  const [referans, setReferans] = useState(g.odemeReferansi);

  const odemeBekliyor = !g.ucretsiz && !g.odendi;

  return (
    <div className="border-t border-ink/7 bg-[#FAFBFF] px-[22px] py-5">
      {(g.aciklama || g.tercihZaman || g.kisiEmail) && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className={ETIKET}>Öğrenci</div>
            <p className="mt-[6px] text-[13.5px] text-[#3A3F4F]">
              {g.kisiAd}
              {g.kisiEmail && <span className="block font-mono text-[11px] text-[#8A8F9E]">{g.kisiEmail}</span>}
            </p>
          </div>
          <div>
            <div className={ETIKET}>Tercih ettiği zamanlar</div>
            <p className="mt-[6px] text-[13.5px] text-[#3A3F4F]">{g.tercihZaman || "Belirtilmedi"}</p>
          </div>
          {g.aciklama && (
            <div className="sm:col-span-2">
              <div className={ETIKET}>Öğrencinin notu</div>
              <p className="mt-[6px] text-[13.5px] leading-[1.65] whitespace-pre-line text-[#3A3F4F]">{g.aciklama}</p>
            </div>
          )}
        </div>
      )}

      {odemeBekliyor && (
        <div className="mb-5 rounded-[11px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.07)] px-4 py-4">
          <div className="font-mono text-[10px] tracking-[0.12em] text-[#A5711A] uppercase">
            Ödeme onayı bekliyor{g.ucret ? ` · ${para(g.ucret)}` : ""}
          </div>
          <p className="mt-2 text-[13px] text-[#5C6273]">
            Havale geldiyse onayla — talep planlama kuyruğuna geri döner.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-2">
              <span className={ETIKET}>Dekont / referans</span>
              <input
                type="text"
                value={referans}
                onChange={(e) => setReferans(e.target.value)}
                placeholder="Örn. 12.08 havale — TR33…"
                className={`${ALAN} w-[260px]`}
              />
            </label>
            <button
              type="button"
              disabled={islemde}
              onClick={() => calistir(() => gorusmeOdemeOnayla(g.id, referans))}
              className="inline-flex h-[42px] items-center gap-[6px] rounded-[9px] bg-[#157A4E] px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink disabled:opacity-60"
            >
              <Icon name="check" size={15} />
              Ödemeyi onayla
            </button>
          </div>
        </div>
      )}

      <div className={ETIKET}>Görüşmeyi planla</div>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Tarih ve saat</span>
          <input
            type="datetime-local"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
            className={ALAN}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Süre (dk)</span>
          <input type="number" value={sureDk} onChange={(e) => setSureDk(e.target.value)} className={ALAN} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Toplantı linki</span>
          <input
            type="text"
            value={toplantiLink}
            onChange={(e) => setToplantiLink(e.target.value)}
            placeholder="https://meet.google.com/…"
            className={ALAN}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Not (öğrenci de okuyabilir)</span>
          <input
            type="text"
            value={adminNotu}
            onChange={(e) => setAdminNotu(e.target.value)}
            placeholder="Hazırlık notu"
            className={ALAN}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={islemde || odemeBekliyor}
          onClick={() =>
            calistir(() => gorusmePlanla({ id: g.id, baslangic, sureDk, toplantiLink, adminNotu }), kapat)
          }
          className="h-[42px] rounded-[9px] bg-brand px-5 text-[13.5px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {islemde ? "Kaydediliyor…" : "Planla ve bildir"}
        </button>
        {odemeBekliyor && (
          <span className="self-center text-[12.5px] text-[#8A8F9E]">Önce ödemeyi onayla.</span>
        )}
      </div>
    </div>
  );
}

function AyarFormu({
  ayarlar,
  islemde,
  calistir,
}: {
  ayarlar: GorusmeAyarlari;
  islemde: boolean;
  calistir: (fn: () => Promise<{ error?: string } | void>, sonra?: () => void) => void;
}) {
  const [form, setForm] = useState({
    ucretsizHak: String(ayarlar.ucretsizHak),
    ucret: String(ayarlar.ucret),
    sureDk: String(ayarlar.sureDk),
    odemeAciklamasi: ayarlar.odemeAciklamasi,
    aktif: ayarlar.aktif,
  });

  return (
    <div className="mt-5 rounded-2xl border border-brand/30 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Hak ve ücret ayarları</h2>
      <p className="mt-1 text-[13.5px] text-[#5C6273]">
        Ücretsiz hak sayısı ve ücret, talep oluşturulurken veritabanında uygulanır — öğrenci tarafından
        değiştirilemez.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Ücretsiz hak (kişi başı)</span>
          <input
            type="number"
            value={form.ucretsizHak}
            onChange={(e) => setForm({ ...form, ucretsizHak: e.target.value })}
            className={ALAN}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Ücretli görüşme bedeli (₺)</span>
          <input
            type="text"
            inputMode="decimal"
            value={form.ucret}
            onChange={(e) => setForm({ ...form, ucret: e.target.value })}
            className={ALAN}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={ETIKET}>Varsayılan süre (dk)</span>
          <input
            type="number"
            value={form.sureDk}
            onChange={(e) => setForm({ ...form, sureDk: e.target.value })}
            className={ALAN}
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className={ETIKET}>Ödeme talimatı (öğrenciye gösterilir)</span>
        <textarea
          value={form.odemeAciklamasi}
          onChange={(e) => setForm({ ...form, odemeAciklamasi: e.target.value })}
          placeholder={"IBAN: TR…\nAd Soyad: …\nAçıklamaya adını ve görüşme konusunu yaz."}
          className="min-h-[110px] resize-y rounded-[9px] border border-ink/13 bg-white px-[12px] py-3 text-[13.5px] leading-[1.6] text-ink outline-none focus:border-brand"
        />
      </label>

      <label className="mt-4 flex items-center gap-[10px] text-[13.5px] text-[#3A3F4F]">
        <input
          type="checkbox"
          checked={form.aktif}
          onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
          className="h-4 w-4 accent-[#1C56F3]"
        />
        Görüşme talepleri açık
      </label>

      <button
        type="button"
        disabled={islemde}
        onClick={() => calistir(() => gorusmeAyarKaydet(form))}
        className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-ink disabled:opacity-60"
      >
        {islemde ? "Kaydediliyor…" : "Ayarları kaydet"}
      </button>

      <p className="mt-4 border-t border-ink/8 pt-4 font-mono text-[11px] text-[#8A8F9E]">
        Veritabanında kayıtlı hâli: {ayarlar.ucretsizHak} ücretsiz hak · {para(ayarlar.ucret)} · {ayarlar.sureDk} dk ·
        talepler {ayarlar.aktif ? "açık" : "kapalı"} · ödeme talimatı{" "}
        {ayarlar.odemeAciklamasi ? `${ayarlar.odemeAciklamasi.length} karakter` : "boş"}
      </p>
    </div>
  );
}
