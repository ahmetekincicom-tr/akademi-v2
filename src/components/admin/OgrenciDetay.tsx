"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kayitEkle, kayitKaldir } from "@/app/kontrol-9f4x2k/(protected)/ogrenciler/actions";
import {
  oturumEkle,
  oturumSil,
  oturumKayitLinki,
  oturumDurumDegistir,
  arsivEkle,
  arsivGuncelle,
  arsivSil,
} from "@/app/kontrol-9f4x2k/(protected)/birebir-egitim/actions";
import { Icon } from "@/components/Icon";
import { useBildirim } from "@/components/Bildirim";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { konumEtiketi, cihazEtiketi } from "@/lib/oturum";
import { TR_ZAMAN } from "@/lib/zaman";
import type { AdminKurs, AdminOgrenci } from "@/components/admin/OgrenciYonetimi";
import { temasiKisiyeBagla } from "@/app/kontrol-9f4x2k/(protected)/meta/actions";
import { onDegerlendirmeIsaretle } from "@/app/panel/on-degerlendirme/actions";
import { BAGLAM_ETIKET } from "@/lib/riza-tipleri";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  year: "numeric",
});
/* Onay listesinde yıl da yazılıyor: eski hesapların onayları geçen yıla ait
   olabiliyor ve "12 Mart 14:20" hangi yıl olduğunu söylemiyor. */
const onayBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const ALAN =
  "h-[34px] rounded-[8px] border border-ink/13 bg-white px-[10px] text-[13px] text-ink outline-none focus:border-brand";
const BASLIK = "font-mono text-[9px] tracking-[0.12em] text-[#656B7A] uppercase";

