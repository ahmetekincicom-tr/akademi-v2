import Link from "next/link";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { Icon } from "@/components/Icon";
import { EgitimlerimKarti } from "@/components/panel/EgitimlerimKarti";
import { BaslangicAdimlari } from "@/components/panel/BaslangicAdimlari";
import { PanelHosgeldin } from "@/components/panel/PanelHosgeldin";
import { PanelUyari } from "@/components/panel/PanelUyari";
import { UygulamaKurulum } from "@/components/panel/UygulamaKurulum";
import { PushKayit } from "@/components/panel/PushKayit";
import { BildirimKutusu } from "@/components/panel/BildirimKutusu";
import { OzetKarti } from "@/components/panel/OzetKarti";
import { SonrakiDersKarti } from "@/components/panel/SonrakiDersKarti";
import { DERSLER_ACIK } from "@/lib/bolumler";
import { getBaslangic } from "@/lib/baslangic";
import { getBildirimler } from "@/lib/bildirimler";
import { getEgitimOturumlarim } from "@/lib/egitim-oturumu";
import { seansAyir } from "@/lib/seans";
import { paraBicimi } from "@/lib/odeme";
import { TR_ZAMAN } from "@/lib/zaman";

const gunBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "short",
});
const saatBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  hour: "2-digit",
  minute: "2-digit",
});

/** Bugüne kalan tam gün sayısı; "3 gün sonra" gibi bir ifade için. */
function kalanGun(tarih: string): number {
  const fark = new Date(tarih).getTime() - Date.now();
  return Math.max(0, Math.ceil(fark / 86_400_000));
}

