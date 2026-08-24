"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  katilimciCikar,
  katilimciEkle,
  odemeEkle,
  odemeDurumDegistir,
  odemeSil,
  odemeBildiriminiGonder,
  odemeOnlineDegistir,
} from "@/app/kontrol-9f4x2k/(protected)/odemeler/actions";
import { durumStil } from "@/lib/admin/shared";
import { para, odemeDurumEtiket, tarihBicimi } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";

export type OdemeSatir = {
  id: string;
  isim: string;
  program: string;
  tutar: number;
  yontem: string;
  durum: "odendi" | "bekliyor" | "iade";
  odemeTarihi: string;
  faturaNo: string;
  onlineOdeme: boolean;
  /** Öğrencinin "havaleyi yaptım" bildirimi. Tahsilatın kanıtı değil. */
  havaleBildirimi: string | null;
  /** Kaç kişilik satıldı. 1 ise bireysel. */
  koltukSayisi: number;
  /** Ödeyen dışındaki katılımcılar. */
  katilimcilar: { id: string; ad: string }[];
  /** Ödemeyi yapanın kullanıcı kimliği; katılımcı listesinden elenmesi için. */
  odeyenId: string;
};

export type SecimOgesi = { id: string; ad: string };

const filtreler: { id: "hepsi" | "odendi" | "bekliyor" | "iade"; ad: string }[] = [
  { id: "hepsi", ad: "Tümü" },
  { id: "odendi", ad: "Ödendi" },
  { id: "bekliyor", ad: "Onay bekliyor" },
  { id: "iade", ad: "İade" },
];

