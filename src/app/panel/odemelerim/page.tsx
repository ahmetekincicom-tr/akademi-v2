import Link from "next/link";
import { getOdemelerim, getBanka, paraBicimi } from "@/lib/odeme";
import { UygulamadaYok } from "@/components/panel/SadeceWeb";
import { durumStil } from "@/lib/admin/shared";
import { odemeDurumEtiket } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";
import { TR_ZAMAN } from "@/lib/zaman";
import { iyzicoAyari } from "@/lib/iyzico";
import { getErisim } from "@/lib/erisim";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
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

  return (
    <UygulamadaYok>
      <main className="p-4 pb-14 sm:p-[34px]">
        <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
          Ödemelerim
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
          Eğitim ücretlerinin kaydı. Ödemen bize ulaştığında durumu &quot;Ödendi&quot; olarak işaretliyoruz.
        </p>

        {sonucKutusu && (
          <div
            className="mt-[22px] flex items-start gap-[13px] rounded-2xl border px-5 py-4 sm:px-6"
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

        {bekleyenAdet > 0 && (
          <div className="mt-[22px] flex flex-wrap items-center gap-4 rounded-2xl border border-[#E0A21C]/35 bg-[#FDF6E7] px-5 py-4 sm:px-6">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-[#E0A21C]/18 text-[#8A6210]">
              <Icon name="card" size={19} />
            </span>
            <div className="min-w-0 grow basis-[220px]">
              <div className="text-[15.5px] font-semibold">
                Bekleyen tutar · {paraBicimi.format(bekleyenTutar)}
              </div>
              <div className="mt-[2px] text-[13.5px] text-[#5C6273]">{bekleyenAdet} kayıt onay bekliyor.</div>
            </div>
          </div>
        )}

        {satirlar.length === 0 ? (
          /*
            Kurumsal katılımcının burada hiç satırı yok ve olmayacak — ödemeyi
            başkası yaptı, fatura da ona kesildi. "Henüz bir ödeme kaydın yok"
            demek onu ödemesi eksikmiş gibi bırakıyordu; oysa yapması gereken
            bir şey yok.
          */
          <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
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
          <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
            {satirlar.map((s) => {
              // Etiket admin tarafıyla ortak: durumStil renkleri bu metinlere göre
              // seçiyor, kendi sözlüğümü yazarsam rozetler griye düşüyordu.
              const etiket = odemeDurumEtiket[s.durum] ?? s.durum;
              const st = durumStil(etiket);
              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-[16px]"
                >
                  {/* basis yalnızca sm'den itibaren: kapsayıcı mobilde flex-col
                    olduğu için orada basis genişliği değil YÜKSEKLİĞİ belirler
                    ve satırın ortasında boş bir blok bırakır. */}
                  <div className="min-w-0 sm:grow sm:basis-[220px]">
                    <div className="text-[15px] leading-[1.3] font-semibold text-ink">
                      {paraBicimi.format(s.tutar)}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">
                      {s.kurs ?? "Genel"} · {tarihBicimi.format(new Date(s.tarih))}
                      {s.yontem ? ` · ${s.yontem}` : ""}
                    </div>
                    {/* Kurumsal kayıtta tutarın neyi kapsadığı satırın kendi
                        üstünde yazmalı: ödeme ekranına gelen kişi "bu rakam
                        tek kişilik mi" diye sormamalı. */}
                    {s.koltukSayisi > 1 && (
                      <div className="mt-[6px] inline-flex items-center gap-[6px] rounded-full bg-mist px-[10px] py-[3px] text-[12px] font-semibold text-[#4A5060]">
                        <Icon name="users" size={13} />
                        {s.koltukSayisi} kişilik kurumsal kayıt
                      </div>
                    )}
                    {s.not && <div className="mt-[6px] text-[13px] text-[#5C6273]">{s.not}</div>}
                  </div>

                  {s.faturaNo && (
                    <div className="flex-none font-mono text-[10.5px] text-[#656B7A]">
                      Fatura {s.faturaNo}
                    </div>
                  )}

                  <span
                    className="w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                    style={{ background: st.bg, color: st.renk }}
                  >
                    {etiket}
                  </span>

                  {s.durum === "bekliyor" && s.havaleBildirimi && (
                    <span className="w-fit flex-none rounded-full bg-[#EEF2FC] px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#4A5060] uppercase">
                      Bildirildi
                    </span>
                  )}

                  {odemeAcik && s.durum === "bekliyor" && s.onlineOdeme && (
                    <Link
                      href={`/panel/odemelerim/ode/${s.id}`}
                      className="flex h-9 w-full flex-none items-center justify-center gap-[7px] rounded-[10px] bg-ink px-4 text-[13.5px] font-semibold text-white transition hover:bg-brand sm:w-auto"
                    >
                      <Icon name="card" size={15} />
                      Ödeme yap
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </UygulamadaYok>
  );
}