export default async function PanelOverviewPage() {
  const [profil, courses, baslangic, bildirim, oturumlar] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getBaslangic(),
    getBildirimler(),
    getEgitimOturumlarim(),
  ]);

  const toplamDers = courses.reduce((n, c) => n + c.dersSayisi, 0);
  const toplamTamamlanan = courses.reduce((n, c) => n + c.tamamlanan, 0);
  const genelYuzde = toplamDers ? Math.round((toplamTamamlanan / toplamDers) * 100) : 0;
  const aktifKurs = courses.find((c) => c.yuzde < 100) ?? courses[0];

  const { yaklasan } = seansAyir(oturumlar);
  const sonrakiOturum = yaklasan[0] ?? null;

  const bekleyen = bildirim.odemeBekliyor;

  // Karşılama kartındaki ilerleme çubuğu, aşağıdaki adım listesiyle aynı
  // kaynaktan besleniyor; iki yerde iki farklı sayı görünmesin.
  const adimToplam = baslangic.adimlar.length;
  const adimTamam = baslangic.adimlar.filter((a) => a.tamam).length;

  return (
    <main className="flex flex-col gap-5 p-4 pb-14 sm:gap-[22px] sm:p-[34px]">
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
      />

      {baslangic.uyari && <PanelUyari uyari={baslangic.uyari} />}
      {!baslangic.tamamlandi && <BaslangicAdimlari adimlar={baslangic.adimlar} />}

      {/*
        Kaldığın yer, karşılamanın hemen altında ve tek başına bir satırda.
        Panelin girişinde yapılan işlerin çoğu bu: kutulardan biri olarak
        araya karışması, en sık tıklanan şeyi en zor bulunan şey yapıyordu.

        Dersler kapalıyken hiç basılmıyor. Ders yokken kart "program
        tamamlandı, tekrar izle" diyordu: sonrakiDers null olduğunda kalan
        tek yorum bu ve daha ilk dersi görmemiş kişiye söylenecek en yanlış
        cümle. Sayının değil, bölümün kendisinin olmaması sorundu.
      */}
      {DERSLER_ACIK && aktifKurs && <SonrakiDersKarti kurs={aktifKurs} />}

      {/*
        Özet kutuları. Dördü de artık bir yere gidiyor ve üçü değişken bir
        değer taşıyor — eskiden dördü de ders sayısının farklı yazılışıydı
        ("2/16", "2", "16") ve dünden bugüne hiçbiri değişmiyordu.
      */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
        {/*
          Dersler kapalıyken "Genel ilerleme %0" yazmak yanlış bilgi: kişi
          geri kalmış değil, bölüm henüz açılmamış. Yerine kurulumun neresinde
          olduğu yazıyor — o gerçekten değişen ve onu ilgilendiren sayı.
        */}
        {DERSLER_ACIK ? (
          <OzetKarti
            etiket="Genel ilerleme"
            deger={`${genelYuzde}%`}
            alt={toplamDers ? `${toplamTamamlanan}/${toplamDers} ders tamamlandı` : "Henüz ders yok"}
            ikon="check"
            yuzde={genelYuzde}
            yol={aktifKurs ? `/panel/dersler?kurs=${aktifKurs.slug}` : undefined}
          />
        ) : (
          <OzetKarti
            etiket="Kurulum"
            deger={`${adimTamam}/${adimToplam}`}
            alt={baslangic.tamamlandi ? "Bütün adımlar tamam" : "adım tamamlandı"}
            ikon="check"
            yuzde={adimToplam ? Math.round((adimTamam / adimToplam) * 100) : 0}
          />
        )}

        <OzetKarti
          etiket="Kayıtlı program"
          deger={String(courses.length)}
          alt={courses.length === 1 ? "aktif eğitim" : "aktif eğitim kaydı"}
          ikon="playCircle"
          yol={DERSLER_ACIK && courses.length > 0 ? "/panel/dersler" : undefined}
        />

        {/* Yaklaşan ders: sayfadaki tek gerçek zamanlı değer. */}
        <OzetKarti
          etiket="Yaklaşan ders"
          deger={sonrakiOturum ? gunBicimi.format(new Date(sonrakiOturum.baslangic)) : "—"}
          alt={
            sonrakiOturum
              ? `${saatBicimi.format(new Date(sonrakiOturum.baslangic))} · ${
                  kalanGun(sonrakiOturum.baslangic) === 0
                    ? "bugün"
                    : `${kalanGun(sonrakiOturum.baslangic)} gün sonra`
                }`
              : "Planlanmış oturum yok"
          }
          ikon="calendar"
          yol="/panel/birebir-egitim"
        />

        {/* Bekleyen ödeme varsa kutu kırmızıya dönüyor; yoksa sessiz kalıyor. */}
        <OzetKarti
          etiket="Ödeme durumu"
          deger={bekleyen ? paraBicimi.format(bekleyen.tutar) : "Temiz"}
          alt={
            bekleyen
              ? bekleyen.adet > 1
                ? `${bekleyen.adet} kayıt bekliyor`
                : "1 kayıt bekliyor"
              : "Bekleyen ödemen yok"
          }
          ikon="card"
          vurgu={Boolean(bekleyen)}
          yol="/panel/odemelerim"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.44fr)]">
        {/* Sol sütun: içerik. Sağ sütun: durum. */}
        <div className="flex flex-col gap-5">
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
              <h2 className="mt-4 font-heading text-xl font-semibold tracking-[-0.02em]">
                Henüz bir eğitim kaydın yok
              </h2>
              <p className="mx-auto mt-[10px] max-w-[460px] text-[14.5px] leading-[1.65] text-[#5C6273]">
                Eğitim kaydın tanımlandığında dersler, ilerlemen ve materyaller bu panelde açılır.
                Sorularını soru-cevap bölümünden iletebilirsin.
              </p>
            </div>
          ) : (
            <EgitimlerimKarti courses={courses} />
          )}

          {DERSLER_ACIK && aktifKurs && aktifKurs.modules.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="flex flex-wrap items-center gap-2.5 border-b border-ink/7 px-5 py-4 sm:px-6">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand/11 text-brand">
                  <Icon name="grid" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">
                    Modül ilerlemesi
                  </h2>
                  <p className="mt-[2px] truncate text-[12.5px] text-[#656B7A]">{aktifKurs.baslik}</p>
                </div>
                <span className="flex-none font-mono text-[11px] text-[#656B7A]">
                  {aktifKurs.modules.length} modül
                </span>
              </div>

              <div className="flex flex-col gap-[15px] px-5 py-5 sm:px-6">
                {aktifKurs.modules.map((m, i) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        {/*
                          Bitmiş modülde numara yerine onay: liste aşağı
                          indikçe "nerede kaldım" sorusunun cevabı, yüzdeleri
                          tek tek okumadan görünüyor.
                        */}
                        <span
                          className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full font-mono text-[10px] font-semibold"
                          style={
                            m.yuzde === 100
                              ? { background: "rgba(24,140,90,0.14)", color: "#15774E" }
                              : { background: "#EEF2FC", color: "#5C6273" }
                          }
                        >
                          {m.yuzde === 100 ? <Icon name="check" size={12} /> : i + 1}
                        </span>
                        <span className="min-w-0 truncate text-[13.5px] leading-[1.4] text-ink">
                          {/* Başlıksız modülde satır "1." diye asılı kalıyordu. */}
                          {m.baslik?.trim() ? m.baslik : `${i + 1}. modül`}
                        </span>
                      </span>
                      <span className="flex-none font-mono text-[11.5px] text-[#656B7A]">
                        {m.tamamlanan}/{m.dersler.length}
                      </span>
                    </div>
                    <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-mist">
                      <div
                        className="h-full rounded-full transition-[width] duration-700 ease-out"
                        style={{
                          width: `${m.yuzde}%`,
                          background: m.yuzde === 100 ? "#188C5A" : "#1C56F3",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <BildirimKutusu bildirim={bildirim} />
          <KisayolKutusu />
        </div>
      </div>
    </main>
  );
}

/**
 * Kısayollar.
 *
 * Bildirim kutusu yalnızca bir şey OLDUĞUNDA satır gösteriyor; sakin bir
 * günde sağ sütun tek bir "bekleyen bir şey yok" cümlesiyle kalıyordu.
 * Kısayollar o boşluğu dolduruyor ve panelde az kullanılan ama işe yarayan
 * bölümleri görünür tutuyor.
 */
function KisayolKutusu() {
  const kisayollar = [
    { yol: "/panel/birebir-egitim", etiket: "Birebir eğitim", alt: "Kayıtlar ve takvim", ikon: "calendar" },
    { yol: "/panel/dokumanlar", etiket: "Dokümanlar", alt: "Şablon ve kaynaklar", ikon: "file" },
    { yol: "/panel/soru-cevap", etiket: "Soru-cevap", alt: "Eğitmene yaz", ikon: "message" },
    { yol: "/panel/gorusmeler", etiket: "Danışmanlık", alt: "Görüşme talebi", ikon: "users" },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
        <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Kısayollar</h2>
      </div>
      <div className="grid grid-cols-2">
        {kisayollar.map((k, i) => (
          <Link
            key={k.yol}
            href={k.yol}
            className={`group flex flex-col gap-2 p-[18px] transition hover:bg-mist ${
              i % 2 === 0 ? "border-r border-ink/7" : ""
            } ${i < 2 ? "border-b border-ink/7" : ""}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-mist text-[#5C6273] transition group-hover:bg-brand/11 group-hover:text-brand">
              <Icon name={k.ikon} size={16} />
            </span>
            <span className="text-[13.5px] leading-[1.3] font-semibold text-ink">{k.etiket}</span>
            <span className="text-[11.5px] leading-[1.4] text-[#656B7A]">{k.alt}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
