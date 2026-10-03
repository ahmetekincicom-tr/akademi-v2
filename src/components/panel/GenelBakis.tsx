import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import type { Adim } from "@/lib/baslangic";
import type { PanelCourse } from "@/lib/panel";
import type { PanelBildirimleri } from "@/lib/bildirimler";
import type { EgitimOturumu } from "@/lib/egitim-oturumu";
import { paraBicimi } from "@/lib/odeme";
import { DERSLER_ACIK } from "@/lib/bolumler";
import { TR_ZAMAN } from "@/lib/zaman";

/**
 * Öğrenci panelinin genel bakışı — "Genel Bakış Final" tasarımı (3a masaüstü,
 * 4a mobil). Her parça gerçek veriden besleniyor; tasarımdaki örnek değerler
 * (2/4 adım, 8 Ekim dersi…) yalnızca yer tutucuydu.
 *
 * Düğme kuralı: gidecek bir yeri olmayan düğme çizilmiyor. Toplantı bağlantısı
 * henüz eklenmemiş derste "Derse katıl" yerine bir not, adımı bize bağlı olan
 * kurulum adımında düğme yerine ne beklendiği yazıyor.
 */

const AY = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, month: "short" });
const GUN = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, day: "2-digit" });
const HAFTA_GUNU = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, weekday: "short" });
const SAAT = new Intl.DateTimeFormat("tr-TR", { timeZone: TR_ZAMAN, hour: "2-digit", minute: "2-digit" });

const MONO = "font-mono text-[10px] tracking-[0.14em] uppercase";
const KART = "rounded-[18px] border border-[#E6E8EF] bg-white";

/* ------------------------------------------------------------ karşılama */

export function Karsilama({ tarih, kisaTarih, baslik }: { tarih: string; kisaTarih: string; baslik: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-col gap-[3px] px-1 sm:px-0">
        <div className={`${MONO} text-[#8A92A6]`}>
          <span className="sm:hidden">{kisaTarih}</span>
          <span className="hidden sm:inline">{tarih}</span>
        </div>
        <h1 className="font-heading text-[24px] leading-[1.15] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          {baslik}
        </h1>
      </div>
      <div className="ml-auto hidden flex-none gap-2.5 sm:flex">
        <Link
          href="/panel/duyurular"
          className="rounded-[10px] border border-[#E1E4EC] bg-white px-4 py-[11px] text-[13px] font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Gündem
        </Link>
        <Link
          href="/panel/soru-cevap"
          className="rounded-[10px] bg-ink px-[18px] py-[11px] text-[13px] font-semibold text-white transition hover:bg-[#1E2740]"
        >
          Destek talebi
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ kurulum bandı */

type BantAdimi = {
  n: number;
  baslik: string;
  aciklama: string;
  durum: "tamam" | "siradaki" | "bekliyor";
  eylem: { etiket: string; yol: string } | null;
};

/**
 * Başlangıç adımlarını tasarımın diline çeviriyor. Durumlar ve bağlantılar
 * lib/baslangic.ts'ten (ödeme, test, takvim gerçek tablolardan okunuyor);
 * burada yalnızca başlık, kısa açıklama ve düğme metni seçiliyor.
 */
export function bantAdimlari(adimlar: Adim[]): BantAdimi[] {
  const siradaki = adimlar.findIndex((a) => !a.tamam);

  return adimlar.map((a, i) => {
    const durum = a.tamam ? "tamam" : i === siradaki ? "siradaki" : "bekliyor";
    const n = i + 1;

    switch (a.anahtar) {
      case "hesap":
        return { n, durum, baslik: "Hesabını oluştur", aciklama: "Giriş bilgilerin hazır.", eylem: null };
      case "odeme":
        // Kurumsal kayıtta ödeyen başkası; adımın kendi metni bunu anlatıyor.
        if (a.baslik !== "Ödemeni tamamla") return { n, durum, baslik: a.baslik, aciklama: a.aciklama, eylem: null };
        return {
          n,
          durum,
          baslik: "Ödemeni tamamla",
          aciklama: a.tamam ? "Ödemen onaylandı." : (a.bekliyor ?? "Ödemeni aldıktan sonra biz onaylıyoruz."),
          eylem: a.yol ? { etiket: "Ödemelerime git", yol: a.yol } : null,
        };
      case "test":
        return {
          n,
          durum,
          baslik: "Testini tamamla",
          aciklama: a.tamam ? "Ön değerlendirmen bize ulaştı." : "Seviyeni belirleyen kısa test.",
          eylem: a.yol ? { etiket: "Teste başla", yol: a.yol } : null,
        };
      case "planlama":
        return {
          n,
          durum,
          baslik: "Eğitimi planla",
          aciklama: a.tamam
            ? "Birebir eğitim takvimin hazır."
            : durum === "siradaki" && a.bekliyor
              ? a.bekliyor
              : "İlk birebir oturumun planlanır.",
          eylem: a.yol ? { etiket: "Takvime git", yol: a.yol } : null,
        };
    }
  });
}

function Izgara({ boyut, maske }: { boyut: number; maske: string }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
        backgroundSize: `${boyut}px ${boyut}px`,
        maskImage: maske,
        WebkitMaskImage: maske,
      }}
    />
  );
}

