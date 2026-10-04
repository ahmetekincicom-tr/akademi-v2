import Link from "next/link";
import { getOdemelerim, getBanka, paraBicimi, type OdemeSatiri } from "@/lib/odeme";
import { UygulamadaYok } from "@/components/panel/SadeceWeb";
import { Icon } from "@/components/Icon";
import { MenuIkon } from "@/components/YanMenu";
import { TR_ZAMAN } from "@/lib/zaman";
import { iyzicoAyari } from "@/lib/iyzico";
import { getErisim } from "@/lib/erisim";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Ödeme dönüşünde adrese eklenen sonuç. Metinler öğrenciye ne yapacağını söylüyor. */
const SONUC_METNI: Record<string, { baslik: string; metin: string; iyi: boolean }> = {
  basarili: {
    baslik: "Ödemen alındı",
    metin: "Kaydın “Ödendi” olarak işaretlendi. Dekontun e-postana iyzico tarafından gönderilir.",
    iyi: true,
  },
  basarisiz: {
    baslik: "Ödeme tamamlanmadı",
    metin: "Kartından tahsilat yapılmadı. Farklı bir kartla yeniden deneyebilirsin.",
    iyi: false,
  },
  belirsiz: {
    baslik: "Ödemenin sonucunu doğrulayamadık",
    metin: "Kartından tahsilat yapılmış olabilir. Tekrar denemeden önce bize yaz, kontrol edelim.",
    iyi: false,
  },
  hata: {
    baslik: "Ödeme sırasında bir sorun çıktı",
    metin: "İşlem tamamlanamadı. Sorun sürerse bize yaz.",
    iyi: false,
  },
};

