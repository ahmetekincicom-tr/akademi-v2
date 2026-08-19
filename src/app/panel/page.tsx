import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { Icon } from "@/components/Icon";
import { EgitimlerimKarti } from "@/components/panel/EgitimlerimKarti";
import { BaslangicAdimlari } from "@/components/panel/BaslangicAdimlari";
import { PanelHosgeldin } from "@/components/panel/PanelHosgeldin";
import { PanelUyari } from "@/components/panel/PanelUyari";
import { UygulamaKurulum } from "@/components/panel/UygulamaKurulum";
import { PushKayit } from "@/components/panel/PushKayit";
import { getBaslangic } from "@/lib/baslangic";
import { BildirimKutusu } from "@/components/panel/BildirimKutusu";
import { getBildirimler } from "@/lib/bildirimler";

export default async function PanelOverviewPage() {
  const [profil, courses, baslangic, bildirim] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getBaslangic(),
    getBildirimler(),
  ]);

  const toplamDers = courses.reduce((n, c) => n + c.dersSayisi, 0);
  const toplamTamamlanan = courses.reduce((n, c) => n + c.tamamlanan, 0);
  const genelYuzde = toplamDers ? Math.round((toplamTamamlanan / toplamDers) * 100) : 0;
  const tamamlananProgram = courses.filter((c) => c.dersSayisi > 0 && c.yuzde === 100).length;
  const aktifKurs = courses.find((c) => c.yuzde < 100) ?? courses[0];

  const kpiler = [
    { etiket: "Genel ilerleme", deger: `${genelYuzde}%`, alt: `${toplamTamamlanan}/${toplamDers} ders` },
    { etiket: "Kayıtlı program", deger: String(courses.length), alt: "aktif eğitim" },
    { etiket: "Tamamlanan ders", deger: String(toplamTamamlanan), alt: `toplam ${toplamDers} ders` },
    { etiket: "Biten program", deger: String(tamamlananProgram), alt: "eğitim tamamlandı" },
  ];

  // Karşılama kartındaki ilerleme çubuğu, aşağıdaki adım listesiyle aynı
  // kaynaktan besleniyor; iki yerde iki farklı sayı görünmesin.
  const adimToplam = baslangic.adimlar.length;
  const adimTamam = baslangic.adimlar.filter((a) => a.tamam).length;

  return (
    <main className="flex flex-col gap-[22px] p-4 pb-14 sm:p-[34px]">
      <UygulamaKurulum />
      <PushKayit />

      {/* Sıra: önce karşılama, sonra ne yapılacağı, sonra içerik. */}
      <PanelHosgeldin
        ad={profil?.ad ?? null}
        altMetin={
          courses.length > 0
            ? "Kaldığın yerden devam edebilirsin."
            : baslangic.tamamlandi
              ? "Panelin hazır. Eğitim kaydın tanımlandığında dersler burada görünecek."
              : "Kuruluma birkaç adım kaldı; aşağıdan takip edebilirsin."
        }
        ilerleme={baslangic.tamamlandi ? undefined : { tamam: adimTamam, toplam: adimToplam }}
        eylem={
          aktifKurs?.sonrakiDers
            ? {
                etiket: "Derse devam et",
                yol: `/panel/dersler?kurs=${aktifKurs.slug}&ders=${aktifKurs.sonrakiDers.id}`,
              }
            : undefined
        }
      />

      {baslangic.uyari && <PanelUyari uyari={baslangic.uyari} />}
      {!baslangic.tamamlandi && <BaslangicAdimlari adimlar={baslangic.adimlar} />}

      {/* Bildirimler ilerleme sayılarından önce: sayılar dünden bugüne
          değişmiyor, bildirim satırı ise bakılmasının sebebi. */}
      <BildirimKutusu bildirim={bildirim} />

      {courses.length === 0 ? (
        /*
          Düğme yok. Eskiden "Eğitimleri incele" vardı ve henüz açılmamış
          bir sayfaya götürüyordu: çalışmayan bir düğme, hiç düğme
          olmamasından kötü.
        */
        <div className="rounded-2xl border border-ink/10 bg-white px-6 py-12 text-center sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="grid" size={22} />
          </div>
          <h2 className="mt-4 font-heading text-xl font-semibold tracking-[-0.02em]">Henüz bir eğitim kaydın yok</h2>
          <p className="mx-auto mt-[10px] max-w-[460px] text-[14.5px] leading-[1.65] text-[#5C6273]">
            Eğitim kaydın tanımlandığında dersler, ilerlemen ve materyaller bu panelde açılır. Sorularını
            soru-cevap bölümünden iletebilirsin.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
            {kpiler.map((k) => (
              <div key={k.etiket} className="rounded-2xl border border-ink/10 bg-white p-5">
                <div className="font-mono text-[9.5px] tracking-[0.13em] text-[#656B7A] uppercase">{k.etiket}</div>
                <div className="mt-[10px] font-heading text-[30px] leading-none font-semibold tracking-[-0.03em]">
                  {k.deger}
                </div>
                <div className="mt-2 text-[13px] text-[#656B7A]">{k.alt}</div>
              </div>
            ))}
          </div>

          {/* items-start YOK: ızgara varsayılanı stretch, iki kart aynı yerde
              bitiyor. Öncesinde kartlar kendi içeriği kadar uzayıp alt kenarı
              tırtıklı bırakıyordu. */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
            <EgitimlerimKarti courses={courses} />

            {aktifKurs && aktifKurs.modules.length > 0 && (
              <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6">
                <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Modül ilerlemesi</h2>
                <p className="mt-1 text-[13px] leading-[1.45] text-[#656B7A]">{aktifKurs.baslik}</p>
                <div className="mt-5 flex flex-col gap-[14px]">
                  {aktifKurs.modules.map((m, i) => (
                    <div key={m.id}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 text-[13.5px] leading-[1.4] text-ink">
                          {/* Başlıksız modülde satır "1." diye asılı kalıyordu. */}
                          {m.baslik?.trim() ? `${i + 1}. ${m.baslik}` : `${i + 1}. modül`}
                        </span>
                        <span className="flex-none font-mono text-[11.5px] text-[#656B7A]">{m.yuzde}%</span>
                      </div>
                      <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-mist">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${m.yuzde}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