export function KurulumBandi({ adimlar }: { adimlar: Adim[] }) {
  const liste = bantAdimlari(adimlar);
  const tamam = liste.filter((a) => a.durum === "tamam").length;
  const yuzde = liste.length ? Math.round((tamam / liste.length) * 100) : 0;

  return (
    <section
      aria-label="Kurulum yolculuğun"
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-[20px] p-[18px] text-white sm:gap-5 sm:p-[26px]"
      style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 39%,#070B16 100%)" }}
    >
      <Izgara boyut={28} maske="linear-gradient(130deg,#000 10%,transparent 82%)" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-30 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle,rgba(91,134,255,.45),transparent 65%)" }}
      />

      {/* Başlık + ilerleme. Mobilde yüzde büyük ve sağda, çubuk altta. */}
      <div className="relative flex flex-wrap items-end gap-x-3.5 gap-y-3.5 sm:flex-nowrap sm:items-center">
        <div className="flex flex-col gap-1">
          <div className={`${MONO} tracking-[0.16em] text-[#AFC2FF]`}>Kurulum</div>
          <h2 className="text-[18px] font-bold sm:text-[20px]">Kurulum yolculuğun</h2>
        </div>
        <div className="ml-auto text-[30px] leading-none font-extrabold tracking-[-0.03em] sm:hidden">{yuzde}%</div>
        <div className="hidden font-mono text-[11px] tracking-[0.1em] text-[#AFC2FF] sm:ml-6 sm:block">
          {tamam}/{liste.length} · {yuzde}%
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10 sm:w-auto sm:flex-1"
          role="progressbar"
          aria-valuenow={yuzde}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kurulum ilerlemesi"
        >
          <div className="h-full rounded-full bg-[#7FA0FF] transition-[width] duration-500" style={{ width: `${yuzde}%` }} />
        </div>
      </div>

      <ol className="relative grid grid-cols-1 gap-2 xl:grid-cols-4 xl:gap-3">
        {liste.map((a) => (
          <li key={a.n} className="flex flex-col">
            {a.durum === "siradaki" ? (
              <div className="flex h-full flex-col gap-1.5 rounded-[14px] bg-[#2459FF] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.18),0_14px_30px_-12px_rgba(36,89,255,.85)] xl:gap-2 xl:p-4">
                <div className={`${MONO} text-[#DCE5FF]`}>Adım 0{a.n} · Sıradaki</div>
                <div className="text-[17px] font-bold">{a.baslik}</div>
                <div className="text-[13px] leading-[1.45] text-[#DCE5FF] xl:text-[12px]">{a.aciklama}</div>
                {a.eylem && (
                  <Link
                    href={a.eylem.yol}
                    className="mt-1.5 flex h-11 items-center justify-center rounded-[11px] bg-white text-[14px] font-bold text-[#1A44CC] transition hover:bg-[#EEF2FF] xl:h-auto xl:self-start xl:rounded-[9px] xl:px-3.5 xl:py-2 xl:text-[12px]"
                  >
                    {a.eylem.etiket} →
                  </Link>
                )}
              </div>
            ) : a.durum === "tamam" ? (
              <>
                {/* Mobil: tek satır. */}
                <div className="flex min-h-12 items-center gap-3 rounded-[12px] border border-white/10 bg-[#070B16]/55 px-3 xl:hidden">
                  <Tik />
                  <div className="text-[14px] font-semibold text-[#C9D0E0]">{a.baslik}</div>
                  <div className="ml-auto font-mono text-[10px] text-[#8E98B3]">0{a.n}</div>
                </div>
                {/* Masaüstü: kart. */}
                <div className="hidden h-full flex-col gap-2 rounded-[14px] border border-white/10 bg-[#070B16]/55 p-4 xl:flex">
                  <div className="flex items-center gap-2">
                    <div className={`${MONO} text-[#8E98B3]`}>Adım 0{a.n}</div>
                    <span className="ml-auto">
                      <Tik />
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-[#C9D0E0]">{a.baslik}</div>
                  <div className="text-[12px] leading-[1.45] text-[#8E98B3]">{a.aciklama}</div>
                </div>
              </>
            ) : (
              <>
                <div className="flex min-h-12 items-center gap-3 rounded-[12px] border border-dashed border-white/20 px-3 xl:hidden">
                  <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border border-white/25 font-mono text-[10px] text-[#8E98B3]">
                    {a.n}
                  </span>
                  <div className="text-[14px] font-semibold text-[#E4E8F2]">{a.baslik}</div>
                </div>
                <div className="hidden h-full flex-col gap-2 rounded-[14px] border border-dashed border-white/20 bg-[#070B16]/25 p-4 xl:flex">
                  <div className={`${MONO} text-[#8E98B3]`}>Adım 0{a.n}</div>
                  <div className="text-[15px] font-semibold text-[#E4E8F2]">{a.baslik}</div>
                  <div className="text-[12px] leading-[1.45] text-[#8E98B3]">{a.aciklama}</div>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Tik() {
  return (
    <span
      aria-label="Tamamlandı"
      className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-[#123B2C] text-[#3DDC97] xl:h-5 xl:w-5"
    >
      <Icon name="check" size={12} strokeWidth={2.6} />
    </span>
  );
}

/* --------------------------------------------------------- aktif program */

export function AktifProgram({
  kurs,
  digerleri,
  odemeBekliyor,
}: {
  kurs: PanelCourse;
  digerleri: PanelCourse[];
  odemeBekliyor: PanelBildirimleri["odemeBekliyor"];
}) {
  return (
    <div className={`${KART} flex flex-col overflow-hidden sm:flex-row sm:gap-5 sm:p-[18px]`}>
      <div className="relative h-[130px] flex-none overflow-hidden bg-[repeating-linear-gradient(135deg,#EEF1F7_0_8px,#E6EAF2_8px_16px)] sm:h-auto sm:min-h-[170px] sm:w-[230px] sm:rounded-[12px]">
        {kurs.kapak && <Image src={kurs.kapak} alt="" fill sizes="(min-width: 640px) 230px, 100vw" className="object-cover" />}
        {!DERSLER_ACIK && (
          <span className={`${MONO} absolute right-3 bottom-3 rounded-full bg-[#FFF4D6] px-2 py-1 tracking-[0.08em] text-[#9A6A00] sm:hidden`}>
            Videolar hazırlanıyor
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:gap-3 sm:px-1 sm:py-1.5">
        <div className="flex items-center gap-2">
          <div className={`${MONO} text-[#8A92A6]`}>Aktif program</div>
          {!DERSLER_ACIK && (
            <span className={`${MONO} ml-auto hidden rounded-full bg-[#FFF4D6] px-2 py-1 tracking-[0.08em] text-[#9A6A00] sm:inline`}>
              Videolar hazırlanıyor
            </span>
          )}
        </div>
        <h2 className="text-[19px] leading-[1.25] font-bold tracking-[-0.02em] text-ink sm:text-[22px]">{kurs.baslik}</h2>
        <p className="text-[14px] leading-[1.5] text-[#5B6478]">
          {DERSLER_ACIK
            ? kurs.sonrakiDers
              ? `Sıradaki ders: ${kurs.sonrakiDers.ad}`
              : "Bütün dersleri tamamladın; istediğin zaman tekrar izleyebilirsin."
            : "Ders videoları hazırlanıyor; birebir eğitim takvimin bundan etkilenmiyor."}
        </p>

        {DERSLER_ACIK && (
          <Link
            href={`/panel/dersler?kurs=${kurs.slug}`}
            className="self-start rounded-[9px] bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-ink"
          >
            {kurs.yuzde === 100 ? "Tekrar izle" : "Derslere devam et"} →
          </Link>
        )}

        <dl className="mt-auto grid grid-cols-3 border-t border-[#EEF0F5] pt-3.5">
          <Bilgi etiket="Format" deger="Birebir" />
          <Bilgi
            etiket="Dersler"
            deger={DERSLER_ACIK ? `${kurs.tamamlanan}/${kurs.dersSayisi}` : "Çok yakında"}
          />
          <Bilgi
            etiket="Ödeme"
            deger={odemeBekliyor ? paraBicimi.format(odemeBekliyor.tutar) : "Bekleyen yok"}
            renk={odemeBekliyor ? "#B4232A" : "#12825A"}
            yol={odemeBekliyor ? "/panel/odemelerim" : undefined}
          />
        </dl>

        {digerleri.length > 0 && (
          <p className="text-[12.5px] text-[#5B6478]">
            Diğer programların: {digerleri.map((d) => d.baslik).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Bilgi({ etiket, deger, renk, yol }: { etiket: string; deger: string; renk?: string; yol?: string }) {
  const metin = (
    <span className="text-[14px] font-semibold" style={{ color: renk ?? "#0A0D18" }}>
      {deger}
    </span>
  );
  return (
    <div className="flex flex-col gap-[3px]">
      <dt className="font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase">{etiket}</dt>
      <dd>
        {yol ? (
          <Link href={yol} className="underline-offset-2 hover:underline">
            {metin}
          </Link>
        ) : (
          metin
        )}
      </dd>
    </div>
  );
}

export function ProgramYok() {
  return (
    <div className={`${KART} flex flex-col items-center justify-center px-6 py-10 text-center`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
        <Icon name="grid" size={22} />
      </div>
      <h2 className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-ink">Henüz bir eğitim kaydın yok</h2>
      <p className="mt-2 max-w-[440px] text-[14px] leading-[1.6] text-[#5B6478]">
        Eğitim kaydın tanımlandığında programın burada görünür. Sorularını soru-cevap bölümünden iletebilirsin.
      </p>
    </div>
  );
}

/* --------------------------------------------------------- yaklaşan ders */

/** Toplantı bağlantısından platform adı; tanınmıyorsa "Çevrim içi". */
function platform(link: string): string {
  try {
    const host = new URL(link).hostname;
    if (host.includes("meet.google")) return "Google Meet";
    if (host.includes("zoom")) return "Zoom";
    if (host.includes("teams")) return "Microsoft Teams";
  } catch {}
  return "Çevrim içi";
}

export function YaklasanDers({ oturum, kurulumBitti }: { oturum: EgitimOturumu | null; kurulumBitti: boolean }) {
  const tarih = oturum ? new Date(oturum.baslangic) : null;

  return (
    <div className={`${KART} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-center">
        <h2 className="text-[16px] font-bold text-ink">Yaklaşan ders</h2>
        <Link href="/panel/birebir-egitim" className="ml-auto text-[13px] font-semibold text-brand hover:text-ink">
          Takvim →
        </Link>
      </div>

      {oturum && tarih ? (
        <>
          <div className="flex items-center gap-3.5 rounded-[12px] bg-[#F4F6FC] p-3">
            <div className="flex h-14 w-[52px] flex-none flex-col items-center justify-center rounded-[10px] bg-ink text-white sm:h-[58px] sm:w-[54px]">
              <div className="font-mono text-[10px] text-[#8FAEFF] uppercase">{AY.format(tarih).replace(".", "")}</div>
              <div className="text-[20px] font-extrabold sm:text-[21px]">{GUN.format(tarih)}</div>
            </div>
            <div className="flex min-w-0 flex-col gap-[3px]">
              <div className="truncate text-[15px] font-bold text-ink">{oturum.konu || oturum.program}</div>
              <div className="text-[13px] text-[#5B6478]">
                {HAFTA_GUNU.format(tarih).replace(".", "")} · {SAAT.format(tarih)}
                {oturum.toplantiLink ? ` · ${platform(oturum.toplantiLink)}` : ""}
              </div>
            </div>
          </div>
          {oturum.toplantiLink ? (
            <a
              href={oturum.toplantiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex h-[46px] items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-white transition hover:bg-[#1A44CC] sm:h-auto sm:rounded-[10px] sm:py-[11px] sm:text-[13px]"
            >
              Derse katıl
            </a>
          ) : (
            <p className="text-[12.5px] leading-[1.5] text-[#5B6478]">
              Toplantı bağlantısı dersten önce burada ve e-postanda olacak.
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-[12px] border border-dashed border-[#D5DAE5] p-4">
          <div className="text-[15px] font-semibold text-ink">Planlanmış oturum yok</div>
          <div className="text-[13px] leading-[1.5] text-[#5B6478]">
            {kurulumBitti
              ? "Yeni bir oturum planlandığında burada görünecek."
              : "Kurulumu tamamladığında ilk eğitimini buradan planlayabilirsin."}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ kısayollar */

const KISAYOLLAR = [
  { yol: "/panel/birebir-egitim", etiket: "Birebir eğitim", alt: "Kayıtlar ve takvim", ikon: "calendar", ton: 265 },
  { yol: "/panel/dokumanlar", etiket: "Dokümanlar", alt: "Şablon ve kaynaklar", ikon: "file", ton: 300 },
  { yol: "/panel/soru-cevap", etiket: "Soru-cevap", alt: "Eğitmene yaz", ikon: "message", ton: 170 },
  { yol: "/panel/gorusmeler", etiket: "Danışmanlık", alt: "Görüşme talebi", ikon: "users", ton: 60 },
] as const;

export function Kisayollar() {
  return (
    <section aria-labelledby="kisayollar-baslik">
      <h2 id="kisayollar-baslik" className="mb-3 px-1 text-[16px] font-bold text-ink sm:sr-only">
        Kısayollar
      </h2>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {KISAYOLLAR.map((k) => (
          <Link
            key={k.yol}
            href={k.yol}
            className="relative flex flex-col gap-1 overflow-hidden rounded-[16px] border border-[#E6E8EF] bg-white p-4 transition hover:border-brand sm:p-[18px]"
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(#ECEEF3 1px,transparent 1px),linear-gradient(90deg,#ECEEF3 1px,transparent 1px)",
                backgroundSize: "14px 14px",
                maskImage: "radial-gradient(circle at 30% 25%,#000,transparent 60%)",
                WebkitMaskImage: "radial-gradient(circle at 30% 25%,#000,transparent 60%)",
              }}
            />
            <div className="relative mb-[22px] h-[52px] w-[52px]">
              <div
                className="absolute top-2 left-2 h-11 w-11 rotate-[10deg] rounded-[14px] opacity-35"
                style={{ background: `oklch(0.62 0.18 ${k.ton})` }}
              />
              <div
                className="absolute inset-[0_8px_8px_0] flex items-center justify-center rounded-[14px] border"
                style={{
                  background: "linear-gradient(150deg,rgba(255,255,255,.95),rgba(255,255,255,.6))",
                  borderColor: `oklch(0.88 0.06 ${k.ton})`,
                  boxShadow: `0 8px 16px -8px oklch(0.55 0.18 ${k.ton})`,
                  color: `oklch(0.5 0.18 ${k.ton})`,
                }}
              >
                <Icon name={k.ikon} size={18} />
              </div>
            </div>
            <div className="relative text-[15px] font-bold text-ink">{k.etiket}</div>
            <div className="relative text-[12px] text-[#5B6478]">{k.alt}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- bildirimler */

export function Bildirimler({ bildirim }: { bildirim: PanelBildirimleri }) {
  const { liste, odemeBekliyor } = bildirim;

  return (
    <div className={`${KART} flex flex-col gap-2.5 px-5 py-[18px]`}>
      <div className="flex items-center gap-2">
        <h2 className="text-[16px] font-bold text-ink">Bildirimler</h2>
        <span
          className={`rounded-full px-2 py-[2px] font-mono text-[10px] font-semibold ${
            liste.length ? "bg-brand text-white" : "bg-[#EEF0F5] text-[#8A92A6]"
          }`}
        >
          {liste.length}
        </span>
      </div>

      {liste.length === 0 ? (
        <p className="text-[13px] leading-[1.55] text-[#5B6478]">
          Yeni bir ders planlandığında, kaydın eklendiğinde ya da sorun cevaplandığında burada görünecek.
        </p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {liste.map((b) => {
            const uyari = b.ton === "uyari";
            return (
              <li key={b.anahtar}>
                <Link href={b.yol} className="group flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-mist">
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px]"
                    style={uyari ? { background: "rgba(229,72,77,0.12)", color: "#B4232A" } : { background: "#EEF2FC", color: "#1C56F3" }}
                  >
                    <Icon name={b.ikon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-[14px] leading-[1.3] font-semibold text-ink">
                      {b.baslik}
                      {uyari && odemeBekliyor && (
                        <span className="rounded-full bg-[rgba(229,72,77,0.12)] px-2 py-[1px] font-mono text-[10.5px] text-[#B4232A]">
                          {paraBicimi.format(odemeBekliyor.tutar)}
                        </span>
                      )}
                    </span>
                    <span className="mt-[2px] block text-[12.5px] leading-[1.45] text-[#5B6478]">{b.aciklama}</span>
                  </span>
                  <Icon name="chevronRight" size={15} className="flex-none text-[#A6ABB8] group-hover:text-brand" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