export default async function OdemelerimPage({
  searchParams,
}: {
  searchParams: Promise<{ sonuc?: string }>;
}) {
  const [{ satirlar, bekleyenTutar, bekleyenAdet }, banka, { sonuc }, erisim] = await Promise.all([
    getOdemelerim(),
    getBanka(),
    searchParams,
    getErisim(),
  ]);

  // Ödeme sayfası artık yöntem seçtiriyor; kart kapalı olsa bile havale
  // bilgisi tanımlıysa gidilecek bir yer var.
  const odemeAcik = iyzicoAyari() !== null || banka !== null;
  const sonucKutusu = sonuc ? SONUC_METNI[sonuc] : undefined;

  const odenen = satirlar.filter((s) => s.durum === "odendi").reduce((t, s) => t + s.tutar, 0);
  // "Şimdi öde": kartla/havaleyle ödenebilecek ilk bekleyen kayıt.
  const odenecek = odemeAcik ? satirlar.find((s) => s.durum === "bekliyor" && s.onlineOdeme) : undefined;
  const bildirildi = satirlar.some((s) => s.durum === "bekliyor" && s.havaleBildirimi);

  return (
    <UygulamadaYok>
      <main className="flex flex-col gap-4 p-4 pb-14 sm:gap-5 sm:px-[34px] sm:pt-7 sm:pb-9">
        {/* ------------------------------------------------------ bant --- */}
        <section
          className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] p-[18px] text-white lg:flex-row lg:items-end lg:gap-8 lg:p-7"
          style={{ background: "linear-gradient(135deg,#1A3FCC 0%,#0F1E5C 39%,#070B16 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
              WebkitMaskImage: "linear-gradient(120deg,#000 10%,transparent 85%)",
            }}
          />
          <div className="relative flex min-w-0 flex-1 flex-col gap-2">
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#AFC2FF] uppercase">Hesap</div>
            <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[34px]">Ödemelerim</h1>
            <p className="hidden max-w-[520px] text-[15px] leading-[1.5] text-[#C9D0E0] lg:block">
              Eğitim ücretlerinin kaydı. Ödemen bize ulaştığında durumu “Ödendi” olarak işaretliyoruz.
            </p>
          </div>
          {/* Masaüstü: ayraçlı üç sayı; telefon: iki kutu. */}
          <dl className="relative hidden lg:flex">
            <BantSayi etiket="Bekleyen" deger={paraBicimi.format(bekleyenTutar)} renk={bekleyenTutar > 0 ? "#FFC56B" : undefined} />
            <BantSayi etiket="Ödenen" deger={paraBicimi.format(odenen)} />
            <BantSayi etiket="Kayıt" deger={String(satirlar.length)} />
          </dl>
          <div className="relative grid grid-cols-2 gap-2.5 lg:hidden">
            <KutuSayi etiket="Bekleyen" deger={paraBicimi.format(bekleyenTutar)} renk={bekleyenTutar > 0 ? "#FFC56B" : undefined} />
            <KutuSayi etiket="Ödenen" deger={paraBicimi.format(odenen)} />
          </div>
        </section>

        {sonucKutusu && (
          <div
            className="flex items-start gap-[13px] rounded-[18px] border px-5 py-4 sm:px-6"
            style={{
              borderColor: sonucKutusu.iyi ? "rgba(24,140,90,0.35)" : "rgba(229,72,77,0.32)",
              background: sonucKutusu.iyi ? "#EFF9F3" : "#FDF0F0",
            }}
          >
            <span
              className="mt-[1px] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full"
              style={{
                background: sonucKutusu.iyi ? "rgba(24,140,90,0.16)" : "rgba(229,72,77,0.14)",
                color: sonucKutusu.iyi ? "#127048" : "#B4232A",
              }}
            >
              <Icon name={sonucKutusu.iyi ? "check" : "x"} size={13} strokeWidth={2.6} />
            </span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: sonucKutusu.iyi ? "#0F5B3B" : "#8E2226" }}>
                {sonucKutusu.baslik}
              </div>
              <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#4A5060]">{sonucKutusu.metin}</div>
            </div>
          </div>
        )}

        {/* ------------------------------------------ bekleyen ödeme --- */}
        {bekleyenAdet > 0 && (
          <div className="flex flex-col gap-3 rounded-[18px] border border-[#F2D9A6] bg-[#FFF7E6] p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <span className="hidden h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-[#FDE7B8] text-[#9A6A00] sm:flex">
              <Icon name="clock" size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink">
                {bekleyenAdet} ödemen onay bekliyor · {paraBicimi.format(bekleyenTutar)}
              </div>
              <div className="mt-0.5 text-[13px] text-[#6B5320]">
                {bildirildi && !odenecek
                  ? "Havale bildirimin bize ulaştı; ödemeyi hesabımızda görünce onaylıyoruz."
                  : (
                      <>
                        <span className="sm:hidden">Ödeyince kurulumda bir sonraki adıma geçersin.</span>
                        <span className="hidden sm:inline">Ödemeni tamamladığında kurulum yolculuğunda bir sonraki adıma geçersin.</span>
                      </>
                    )}
              </div>
            </div>
            {odenecek && (
              <Link
                href={`/panel/odemelerim/ode/${odenecek.id}`}
                className="flex h-12 flex-none items-center justify-center gap-2 rounded-[12px] bg-ink px-5 text-[14px] font-bold text-white transition hover:bg-brand sm:h-11"
              >
                Şimdi öde
                <Icon name="arrowRight" size={16} />
              </Link>
            )}
          </div>
        )}

        {satirlar.length === 0 ? (
          /*
            Kurumsal katılımcının burada hiç satırı yok ve olmayacak — ödemeyi
            başkası yaptı, fatura da ona kesildi. "Henüz bir ödeme kaydın yok"
            demek onu ödemesi eksikmiş gibi bırakıyordu; oysa yapması gereken
            bir şey yok.
          */
          <div className="rounded-[18px] border border-[#E6E8EF] bg-white px-8 py-14 text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] ${
                erisim.kurumsal ? "bg-[rgba(24,140,90,0.13)] text-[#15774E]" : "bg-mist text-[#656B7A]"
              }`}
            >
              <Icon name={erisim.kurumsal ? "check" : "card"} size={22} strokeWidth={erisim.kurumsal ? 2.5 : 2} />
            </div>
            {erisim.kurumsal ? (
              <>
                <p className="mt-4 text-[15.5px] font-semibold text-ink">Eğitim ücretin karşılandı</p>
                <p className="mx-auto mt-[6px] max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
                  {erisim.odeyen
                    ? `Kaydın ${erisim.odeyen} tarafından kurumsal olarak alındı.`
                    : "Kaydın kurumsal olarak alındı."}{" "}
                  Senden bir ödeme beklenmiyor; fatura ödemeyi yapan tarafa kesiliyor.
                </p>
              </>
            ) : (
              <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
                Henüz bir ödeme kaydın yok. Eğitim ücreti tanımlandığında burada görünecek.
              </p>
            )}
          </div>
        ) : (
          <section className="overflow-hidden lg:rounded-[18px] lg:border lg:border-[#E6E8EF] lg:bg-white">
            <h2 className="px-1 pb-3 text-[17px] font-bold text-ink lg:px-[22px] lg:pt-[18px] lg:pb-2">
              <span className="lg:hidden">Kayıtlar</span>
              <span className="hidden lg:inline">Ödeme kayıtları</span>
            </h2>
            <div className={`${IZGARA} hidden border-b border-[#EEF0F5] px-[22px] py-2 font-mono text-[10px] tracking-[0.12em] text-[#8A92A6] uppercase lg:grid`}>
              <div>Kalem</div>
              <div>Tarih</div>
              <div>Yöntem</div>
              <div>Durum</div>
              <div className="text-right">Tutar</div>
            </div>
            <ul className="flex flex-col gap-2.5 lg:gap-0">
              {satirlar.map((s) => {
                const d = DURUM[s.durum];
                const ode = odemeAcik && s.durum === "bekliyor" && s.onlineOdeme;
                const kalem = s.koltukSayisi > 1 ? `Kurumsal kayıt · ${s.koltukSayisi} kişi` : "Eğitim ücreti";
                const yontem = s.yontem ?? (s.durum === "bekliyor" ? "Seçilmedi" : "—");
                const rozet = (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full px-2 py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase" style={{ color: d.renk, background: d.zemin }}>
                      {d.etiket}
                    </span>
                    {s.durum === "bekliyor" && s.havaleBildirimi && (
                      <span className="rounded-full bg-[#EEF2FC] px-2 py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#4A5060] uppercase">
                        Bildirildi
                      </span>
                    )}
                  </span>
                );
                const ikon = (
                  <span className="relative h-11 w-11 flex-none">
                    <span className="absolute top-1.5 left-1.5 h-10 w-10 rotate-[8deg] rounded-[12px] bg-[#C9D6FF] opacity-60" />
                    <span className="absolute inset-[0_5px_5px_0] flex items-center justify-center rounded-[11px] border border-[#DCE4FF] bg-[linear-gradient(150deg,#fff,#EEF2FF)] text-brand">
                      <MenuIkon ikon="card" boyut={16} kalinlik={2} />
                    </span>
                  </span>
                );
                return (
                  <li key={s.id} className="border-[#F1F3F7] lg:border-b lg:last:border-b-0">
                    {/* Masaüstü: tablo satırı */}
                    <div className={`${IZGARA} hidden items-center px-[22px] py-4 lg:grid`}>
                      <div className="flex min-w-0 items-center gap-3">
                        {ikon}
                        <div className="min-w-0">
                          <div className="truncate text-[14.5px] font-bold text-ink">{kalem}</div>
                          <div className="truncate text-[12.5px] text-[#5B6478]">
                            {s.kurs ?? "Genel"}
                            {s.faturaNo ? ` · Fatura ${s.faturaNo}` : ""}
                          </div>
                          {s.not && <div className="mt-0.5 text-[12.5px] text-[#5B6478]">{s.not}</div>}
                        </div>
                      </div>
                      <div className="font-mono text-[12.5px] text-[#3A3F4F]">{tarihBicimi.format(new Date(s.tarih))}</div>
                      <div className="truncate text-[13px] text-[#8A92A6]">{yontem}</div>
                      <div>{rozet}</div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[15px] font-extrabold text-ink">{paraBicimi.format(s.tutar)}</span>
                        {ode && (
                          <Link
                            href={`/panel/odemelerim/ode/${s.id}`}
                            className="rounded-[10px] bg-brand px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-ink"
                          >
                            Öde
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Telefon: kart */}
                    <div className="flex flex-col gap-3 rounded-[16px] border border-[#E6E8EF] bg-white p-3.5 lg:hidden">
                      <div className="flex items-center gap-3">
                        {ikon}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-bold text-ink">{kalem}</div>
                          <div className="truncate font-mono text-[11px] text-[#8A92A6]">
                            {s.kurs ?? "Genel"} · {tarihBicimi.format(new Date(s.tarih))}
                          </div>
                        </div>
                        <div className="flex flex-none flex-col items-end gap-1">
                          <span className="text-[16px] font-extrabold text-ink">{paraBicimi.format(s.tutar)}</span>
                          {rozet}
                        </div>
                      </div>
                      {(s.not || s.faturaNo) && (
                        <div className="text-[12.5px] text-[#5B6478]">
                          {s.faturaNo ? `Fatura ${s.faturaNo}` : ""}
                          {s.faturaNo && s.not ? " · " : ""}
                          {s.not}
                        </div>
                      )}
                      {ode && odenecek?.id !== s.id && (
                        <Link
                          href={`/panel/odemelerim/ode/${s.id}`}
                          className="flex h-11 items-center justify-center rounded-[12px] bg-brand text-[14px] font-bold text-white"
                        >
                          Öde
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </UygulamadaYok>
  );
}

const IZGARA = "grid grid-cols-[minmax(0,1.6fr)_130px_130px_150px_150px] gap-3";

const DURUM: Record<OdemeSatiri["durum"], { etiket: string; renk: string; zemin: string }> = {
  odendi: { etiket: "Ödendi", renk: "#12825A", zemin: "#E3F6EE" },
  bekliyor: { etiket: "Onay bekliyor", renk: "#9A6A00", zemin: "#FFF4D6" },
  iade: { etiket: "İade", renk: "#5B6478", zemin: "#EEF0F5" },
};

function BantSayi({ etiket, deger, renk }: { etiket: string; deger: string; renk?: string }) {
  return (
    <div className="flex flex-col gap-1 border-l border-white/14 px-7 first:border-l-0 first:pl-0 last:pr-0">
      <dt className="font-mono text-[10px] tracking-[0.14em] text-[#AFC2FF] uppercase" style={{ color: renk }}>
        {etiket}
      </dt>
      <dd className="text-[30px] leading-none font-extrabold">{deger}</dd>
    </div>
  );
}

function KutuSayi({ etiket, deger, renk }: { etiket: string; deger: string; renk?: string }) {
  return (
    <div className="rounded-[14px] border border-white/12 bg-[#070B16]/50 px-3.5 py-3">
      <div className="font-mono text-[9.5px] tracking-[0.14em] text-[#AFC2FF] uppercase" style={{ color: renk }}>
        {etiket}
      </div>
      <div className="mt-1 text-[22px] leading-none font-extrabold">{deger}</div>
    </div>
  );
}