function basHarfler(isim: string) {
  return isim
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Bir öğrencinin tüm yönetimi: eğitim kayıtları, birebir eğitim takvimi ve
 * giriş hareketleri.
 *
 * Birebir eğitim buraya da kondu, bilerek: eskiden yalnızca ayrı bir sekmede
 * vardı ve orada önce açılır listeden kişi aramak gerekiyordu. Panele hiç
 * girmemiş, dışarıdan aktarılmış bir kişiye kayıt açarken bu iki ekran
 * arasında gidip gelmek gerekiyordu. Artık kişiyi bul, her şeyi burada yap.
 */
export function OgrenciDetay({
  ogrenci,
  kurslar,
  kapat,
}: {
  ogrenci: AdminOgrenci;
  kurslar: AdminKurs[];
  kapat: () => void;
}) {
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();

  const [eklenecekKurs, setEklenecekKurs] = useState("");
  const [formAcik, setFormAcik] = useState(false);
  const [yeni, setYeni] = useState({
    baslangic: "",
    sureDk: "60",
    konu: "",
    toplantiLink: "",
    kayitLink: "",
    courseId: "",
  });
  const [kayitLinkleri, setKayitLinkleri] = useState<Record<string, string>>({});
  const [arsivAcik, setArsivAcik] = useState(false);
  const [yeniArsiv, setYeniArsiv] = useState({ link: "", baslik: "", aciklama: "", courseId: "" });
  // Sunucudaki satırın üzerine yazılmıyor; kaydedilene kadar taslak ayrı
  // duruyor ki "Kaydet" düğmesi gerçekten değişiklik olduğunda açılsın.
  const [arsivTaslak, setArsivTaslak] = useState<Record<string, { baslik: string; link: string }>>({});
  const [onayAcik, setOnayAcik] = useState(false);
  const [temasKodu, setTemasKodu] = useState("");
  // Şüphe varsa açık gelsin; yönetici o zaman zaten bakacak.
  const [girisAcik, setGirisAcik] = useState(ogrenci.sinyal.supheli);

  const atanabilir = kurslar.filter((k) => !ogrenci.kayitlar.some((r) => r.courseId === k.id));

  const calistir = (
    isim: string,
    is: () => Promise<{ error?: string; uyari?: string } | undefined>,
    sonra?: () => void,
  ) => {
    startTransition(async () => {
      const r = await is();
      if (r?.error) {
        bildir.hata(r.error);
        return;
      }
      bildir.basarili(isim);
      // İşlem oldu ama bildirim maili gitmedi: hata değil, ama sessizce
      // geçilirse katılımcının haberi olduğu sanılır.
      if (r?.uyari) bildir.bilgi(r.uyari);
      sonra?.();
      router.refresh();
    });
  };

  return (
    <div className="border-y-2 border-brand/30 bg-[#FBFCFF]">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/8 px-4 py-3 sm:px-5">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white font-mono text-[11px] font-medium text-[#5C6273]">
          {basHarfler(ogrenci.isim)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[16px] font-semibold tracking-[-0.02em]">{ogrenci.isim}</div>
          <div className="mt-[3px] truncate font-mono text-[10.5px] text-[#656B7A]">{ogrenci.eposta}</div>
        </div>
        <button
          type="button"
          onClick={kapat}
          aria-label="Kapat"
          className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[8px] border border-ink/13 bg-white text-[#5C6273] transition hover:border-ink hover:text-ink"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* -------------------------------------------- ön değerlendirme --- */}
      {/*
        Elle işaretleme YÖNETİCİDE, katılımcıda değil.

        Eskiden katılımcının panelinde "formu doldurdum" düğmesi vardı ve
        formu hiç açmadan basılabiliyordu. Bu adım eğitim planlamasının
        kapısı: yanlış işaretlendiğinde eğitmen ön değerlendirmeyi okumadan
        tarih planlıyor.

        Normal yol artık Tally webhook'u. Burası istisna için: webhook
        kurulmadan önce doldurulmuş formlar, Tally kesintisi, telefonla
        alınan cevap.
      */}
      <div className="border-b border-ink/8 px-4 py-3 sm:px-5">
        <div className={BASLIK}>Ön değerlendirme</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {ogrenci.onDegerlendirme ? (
            <>
              <span className="inline-flex items-center gap-[6px] rounded-full bg-[rgba(24,140,90,0.13)] px-[10px] py-[3px] text-[12.5px] font-semibold text-[#15774E]">
                <Icon name="check" size={12} strokeWidth={2.6} />
                {onayBicimi.format(new Date(ogrenci.onDegerlendirme))}
              </span>
              <button
                type="button"
                disabled={islemde}
                onClick={() =>
                  calistir("İşaret kaldırıldı.", () => onDegerlendirmeIsaretle(ogrenci.id, false))
                }
                className="h-[30px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-[#5C6273] transition hover:border-danger/40 hover:text-danger disabled:opacity-50"
              >
                İşareti kaldır
              </button>
            </>
          ) : (
            <>
              <span className="text-[12.5px] text-[#8A90A0]">Form henüz gelmedi.</span>
              <button
                type="button"
                disabled={islemde}
                onClick={() =>
                  calistir("Ön değerlendirme dolduruldu olarak işaretlendi.", () =>
                    onDegerlendirmeIsaretle(ogrenci.id, true),
                  )
                }
                className="h-[30px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
              >
                Elle işaretle
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------- geliş kaynağı --- */}
      {/*
        WhatsApp yolunun tek köprüsü.

        Kişi reklama tıklayıp WhatsApp'a yazdığında mesajın içinde kısa bir
        referans kodu geliyor. Burada yapıştırılmazsa tıklama kimliği kişiye
        hiç yapışmıyor ve günler sonra gelen ödeme reklama bağlanamıyor —
        ölçümlemenin sessizce boş kaldığı yer tam olarak burası.
      */}
      <div className="border-b border-ink/8 px-4 py-3 sm:px-5">
        <div className={BASLIK}>Geliş kaynağı</div>
        {ogrenci.temasKodu ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-[7px] bg-white px-[9px] py-[3px] font-mono text-[12px] font-semibold tracking-[0.08em] text-ink">
              {ogrenci.temasKodu}
            </code>
            <span className="text-[12.5px] text-[#656B7A]">
              tıklama kimliği bağlı{ogrenci.kaynak ? ` · ${ogrenci.kaynak}` : ""}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={temasKodu}
              onChange={(e) => setTemasKodu(e.target.value.toUpperCase())}
              placeholder="WhatsApp mesajındaki kod"
              maxLength={8}
              className="h-[34px] w-[190px] rounded-[8px] border border-ink/14 bg-white px-3 font-mono text-[12.5px] tracking-[0.08em] outline-none focus:border-brand"
            />
            <button
              type="button"
              disabled={islemde || temasKodu.trim().length < 4}
              onClick={() =>
                calistir("Tıklama kaydı kişiye bağlandı.", () => temasiKisiyeBagla(temasKodu, ogrenci.id), () =>
                  setTemasKodu(""),
                )
              }
              className="h-[34px] rounded-[8px] border border-ink/13 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-40"
            >
              Bağla
            </button>
            <span className="text-[12px] text-[#8A90A0]">
              Kodlar Meta ölçümleme ekranında listeleniyor.
            </span>
          </div>
        )}
      </div>

      {/* ---------------------------------------------- eğitim kayıtları --- */}
      <div className="px-4 py-4 sm:px-5">
        <div className={BASLIK}>Kayıtlı eğitimler</div>
        <div className="mt-2 flex flex-col gap-1.5">
          {ogrenci.kayitlar.length === 0 && (
            <div className="rounded-[9px] border border-dashed border-ink/16 px-3 py-3 text-center text-[12.5px] text-[#656B7A]">
              Bu öğrenciye henüz eğitim atanmamış.
            </div>
          )}
          {ogrenci.kayitlar.map((r) => (
            <div
              key={r.courseId}
              className="flex flex-wrap items-center gap-2.5 rounded-[9px] border border-ink/11 bg-white px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.baslik}</span>
              <span className="font-mono text-[10.5px] text-[#5C6273]">
                {r.yuzde}% · {r.tamamlanan}/{r.dersSayisi} ders
              </span>
              <span className="font-mono text-[10.5px] text-[#656B7A]">
                {tarihBicimi.format(new Date(r.atanmaTarihi))}
              </span>
              <button
                type="button"
                disabled={islemde}
                onClick={() =>
                  calistir("Eğitim kaydı kaldırıldı.", () => kayitKaldir(ogrenci.id, r.courseId))
                }
                className="h-[26px] rounded-[7px] border border-ink/13 bg-white px-2.5 text-[11.5px] font-semibold text-[#5C6273] hover:border-danger/40 hover:text-danger disabled:opacity-50"
              >
                Çıkar
              </button>
            </div>
          ))}
        </div>

        {atanabilir.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <select
              aria-label="Atanacak eğitim"
              value={eklenecekKurs}
              onChange={(e) => setEklenecekKurs(e.target.value)}
              className={`${ALAN} min-w-[200px] flex-1`}
            >
              <option value="">Eğitim seç…</option>
              {atanabilir.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.baslik}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!eklenecekKurs || islemde}
              onClick={() =>
                calistir(
                  `${ogrenci.isim} eğitime atandı.`,
                  () => kayitEkle(ogrenci.id, eklenecekKurs),
                  () => setEklenecekKurs(""),
                )
              }
              className="h-[34px] flex-none rounded-[8px] bg-brand px-3.5 text-[13px] font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Eğitimi ata
            </button>
          </div>
        )}
      </div>

      {/* -------------------------------------------------- kayıt arşivi ---
          Takvimden önce geliyor: bir katılımcıya bakarken en sık sorulan
          "kayıtları paylaştım mı" ve oturum listesi uzadıkça bu satır aşağıda
          kaybolurdu. */}
      <div className="border-t border-ink/8 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={BASLIK}>Eğitim kayıtları</div>
          <button
            type="button"
            onClick={() => setArsivAcik((a) => !a)}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Icon name={arsivAcik ? "x" : "plus"} size={14} />
            {arsivAcik ? "Vazgeç" : "Klasör ekle"}
          </button>
        </div>

        {arsivAcik && (
          <div className="mt-3 rounded-[12px] border border-brand/25 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12.5px] font-semibold text-ink">Klasör bağlantısı</span>
                <input
                  value={yeniArsiv.link}
                  onChange={(e) => setYeniArsiv({ ...yeniArsiv, link: e.target.value })}
                  placeholder="https://drive.google.com/drive/folders/…"
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Başlık</span>
                <input
                  value={yeniArsiv.baslik}
                  onChange={(e) => setYeniArsiv({ ...yeniArsiv, baslik: e.target.value })}
                  placeholder="Ders kayıtları"
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Program</span>
                <select
                  value={yeniArsiv.courseId}
                  onChange={(e) => setYeniArsiv({ ...yeniArsiv, courseId: e.target.value })}
                  className={ALAN}
                >
                  <option value="">Genel</option>
                  {kurslar.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.baslik}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12.5px] font-semibold text-ink">Not (katılımcı görür)</span>
                <input
                  value={yeniArsiv.aciklama}
                  onChange={(e) => setYeniArsiv({ ...yeniArsiv, aciklama: e.target.value })}
                  placeholder="Kayıtlar ders bitiminden birkaç saat sonra klasöre ekleniyor."
                  className={ALAN}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={islemde || !yeniArsiv.link.trim()}
              onClick={() =>
                calistir(
                  "Kayıt klasörü paylaşıldı.",
                  () => arsivEkle({ userId: ogrenci.id, ...yeniArsiv }),
                  () => {
                    setYeniArsiv({ link: "", baslik: "", aciklama: "", courseId: "" });
                    setArsivAcik(false);
                  },
                )
              }
              className="mt-4 h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Klasörü paylaş
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-1.5">
          {ogrenci.arsiv.length === 0 && !arsivAcik && (
            <div className="rounded-[9px] border border-dashed border-ink/16 px-3 py-3 text-center text-[12.5px] text-[#656B7A]">
              Bu katılımcıya henüz kayıt klasörü paylaşılmamış.
            </div>
          )}

          {ogrenci.arsiv.map((a) => {
            const taslak = arsivTaslak[a.id] ?? a;
            const degisti = taslak.link !== a.link || taslak.baslik !== a.baslik;
            return (
              <div key={a.id} className="rounded-[9px] border border-ink/11 bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon name="folder" size={13} className="flex-none text-[#8A90A0]" />
                  <input
                    aria-label="Başlık"
                    value={taslak.baslik}
                    onChange={(e) => setArsivTaslak({ ...arsivTaslak, [a.id]: { ...taslak, baslik: e.target.value } })}
                    placeholder="Ders kayıtları"
                    className={`${ALAN} h-[28px] w-[150px] flex-none text-[12px]`}
                  />
                  <input
                    aria-label="Bağlantı"
                    value={taslak.link}
                    onChange={(e) => setArsivTaslak({ ...arsivTaslak, [a.id]: { ...taslak, link: e.target.value } })}
                    className={`${ALAN} h-[28px] min-w-[180px] flex-1 text-[12px]`}
                  />
                  <button
                    type="button"
                    disabled={islemde || !degisti}
                    onClick={() =>
                      calistir("Kayıt klasörü güncellendi.", () =>
                        arsivGuncelle(a.id, {
                          link: taslak.link,
                          baslik: taslak.baslik,
                          aciklama: a.aciklama,
                        }),
                      )
                    }
                    className="h-[28px] flex-none rounded-[7px] border border-ink/13 bg-white px-2.5 text-[12px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-40"
                  >
                    Kaydet
                  </button>
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => calistir("Kayıt klasörü kaldırıldı.", () => arsivSil(a.id))}
                    className="h-[28px] flex-none rounded-[7px] border border-ink/13 bg-white px-2.5 text-[12px] font-semibold text-[#5C6273] hover:border-danger/40 hover:text-danger disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
                {(a.program || a.aciklama) && (
                  <div className="mt-1.5 pl-[21px] font-mono text-[10.5px] text-[#656B7A]">
                    {[a.program, a.aciklama].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------ birebir eğitim --- */}
      <div className="border-t border-ink/8 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={BASLIK}>Birebir eğitim oturumları</div>
          <button
            type="button"
            onClick={() => setFormAcik((a) => !a)}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Icon name={formAcik ? "x" : "plus"} size={14} />
            {formAcik ? "Vazgeç" : "Oturum ekle"}
          </button>
        </div>

        {formAcik && (
          <div className="mt-3 rounded-[12px] border border-brand/25 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Tarih ve saat</span>
                <input
                  type="datetime-local"
                  value={yeni.baslangic}
                  onChange={(e) => setYeni({ ...yeni, baslangic: e.target.value })}
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Süre (dk)</span>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={yeni.sureDk}
                  onChange={(e) => setYeni({ ...yeni, sureDk: e.target.value })}
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Konu</span>
                <input
                  value={yeni.konu}
                  onChange={(e) => setYeni({ ...yeni, konu: e.target.value })}
                  placeholder="Kampanya kurulumu"
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Program</span>
                <select
                  value={yeni.courseId}
                  onChange={(e) => setYeni({ ...yeni, courseId: e.target.value })}
                  className={ALAN}
                >
                  <option value="">Genel</option>
                  {kurslar.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.baslik}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Toplantı bağlantısı</span>
                <input
                  value={yeni.toplantiLink}
                  onChange={(e) => setYeni({ ...yeni, toplantiLink: e.target.value })}
                  placeholder="https://meet.google.com/…"
                  className={ALAN}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-ink">Kayıt bağlantısı (Drive)</span>
                <input
                  value={yeni.kayitLink}
                  onChange={(e) => setYeni({ ...yeni, kayitLink: e.target.value })}
                  placeholder="https://drive.google.com/…"
                  className={ALAN}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={islemde || !yeni.baslangic}
              onClick={() =>
                calistir(
                  "Oturum eklendi.",
                  () => oturumEkle({ userId: ogrenci.id, ...yeni }),
                  () => {
                    setYeni({
                      baslangic: "",
                      sureDk: "60",
                      konu: "",
                      toplantiLink: "",
                      kayitLink: "",
                      courseId: "",
                    });
                    setFormAcik(false);
                  },
                )
              }
              className="mt-4 h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Oturumu kaydet
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-1.5">
          {ogrenci.egitimler.length === 0 && !formAcik && (
            <div className="rounded-[9px] border border-dashed border-ink/16 px-3 py-3 text-center text-[12.5px] text-[#656B7A]">
              Bu öğrenci için planlanmış birebir eğitim yok.
            </div>
          )}

          {ogrenci.egitimler.map((o) => {
            const st = durumStil(seansDurumEtiket[o.durum]);
            const link = kayitLinkleri[o.id] ?? o.kayitLink;
            return (
              <div key={o.id} className="rounded-[9px] border border-ink/11 bg-white px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11.5px] font-medium text-ink">
                    {saatBicimi.format(new Date(o.baslangic))}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {o.konu || "Eğitim oturumu"}
                  </span>
                  <span className="font-mono text-[10.5px] text-[#656B7A]">{o.sureDk} dk</span>
                  <select
                    aria-label="Durum"
                    value={o.durum}
                    disabled={islemde}
                    onChange={(e) =>
                      calistir("Durum güncellendi.", () =>
                        oturumDurumDegistir(o.id, e.target.value as typeof o.durum),
                      )
                    }
                    className="h-[30px] rounded-full border-0 px-[9px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                    style={{ background: st.bg, color: st.renk }}
                  >
                    <option value="planlandi">Planlandı</option>
                    <option value="tamamlandi">Tamamlandı</option>
                    <option value="iptal">İptal</option>
                  </select>
                  <button
                    type="button"
                    disabled={islemde}
                    onClick={() => calistir("Oturum silindi.", () => oturumSil(o.id))}
                    className="h-[26px] rounded-[7px] border border-ink/13 bg-white px-2.5 text-[11.5px] font-semibold text-[#5C6273] hover:border-danger/40 hover:text-danger disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>

                {/* Kayıt bağlantısı: eğitim sonrası Drive klasörü ya da video. */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Icon name="folder" size={13} className="flex-none text-[#8A90A0]" />
                  <input
                    value={link}
                    onChange={(e) => setKayitLinkleri({ ...kayitLinkleri, [o.id]: e.target.value })}
                    placeholder="Drive klasörü veya video bağlantısı"
                    className={`${ALAN} h-[28px] min-w-[180px] flex-1 text-[12px]`}
                  />
                  <button
                    type="button"
                    disabled={islemde || link === o.kayitLink}
                    onClick={() =>
                      calistir("Kayıt bağlantısı güncellendi.", () => oturumKayitLinki(o.id, link))
                    }
                    className="h-[28px] flex-none rounded-[7px] border border-ink/13 bg-white px-2.5 text-[12px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-40"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------- onaylar ---
          Katlanmış başlıyor: her gün bakılan bir liste değil, bir uyuşmazlıkta
          ya da KVKK talebinde açılıyor. */}
      <div className="border-t border-ink/8 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setOnayAcik((a) => !a)}
          className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5">
            <Icon
              name="chevronRight"
              size={13}
              className={`text-[#8A90A0] transition-transform ${onayAcik ? "rotate-90" : ""}`}
            />
            <span className={BASLIK}>Verilen onaylar</span>
          </span>
          <span className="font-mono text-[10px] text-[#656B7A]">
            {ogrenci.onaylar.length === 0 ? "kayıt yok" : `${ogrenci.onaylar.length} kayıt`}
          </span>
        </button>

        {onayAcik && (
          <div className="mt-3">
            {ogrenci.onaylar.length === 0 ? (
              <div className="rounded-[9px] border border-dashed border-ink/16 px-3 py-3 text-center text-[12.5px] text-[#656B7A]">
                Bu hesap için onay kaydı yok. Hesap, onay kaydı tutulmaya başlanmadan önce açılmış olabilir.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {ogrenci.onaylar.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center gap-2 rounded-[9px] border border-ink/11 bg-white px-3 py-2"
                  >
                    <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[rgba(24,140,90,0.13)] text-[#15774E]">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{o.baslik}</span>
                    <span className="flex-none rounded-full bg-mist px-[7px] py-[2px] font-mono text-[9px] tracking-[0.08em] text-[#5C6273] uppercase">
                      {BAGLAM_ETIKET[o.baglam] ?? o.baglam}
                    </span>
                    {/* Metnin parmak izi: metin sonradan düzenlense de hangi
                        sürümün kabul edildiği buradan bulunuyor. */}
                    {o.ozet && (
                      <span
                        title={`Metin özeti (SHA-256): ${o.ozet}`}
                        className="flex-none font-mono text-[9.5px] text-[#A6ABB8]"
                      >
                        {o.ozet.slice(0, 8)}
                      </span>
                    )}
                    <span className="flex-none font-mono text-[10.5px] whitespace-nowrap text-[#5C6273]">
                      {onayBicimi.format(new Date(o.tarih))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----------------------------------------------- giriş hareketleri ---
          Katlanmış başlıyor: paylaşım şüphesi yoksa kimse bakmıyor ama açıkken
          detayın yarısını kaplıyordu. Şüphe varsa kendiliğinden açılıyor. */}
      <div className="border-t border-ink/8 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setGirisAcik((a) => !a)}
          className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5">
            <Icon
              name="chevronRight"
              size={13}
              className={`text-[#8A90A0] transition-transform ${girisAcik ? "rotate-90" : ""}`}
            />
            <span className={BASLIK}>Giriş hareketleri</span>
            {ogrenci.sinyal.supheli && (
              <span className="rounded-full bg-[rgba(201,138,27,0.16)] px-[7px] py-[1px] font-mono text-[9px] tracking-[0.08em] text-[#A5711A] uppercase">
                paylaşım?
              </span>
            )}
          </span>
          <span className="font-mono text-[10px] text-[#656B7A]">
            son 30 gün · {ogrenci.sinyal.girisSayisi} giriş · {ogrenci.sinyal.ipSayisi} IP ·{" "}
            {ogrenci.sinyal.sehirSayisi} şehir
          </span>
        </button>

        {girisAcik && (
          <>
            <div
              className="mt-3 rounded-[11px] px-4 py-3 text-[13px] leading-[1.6]"
              style={
                ogrenci.sinyal.supheli
                  ? { background: "rgba(201,138,27,0.09)", color: "#A5711A" }
                  : { background: "#F2F4FA", color: "#5C6273" }
              }
            >
              {ogrenci.sinyal.gerekce}
              {ogrenci.sinyal.supheli && (
                <span className="mt-1 block text-[12.5px] opacity-80">
                  Bu bir kanıt değil, bir işaret. Mobil operatörler IP değiştirir, insanlar seyahat eder —
                  karar vermeden önce kişiyle konuş.
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-[7px]">
              {ogrenci.oturumlar.length === 0 ? (
                <div className="rounded-[9px] border border-dashed border-ink/16 px-3 py-3 text-center text-[12.5px] text-[#656B7A]">
                  Bu kullanıcı için kayıtlı giriş yok.
                </div>
              ) : (
                ogrenci.oturumlar.slice(0, 15).map((k) => (
                  <div
                    key={k.id}
                    className="flex flex-wrap items-center gap-3 rounded-[10px] border border-ink/10 bg-white px-[13px] py-[10px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                      {konumEtiketi(k)}
                    </span>
                    <span className="truncate font-mono text-[10.5px] text-[#656B7A]">{cihazEtiketi(k)}</span>
                    <span className="font-mono text-[10.5px] text-[#5C6273]">{k.ip || "—"}</span>
                    <span className="font-mono text-[10.5px] text-[#656B7A]">
                      {anBicimi.format(new Date(k.tarih))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