export function OdemeYonetimi({
  odemeler,
  ogrenciler,
  kurslar,
}: {
  odemeler: OdemeSatir[];
  ogrenciler: SecimOgesi[];
  kurslar: SecimOgesi[];
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [filtre, setFiltre] = useState<"hepsi" | "odendi" | "bekliyor" | "iade">("hepsi");
  const [formAcik, setFormAcik] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, startTransition] = useTransition();

  const bugun = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    userId: "",
    courseId: "",
    tutar: "",
    yontem: "Havale / EFT",
    durum: "odendi" as "odendi" | "bekliyor" | "iade",
    odemeTarihi: bugun,
    faturaNo: "",
    onlineOdeme: true,
    koltukSayisi: "1",
  });

  const listelenen = useMemo(
    () => (filtre === "hepsi" ? odemeler : odemeler.filter((o) => o.durum === filtre)),
    [filtre, odemeler],
  );

  const toplam = odemeler.filter((o) => o.durum === "odendi").reduce((n, o) => n + o.tutar, 0);

  const kaydet = () => {
    setHata(null);
    startTransition(async () => {
      const r = await odemeEkle(form);
      if (r?.error) {
        setHata(r.error);
        bildir.hata(r.error);
      } else {
        // Uyarı varsa onu göster: kayıt oluştu ama öğrenci haberdar edilemedi.
        if (r?.uyari) bildir.hata(r.uyari);
        else bildir.basarili("Ödeme kaydedildi, katılımcıya bildirim gönderildi.");
        setForm({ ...form, userId: "", courseId: "", tutar: "", faturaNo: "", koltukSayisi: "1" });
        setFormAcik(false);
        router.refresh();
      }
    });
  };

  const katilimciyiEkle = (paymentId: string) => {
    const secilen = eklenecek;
    startTransition(async () => {
      const r = await katilimciEkle(paymentId, secilen);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      // Koltuk aşıldıysa kayıt yine oluştu; uyarı engel değil, bilgi.
      if (r?.uyari) bildir.bilgi(r.uyari);
      else bildir.basarili("Katılımcı eklendi; testi ve eğitim erişimi açıldı.");
      setEklenecek("");
      router.refresh();
    });
  };

  const katilimciyiCikar = (paymentId: string, userId: string, ad: string) => {
    startTransition(async () => {
      const r = await katilimciCikar(paymentId, userId);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(`${ad} kurumsal kayıttan çıkarıldı.`);
      router.refresh();
    });
  };

  const durumDegistir = (id: string, durum: "odendi" | "bekliyor" | "iade") => {
    startTransition(async () => {
      const r = await odemeDurumDegistir(id, durum);
      if (r?.error) bildir.hata(r.error);
      else {
        if (r?.uyari) bildir.hata(r.uyari);
        else bildir.basarili("Ödeme durumu güncellendi.");
        router.refresh();
      }
    });
  };

  const onlineDegistir = (id: string, acik: boolean) => {
    startTransition(async () => {
      const r = await odemeOnlineDegistir(id, acik);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili(acik ? "Kartla ödemeye açıldı." : "Kartla ödemeye kapatıldı.");
        router.refresh();
      }
    });
  };

  /*
    Mail göndermek geri alınamayan, dışarıya çıkan bir iş: yanlış tıklama
    gerçek bir kişinin gelen kutusuna düşüyor. Düğme bu yüzden iki adımlı —
    ilk tıklama onay istiyor, ikincisi gönderiyor. Onay penceresi yerine
    satır içi: pencere, listede on satır arasında hangisine bastığını
    unutturuyor.
  */
  const [onayBekleyen, setOnayBekleyen] = useState<string | null>(null);
  /** Katılımcı listesi açık olan ödeme. Aynı anda tek satır açılıyor. */
  const [acikKatilimci, setAcikKatilimci] = useState<string | null>(null);
  const [eklenecek, setEklenecek] = useState("");

  const bildirimGonder = (id: string, isim: string) => {
    if (onayBekleyen !== id) {
      setOnayBekleyen(id);
      // Onay açık kalıp sonraki tıklamada yanlışlıkla gönderilmesin.
      window.setTimeout(() => setOnayBekleyen((mevcut) => (mevcut === id ? null : mevcut)), 5000);
      return;
    }

    setOnayBekleyen(null);
    startTransition(async () => {
      const r = await odemeBildiriminiGonder(id);
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(
        r?.gonderilen === "acildi"
          ? `${isim} kişisine “ödemen tanımlandı” bildirimi gönderildi.`
          : `${isim} kişisine “ödemen alındı” bildirimi gönderildi.`,
      );
      router.refresh();
    });
  };

  const sil = (id: string) => {
    startTransition(async () => {
      const r = await odemeSil(id);
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Ödeme kaydı silindi.");
        router.refresh();
      }
    });
  };

  return (
    <main className="p-4 pb-14 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Ödemeler
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
            {odemeler.length} kayıt · toplam tahsilat {para(toplam)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAcik((v) => !v)}
          className="inline-flex h-10 items-center gap-[6px] rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
        >
          {!formAcik && <Icon name="plus" size={15} />}
          {formAcik ? "Vazgeç" : "Ödeme kaydet"}
        </button>
      </div>

      {formAcik && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Yeni ödeme kaydı</h2>
          <p className="mt-1 text-[13.5px] text-[#656B7A]">
            Satış site dışında yapıldığı için ödemeyi buraya elle kaydediyorsun.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Öğrenci</span>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
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
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Tutar (₺)</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.tutar}
                onChange={(e) => setForm({ ...form, tutar: e.target.value })}
                placeholder="32400"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Yöntem</span>
              <input
                type="text"
                value={form.yontem}
                onChange={(e) => setForm({ ...form, yontem: e.target.value })}
                placeholder="Havale / EFT"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Tarih</span>
              <input
                type="date"
                value={form.odemeTarihi}
                onChange={(e) => setForm({ ...form, odemeTarihi: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Durum</span>
              <select
                value={form.durum}
                onChange={(e) => setForm({ ...form, durum: e.target.value as typeof form.durum })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              >
                <option value="odendi">Ödendi</option>
                <option value="bekliyor">Onay bekliyor</option>
                <option value="iade">İade edildi</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              {/* Kurumsal alımda tek tahsilat, tek fatura, birkaç katılımcı.
                  Sayı ödeyene "4 kişilik kurumsal kayıt" olarak gösteriliyor. */}
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">
                Koltuk sayısı
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={form.koltukSayisi}
                onChange={(e) => setForm({ ...form, koltukSayisi: e.target.value })}
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#656B7A] uppercase">Fatura no</span>
              <input
                type="text"
                value={form.faturaNo}
                onChange={(e) => setForm({ ...form, faturaNo: e.target.value })}
                placeholder="opsiyonel"
                className="h-[46px] rounded-[10px] border border-ink/13 bg-white px-[13px] text-sm text-ink outline-none focus:border-brand"
              />
            </label>
          </div>

          {form.durum === "bekliyor" && (
            <label className="mt-4 flex cursor-pointer items-start gap-[10px] rounded-[10px] border border-ink/12 bg-mist px-4 py-3">
              <input
                type="checkbox"
                checked={form.onlineOdeme}
                onChange={(e) => setForm({ ...form, onlineOdeme: e.target.checked })}
                className="mt-[3px] h-[16px] w-[16px] flex-none accent-brand"
              />
              <span className="text-[13px] leading-[1.55] text-[#3A3F4F]">
                Öğrenci bu tutarı panelden kartla ödeyebilsin.
                <span className="mt-[2px] block text-[12.5px] text-[#656B7A]">
                  Havaleyle anlaştıysan kapat; yoksa aynı borç iki kez tahsil edilebilir.
                </span>
              </span>
            </label>
          )}

          {hata && <div className="mt-4 text-sm text-danger-ink">{hata}</div>}

          <button
            type="button"
            onClick={kaydet}
            disabled={islemde}
            className="mt-5 h-[46px] rounded-[10px] bg-brand px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-60"
          >
            {islemde ? "Kaydediliyor…" : "Ödemeyi kaydet"}
          </button>
        </div>
      )}

      <div className="mt-[22px] flex flex-wrap gap-2">
        {filtreler.map((f) => {
          const secili = filtre === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              className="h-[42px] rounded-[10px] border px-[15px] text-[13.5px] font-semibold hover:border-brand"
              style={{
                background: secili ? "#0A0D18" : "#FFFFFF",
                color: secili ? "#FFFFFF" : "#3A3F4F",
                borderColor: secili ? "#0A0D18" : "rgba(10,13,24,0.13)",
              }}
            >
              {f.ad}
            </button>
          );
        })}
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr_190px] min-w-[940px] gap-4 border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#656B7A] uppercase">
            <span>Öğrenci</span>
            <span>Eğitim</span>
            <span>Tarih</span>
            <span>Yöntem</span>
            <span className="text-right">Tutar</span>
            <span />
          </div>

          {listelenen.length === 0 ? (
            <div className="px-[22px] py-10 text-center text-sm text-[#656B7A]">
              {odemeler.length === 0 ? "Henüz ödeme kaydı yok." : "Bu filtreyle eşleşen kayıt yok."}
            </div>
          ) : (
            listelenen.map((o) => {
              const etiket = odemeDurumEtiket[o.durum];
              const st = durumStil(etiket);
              return (
                <div key={o.id} className="border-b border-ink/7 last:border-b-0">
                <div
                  className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr_190px] min-w-[940px] items-center gap-4 px-[22px] py-[14px] hover:bg-[#F7F9FF]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{o.isim}</div>
                    {o.faturaNo && (
                      <div className="truncate font-mono text-[10px] text-[#656B7A]">{o.faturaNo}</div>
                    )}
                    {/* Öğrenci havaleyi yaptığını söyledi. Ekstreden doğrulanınca
                        durum "Ödendi" yapılacak; bu yalnızca bir hatırlatma. */}
                    {o.durum === "bekliyor" && o.havaleBildirimi && (
                      <div className="mt-[3px] inline-flex items-center gap-[5px] rounded-full bg-[#FDF6E7] px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-[#8A6210] uppercase">
                        Havale bildirildi
                      </div>
                    )}
                    {/*
                      Kurumsal kayıt rozeti aynı zamanda katılımcı panelinin
                      düğmesi. Ayrı bir sütun açılmadı: bireysel kayıtlarda
                      sürekli boş duran bir sütun, tablonun okunmasını
                      zorlaştırırdı.
                    */}
                    {(o.koltukSayisi > 1 || o.katilimcilar.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setAcikKatilimci(acikKatilimci === o.id ? null : o.id)}
                        className="mt-[4px] inline-flex items-center gap-[5px] rounded-full bg-mist px-[8px] py-[2px] text-[11px] font-semibold text-[#4A5060] transition hover:text-brand"
                      >
                        <Icon name="users" size={12} />
                        {o.katilimcilar.length + 1}/{o.koltukSayisi} koltuk
                      </button>
                    )}
                  </div>
                  <div className="min-w-0 truncate text-[13.5px] text-[#3A3F4F]">{o.program}</div>
                  <div className="font-mono text-[11px] text-[#5C6273]">
                    {tarihBicimi.format(new Date(o.odemeTarihi))}
                  </div>
                  <div className="min-w-0 truncate text-[13px] text-[#5C6273]">{o.yontem || "—"}</div>
                  <div className="text-right font-heading text-[15px] font-semibold">{para(o.tutar)}</div>
                  <div className="flex items-center justify-end gap-2">
                    <select
                      aria-label="Ödeme durumu"
                      value={o.durum}
                      disabled={islemde}
                      onChange={(e) => durumDegistir(o.id, e.target.value as OdemeSatir["durum"])}
                      className="h-8 rounded-[7px] border-0 px-[7px] font-mono text-[9.5px] tracking-[0.08em] uppercase outline-none"
                      style={{ background: st.bg, color: st.renk }}
                    >
                      <option value="odendi">Ödendi</option>
                      <option value="bekliyor">Bekliyor</option>
                      <option value="iade">İade</option>
                    </select>
                    {o.durum === "bekliyor" && (
                      <button
                        type="button"
                        disabled={islemde}
                        onClick={() => onlineDegistir(o.id, !o.onlineOdeme)}
                        aria-pressed={o.onlineOdeme}
                        title={
                          o.onlineOdeme
                            ? "Panelden kartla ödenebilir — kapatmak için tıkla"
                            : "Kartla ödemeye kapalı — açmak için tıkla"
                        }
                        className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border transition disabled:opacity-50"
                        style={{
                          borderColor: o.onlineOdeme ? "rgba(28,86,243,0.4)" : "rgba(10,13,24,0.12)",
                          background: o.onlineOdeme ? "rgba(28,86,243,0.1)" : "#FFFFFF",
                          color: o.onlineOdeme ? "#1C56F3" : "#9AA0AE",
                        }}
                      >
                        <Icon name="card" size={14} />
                      </button>
                    )}
                    {/* İade edilmiş kayıt için gönderilecek bir bildirim yok. */}
                    {o.durum !== "iade" &&
                      (onayBekleyen === o.id ? (
                        <button
                          type="button"
                          disabled={islemde}
                          onClick={() => bildirimGonder(o.id, o.isim)}
                          className="h-8 flex-none rounded-[7px] border border-brand bg-brand px-2.5 font-mono text-[9.5px] tracking-[0.06em] text-white uppercase transition hover:bg-ink hover:border-ink disabled:opacity-50"
                        >
                          Gönder?
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={islemde}
                          onClick={() => bildirimGonder(o.id, o.isim)}
                          title={
                            o.durum === "bekliyor"
                              ? "“Ödemen tanımlandı” bildirimini tekrar gönder"
                              : "“Ödemen alındı” bildirimini tekrar gönder"
                          }
                          aria-label="Bildirimi tekrar gönder"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-ink/12 text-[#656B7A] transition hover:border-brand/45 hover:text-brand disabled:opacity-50"
                        >
                          <Icon name="mail" size={14} />
                        </button>
                      ))}
                    <button
                      type="button"
                      disabled={islemde}
                      onClick={() => sil(o.id)}
                      aria-label="Ödemeyi sil"
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-ink/12 text-[#656B7A] transition hover:border-danger/45 hover:text-danger disabled:opacity-50"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>

                {acikKatilimci === o.id && (
                  <div className="min-w-[940px] border-t border-ink/7 bg-[#FBFCFF] px-[22px] py-4">
                    <div className="font-mono text-[9px] tracking-[0.12em] text-[#656B7A] uppercase">
                      Kurumsal katılımcılar
                    </div>
                    <p className="mt-[6px] max-w-[560px] text-[12.5px] leading-[1.55] text-[#656B7A]">
                      Ödemeyi <strong className="font-semibold text-ink">{o.isim}</strong> yaptı; erişimi
                      zaten var. Buraya eklenen kişilere ön değerlendirme testi ve birebir eğitim erişimi
                      açılır — önce kendi üyeliklerini oluşturmuş olmaları gerekiyor.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {o.katilimcilar.length === 0 && (
                        <span className="text-[13px] text-[#8A90A0]">Henüz katılımcı eklenmedi.</span>
                      )}
                      {o.katilimcilar.map((k) => (
                        <span
                          key={k.id}
                          className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white py-[4px] pr-[6px] pl-[11px] text-[13px]"
                        >
                          {k.ad}
                          <button
                            type="button"
                            disabled={islemde}
                            onClick={() => katilimciyiCikar(o.id, k.id, k.ad)}
                            aria-label={`${k.ad} katılımcılıktan çıkar`}
                            className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[#9AA0AE] transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                          >
                            <Icon name="x" size={11} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={eklenecek}
                        onChange={(e) => setEklenecek(e.target.value)}
                        className="h-[36px] min-w-[220px] rounded-[9px] border border-ink/13 bg-white px-[10px] text-[13px] outline-none focus:border-brand"
                      >
                        <option value="">Katılımcı seç…</option>
                        {ogrenciler
                          .filter(
                            // o.id ÖDEME kimliği; kişiyle karşılaştırmak
                            // ödeyeni listeden hiç elemiyordu.
                            (g) => g.id !== o.odeyenId && !o.katilimcilar.some((k) => k.id === g.id),
                          )
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.ad}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={islemde || !eklenecek}
                        onClick={() => katilimciyiEkle(o.id)}
                        className="h-[36px] rounded-[9px] border border-ink/13 bg-white px-4 text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
