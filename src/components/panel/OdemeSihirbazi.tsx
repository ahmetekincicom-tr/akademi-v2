"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { odemeyeGec, havaleBildir } from "@/app/panel/odemelerim/actions";
import { BankaKutusu } from "@/components/panel/BankaKutusu";
import { Icon } from "@/components/Icon";
import type { Banka } from "@/lib/odeme";

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

type Yontem = "kart" | "havale";

/**
 * Ödeme akışı iki adımda: önce yöntem, sonra o yönteme ait ekran.
 *
 * Öncesinde tek bir "Kartla ödemeye geç" düğmesi vardı; havale bilgileri de
 * bambaşka bir sayfada, ödemeyle ilişkisi kurulmadan duruyordu. Havale ile
 * ödemek isteyen kişi ne yapacağını buradan anlayamıyordu.
 *
 * Adımlar bileşen içi durumda tutuluyor, ayrı adres değil: geri tuşuna basan
 * kişi ödeme akışının ortasına değil, geldiği listeye dönmeli.
 */
export function OdemeSihirbazi({
  id,
  tutar,
  kurs,
  not,
  banka,
  kartAcik,
}: {
  id: string;
  tutar: number;
  kurs: string | null;
  not: string | null;
  banka: Banka | null;
  kartAcik: boolean;
}) {
  // Tek seçenek varsa yöntem sorusu anlamsız; doğrudan ikinci adımda başlıyor.
  const tekYontem: Yontem | null = kartAcik && banka ? null : kartAcik ? "kart" : banka ? "havale" : null;

  const [yontem, setYontem] = useState<Yontem | null>(tekYontem);
  const [onay, setOnay] = useState(false);
  const [bildirildi, setBildirildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [islemde, basla] = useTransition();

  const adim = yontem ? 2 : 1;

  if (!kartAcik && !banka) {
    return (
      <Kutu>
        <p className="text-[14.5px] leading-[1.6] text-[#5C6273]">
          Ödeme yöntemleri henüz tanımlanmadı. Bize yazarsan ödemeni birlikte tamamlayalım.
        </p>
      </Kutu>
    );
  }

  function kartaGec() {
    setHata(null);
    basla(async () => {
      const { adres, hata: h } = await odemeyeGec(id);
      if (h || !adres) {
        setHata(h ?? "Ödeme başlatılamadı.");
        return;
      }
      // Hedef bu uygulamanın dışında; router.push kullanılmıyor.
      window.location.href = adres;
    });
  }

  function havaleyiBildir() {
    setHata(null);
    basla(async () => {
      const { hata: h } = await havaleBildir(id);
      if (h) {
        setHata(h);
        return;
      }
      setBildirildi(true);
    });
  }

  return (
    <div className="mt-[26px] max-w-[620px]">
      {/* Adım göstergesi yalnızca gerçekten iki adım varken çıkıyor. */}
      {!tekYontem && <Adimlar adim={adim} />}

      <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#656B7A] uppercase">Ödenecek tutar</div>
        <div className="mt-2 font-heading text-[34px] leading-none font-semibold tracking-[-0.03em]">
          {paraBicimi.format(tutar)}
        </div>
        <div className="mt-3 text-[14px] text-[#5C6273]">{kurs ?? "Eğitim ücreti"}</div>
        {not && <div className="mt-[10px] text-[13.5px] leading-[1.55] text-[#5C6273]">{not}</div>}
      </div>

      {adim === 1 && (
        <div className="mt-5 flex flex-col gap-3">
          <h2 className="text-[15.5px] font-semibold text-ink">Nasıl ödemek istersin?</h2>
          {kartAcik && (
            <YontemKarti
              ikon="card"
              baslik="Kredi veya banka kartı"
              metin="Anında tamamlanır, kaydın hemen “Ödendi” olur. Taksit seçenekleri kartına göre çıkar."
              onSec={() => setYontem("kart")}
            />
          )}
          {banka && (
            <YontemKarti
              ikon="file"
              baslik="Havale / EFT"
              metin="Hesap bilgilerini gösterelim, bankandan gönder. Ödemen ulaştığında kaydını işaretliyoruz."
              onSec={() => setYontem("havale")}
            />
          )}
        </div>
      )}

      {adim === 2 && yontem === "kart" && (
        <>
          <label className="mt-5 flex cursor-pointer items-start gap-[10px] rounded-2xl border border-ink/10 bg-white p-5">
            <input
              type="checkbox"
              checked={onay}
              onChange={(e) => setOnay(e.target.checked)}
              className="mt-[3px] h-[17px] w-[17px] flex-none accent-brand"
            />
            <span className="text-[13.5px] leading-[1.6] text-[#3A3F4F]">
              <Link href="/satis-sozlesmesi" target="_blank" className="font-semibold text-brand underline">
                Mesafeli satış sözleşmesini
              </Link>{" "}
              ve{" "}
              <Link href="/iptal-iade-politikasi" target="_blank" className="font-semibold text-brand underline">
                iptal ve iade politikasını
              </Link>{" "}
              okudum, onaylıyorum.
            </span>
          </label>

          {hata && <Uyari mesaj={hata} />}

          <button
            type="button"
            onClick={kartaGec}
            disabled={!onay || islemde}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-ink text-[14.5px] font-semibold text-white transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Icon name="card" size={16} />
            {islemde ? "Ödeme sayfası açılıyor…" : "Güvenli ödemeye geç"}
          </button>
          <p className="mt-3 text-center text-[12.5px] leading-[1.55] text-[#656B7A]">
            Ödeme iyzico altyapısıyla alınır. Kart bilgilerin bu sayfaya girilmez ve bize hiçbir zaman ulaşmaz.
          </p>
        </>
      )}

      {adim === 2 && yontem === "havale" && banka && (
        <>
          <BankaKutusu banka={banka} />

          {bildirildi ? (
            <div className="mt-4 flex items-start gap-[11px] rounded-[12px] border border-[#1C9A5F]/30 bg-[#EFF9F3] px-5 py-4">
              <span className="mt-[2px] flex-none text-[#127048]">
                <Icon name="check" size={17} strokeWidth={2.6} />
              </span>
              <span className="text-[13.5px] leading-[1.6] text-[#0F5B3B]">
                Bildirimin bize ulaştı. Tutar hesaba geçtiğinde kaydını “Ödendi” olarak işaretleyeceğiz.
              </span>
            </div>
          ) : (
            <>
              {hata && <Uyari mesaj={hata} />}
              <button
                type="button"
                onClick={havaleyiBildir}
                disabled={islemde}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-ink text-[14.5px] font-semibold text-white transition hover:bg-brand disabled:opacity-45"
              >
                <Icon name="check" size={16} />
                {islemde ? "Gönderiliyor…" : "Ödemeyi yaptım, bildir"}
              </button>
              <p className="mt-3 text-center text-[12.5px] leading-[1.55] text-[#656B7A]">
                Bu düğme ödemeyi tamamlamaz; yalnızca bize haber verir. Kaydın, tutar hesaba geçtiğinde işaretlenir.
              </p>
            </>
          )}
        </>
      )}

      <div className="mt-6 flex justify-center gap-5 text-[13.5px] font-medium">
        {adim === 2 && !tekYontem && (
          <button
            type="button"
            onClick={() => {
              setYontem(null);
              setHata(null);
            }}
            className="text-[#5C6273] hover:text-ink"
          >
            Yöntemi değiştir
          </button>
        )}
        <Link href="/panel/odemelerim" className="text-[#5C6273] hover:text-ink">
          Ödemelerime dön
        </Link>
      </div>
    </div>
  );
}

function Adimlar({ adim }: { adim: number }) {
  const basliklar = ["Ödeme yöntemi", "Ödeme"];
  return (
    <ol className="flex items-center gap-3">
      {basliklar.map((b, i) => {
        const no = i + 1;
        const gecildi = adim > no;
        const aktif = adim === no;
        return (
          <li key={b} className="flex flex-1 items-center gap-[10px]">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[12.5px] font-semibold transition"
              style={{
                background: gecildi || aktif ? "#1C56F3" : "#EEF1F8",
                color: gecildi || aktif ? "#FFFFFF" : "#8A90A0",
              }}
            >
              {gecildi ? <Icon name="check" size={13} strokeWidth={3} /> : no}
            </span>
            <span
              className="truncate text-[13.5px] font-medium"
              style={{ color: aktif ? "#0A0D18" : "#8A90A0" }}
            >
              {b}
            </span>
            {i < basliklar.length - 1 && <span className="h-px flex-1 bg-ink/12" />}
          </li>
        );
      })}
    </ol>
  );
}

function YontemKarti({
  ikon,
  baslik,
  metin,
  onSec,
}: {
  ikon: "card" | "file";
  baslik: string;
  metin: string;
  onSec: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSec}
      className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-white p-5 text-left transition hover:border-brand/45 hover:shadow-[0_14px_32px_rgba(10,13,24,0.08)]"
    >
      <span className="mt-[2px] flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-brand/10 text-brand">
        <Icon name={ikon} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{baslik}</span>
        <span className="mt-[5px] block text-[13.5px] leading-[1.55] text-[#5C6273]">{metin}</span>
      </span>
      <span className="mt-[10px] flex-none text-[#8A90A0]">
        <Icon name="chevronRight" size={17} />
      </span>
    </button>
  );
}

function Uyari({ mesaj }: { mesaj: string }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-[12px] border border-[#E5484D]/30 bg-[#FDF0F0] px-4 py-3 text-[13.5px] text-[#8E2226]"
    >
      {mesaj}
    </div>
  );
}

function Kutu({ children }: { children: React.ReactNode }) {
  return <div className="mt-[26px] max-w-[620px] rounded-2xl border border-ink/10 bg-white p-6">{children}</div>;
}
