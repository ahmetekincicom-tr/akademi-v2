"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { davetGonder, type DavetSonucu } from "@/app/kontrol-9f4x2k/(protected)/ogrenciler/davet-actions";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

export type DavetAdayi = {
  id: string;
  ad: string | null;
  eposta: string;
  olusturma: string;
  /** E-posta doğrulanmış mı. İçe aktarılanlar doğrulanmış açılıyor. */
  dogrulanmis: boolean;
  sonDavet: string | null;
  davetSayisi: number;
};

// Sunucu eylemiyle aynı sınır; liste bu boyda parçalara bölünüp sırayla gidiyor.
const PARCA = 10;

type Suzgec = "hepsi" | "gonderilmemis" | "gonderilmis";

const tarih = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

export function OgrenciDavet({ adaylar, hata }: { adaylar: DavetAdayi[]; hata?: string }) {
  const router = useRouter();
  const bildir = useBildirim();

  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [suzgec, setSuzgec] = useState<Suzgec>("gonderilmemis");
  const [arama, setArama] = useState("");
  const [onay, setOnay] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [ilerleme, setIlerleme] = useState({ islenen: 0, toplam: 0 });
  const [rapor, setRapor] = useState<DavetSonucu[] | null>(null);

  const sayilar = useMemo(
    () => ({
      gonderilmemis: adaylar.filter((a) => !a.sonDavet).length,
      gonderilmis: adaylar.filter((a) => a.sonDavet).length,
    }),
    [adaylar],
  );

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    return adaylar.filter((a) => {
      if (suzgec === "gonderilmemis" && a.sonDavet) return false;
      if (suzgec === "gonderilmis" && !a.sonDavet) return false;
      if (!q) return true;
      return a.eposta.toLocaleLowerCase("tr").includes(q) || (a.ad ?? "").toLocaleLowerCase("tr").includes(q);
    });
  }, [adaylar, suzgec, arama]);

  const hepsiSecili = gorunen.length > 0 && gorunen.every((a) => secili.has(a.id));

  const degistir = (id: string) => {
    setOnay(false);
    setSecili((s) => {
      const y = new Set(s);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  };

  const hepsiniDegistir = () => {
    setOnay(false);
    setSecili((s) => {
      const y = new Set(s);
      if (hepsiSecili) gorunen.forEach((a) => y.delete(a.id));
      else gorunen.forEach((a) => y.add(a.id));
      return y;
    });
  };

  const gonder = async () => {
    const liste = adaylar.filter((a) => secili.has(a.id)).map((a) => a.id);
    if (liste.length === 0) return;
    setIslemde(true);
    setRapor(null);
    setIlerleme({ islenen: 0, toplam: liste.length });

    const toplanan: DavetSonucu[] = [];
    for (let i = 0; i < liste.length; i += PARCA) {
      const cevap = await davetGonder(liste.slice(i, i + PARCA));
      if (cevap.error) {
        bildir.hata(cevap.error);
        break;
      }
      toplanan.push(...(cevap.sonuclar ?? []));
      setIlerleme({ islenen: Math.min(i + PARCA, liste.length), toplam: liste.length });
    }

    setRapor(toplanan);
    setIslemde(false);
    setOnay(false);
    setSecili(new Set());
    const giden = toplanan.filter((r) => r.durum === "gonderildi").length;
    if (giden > 0) bildir.basarili(`${giden} kişiye davet gönderildi.`);
    router.refresh();
  };

  const kisiAdi = (id: string) => {
    const a = adaylar.find((x) => x.id === id);
    return a ? a.ad || a.eposta : id;
  };

  return (
    <main className="davet-ekrani flex flex-col gap-6 p-4 pb-14 sm:p-[34px]">
      <div>
        <Link
          href="/kontrol-9f4x2k/ogrenciler"
          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[#5C6273] hover:text-brand"
        >
          <Icon name="arrowLeft" size={14} />
          Öğrenciler
        </Link>
        <h1 className="mt-1 font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em]">Hesap daveti</h1>
        <p className="mt-2 max-w-[680px] text-[15px] leading-[1.6] text-[#5C6273]">
          Hiç giriş yapmamış hesaplar burada. Seçtiğin kişilere &quot;hesabını etkinleştir&quot; e-postası gider;
          kişi bağlantıya tıklayıp şifresini belirler, sonra aynı e-posta ve şifreyle siteden ya da uygulamadan
          giriş yapar. Yeni üyelik açılmaz, mevcut hesap ve eğitimleri olduğu gibi kalır. Bağlantı 14 gün
          geçerlidir ve kişi giriş yapınca kendiliğinden geçersizleşir.
        </p>
      </div>

      {hata && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[14px] text-danger">
          {hata}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:max-w-[520px]">
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-[#94A0B3] uppercase">Davet bekleyen</div>
          <div className="mt-2 font-heading text-[24px] font-semibold text-brand">{sayilar.gonderilmemis}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-[#94A0B3] uppercase">Davet gitti, henüz girmedi</div>
          <div className="mt-2 font-heading text-[24px] font-semibold text-ink">{sayilar.gonderilmis}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-col gap-3 border-b border-ink/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Süzgeç">
            {(
              [
                ["gonderilmemis", `Davet gitmemiş (${sayilar.gonderilmemis})`],
                ["gonderilmis", `Davet gitmiş (${sayilar.gonderilmis})`],
                ["hepsi", `Hepsi (${adaylar.length})`],
              ] as [Suzgec, string][]
            ).map(([d, etiket]) => (
              <button
                key={d}
                type="button"
                aria-pressed={suzgec === d}
                onClick={() => setSuzgec(d)}
                className={`min-h-11 rounded-full border px-4 text-[13px] font-semibold transition ${
                  suzgec === d
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-ink/13 bg-white text-[#5C6273] hover:border-brand hover:text-brand"
                }`}
              >
                {etiket}
              </button>
            ))}
          </div>
          <label className="w-full sm:w-[260px]">
            <span className="sr-only">Ad ya da e-posta ara</span>
            <input
              type="search"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Ad ya da e-posta ara"
              className="h-11 w-full rounded-[10px] border border-ink/13 bg-white px-3 text-[14px] text-ink"
            />
          </label>
        </div>

        {gorunen.length === 0 ? (
          <p className="p-6 text-[14px] text-[#5C6273]">
            {adaylar.length === 0 ? "Hiç giriş yapmamış hesap yok." : "Bu süzgeçte kimse yok."}
          </p>
        ) : (
          <ul className="divide-y divide-ink/8">
            <li className="flex min-h-12 items-center gap-3 bg-paper px-4">
              <input
                id="davet-hepsi"
                type="checkbox"
                checked={hepsiSecili}
                onChange={hepsiniDegistir}
                className="h-5 w-5 accent-brand"
              />
              <label htmlFor="davet-hepsi" className="flex min-h-11 flex-1 items-center text-[13px] font-semibold text-ink">
                Görünenlerin tümünü seç ({gorunen.length})
              </label>
            </li>
            {gorunen.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2">
                <input
                  id={`davet-${a.id}`}
                  type="checkbox"
                  checked={secili.has(a.id)}
                  onChange={() => degistir(a.id)}
                  className="h-5 w-5 flex-none accent-brand"
                />
                <label htmlFor={`davet-${a.id}`} className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col justify-center">
                  <span className="truncate text-[14px] font-semibold text-ink">{a.ad || a.eposta}</span>
                  <span className="truncate text-[13px] text-[#5C6273]">
                    {a.ad ? a.eposta : null}
                    {!a.dogrulanmis && <span className="text-[#8a5a00]"> · kendisi kayıt oldu, e-postasını doğrulamadı</span>}
                  </span>
                </label>
                <span className="flex-none text-right text-[12px] text-[#5C6273]">
                  {a.sonDavet ? (
                    <>
                      Davet: {tarih(a.sonDavet)}
                      {a.davetSayisi > 1 && <span className="block">{a.davetSayisi}. kez</span>}
                    </>
                  ) : (
                    "Davet gitmedi"
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-ink/10 bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {islemde ? (
          <p className="text-[14px] font-semibold text-ink" role="status">
            Gönderiliyor… {ilerleme.islenen}/{ilerleme.toplam}
          </p>
        ) : onay ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-ink">
              <strong>{secili.size} kişiye</strong> davet e-postası gidecek. Emin misin?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOnay(false)}
                className="min-h-11 rounded-[10px] border border-ink/15 bg-white px-4 text-[14px] font-semibold text-[#5C6273]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={gonder}
                className="min-h-11 rounded-[10px] bg-brand px-4 text-[14px] font-semibold text-white hover:bg-ink"
              >
                Evet, gönder
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-[#5C6273]">
              {secili.size === 0 ? "Davet göndermek için kişi seç." : `${secili.size} kişi seçili.`}
            </p>
            <button
              type="button"
              disabled={secili.size === 0}
              onClick={() => setOnay(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="mail" size={16} />
              Seçilenlere davet gönder
            </button>
          </div>
        )}
      </div>

      {rapor && rapor.length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <h2 className="text-[16px] font-semibold text-ink">Gönderim sonucu</h2>
          <p className="mt-1 text-[14px] text-[#5C6273]">
            {rapor.filter((r) => r.durum === "gonderildi").length} gönderildi ·{" "}
            {rapor.filter((r) => r.durum === "atlandi").length} atlandı ·{" "}
            {rapor.filter((r) => r.durum === "hata").length} hata
          </p>
          {rapor.some((r) => r.durum !== "gonderildi") && (
            <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
              {rapor
                .filter((r) => r.durum !== "gonderildi")
                .map((r) => (
                  <li key={r.userId} className={r.durum === "hata" ? "text-danger" : "text-[#5C6273]"}>
                    {kisiAdi(r.userId)}: {r.aciklama}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
