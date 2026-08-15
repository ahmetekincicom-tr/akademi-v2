import type { Referans } from "@/lib/icerik";

/**
 * Hero görseli: iç içe üç yörüngede dönen referans logoları.
 *
 * Kaynak bileşenden farklar ve sebepleri:
 *
 * 1. Yörünge boyutları rem değil YÜZDE. Sabit rem'de halkalar kapsayıcıdan
 *    taşıyor ve her kırılma noktası için ayrı boyut yazmak gerekiyordu; yüzde
 *    kapsayıcıyla birlikte ölçekleniyor.
 * 2. Logolar halkayla birlikte dönmüyor. Kaynakta simgeler halkanın çocuğu
 *    olduğu için onunla beraber takla atıyor; soyut ikonlarda fark edilmiyor
 *    ama yazı içeren marka logoları baş aşağı gelince bozuk görünüyor. Halka
 *    ileri, logo aynı sürede geri dönüyor — logo dik kalıyor.
 * 3. İçerik React/Docker/AWS değil, sitenin kendi referans logoları.
 */
export function HeroYorunge({ referanslar }: { referanslar: Referans[] }) {
  const YORUNGE = 3;
  // Halka çapları kapsayıcının yüzdesi, aralar eşit (22 puan).
  //
  // Dış halka %86'da duruyor: logo rozetleri halkanın ÜZERİNDE ortalandığı için
  // yarıçapı kendi yarım boyları kadar aşıyorlar. %94 olsaydı rozetler
  // kapsayıcıdan taşar ve hero bölümünün overflow-hidden'ı onları keserdi.
  const capYuzde = [42, 64, 86];
  // Dıştaki halka daha yavaş dönüyor; hepsi aynı hızda olsaydı iç halkalar
  // duruyormuş gibi görünürdü (açısal hız aynı, çizgisel hız farklı).
  const sure = [26, 34, 42];

  const gorunur = referanslar.filter((r) => r.logoUrl);
  const halkaBasi = Math.max(1, Math.ceil(gorunur.length / YORUNGE));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      {/* Merkez: marka işareti */}
      <div className="absolute top-1/2 left-1/2 flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-ink shadow-[0_18px_44px_rgba(0,0,0,0.5)]">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-brand font-heading text-[17px] font-bold text-white">
          AE
        </span>
      </div>

      {Array.from({ length: YORUNGE }).map((_, halkaIdx) => {
        const cap = capYuzde[halkaIdx];
        const dilim = gorunur.slice(halkaIdx * halkaBasi, halkaIdx * halkaBasi + halkaBasi);
        const aciAdim = (2 * Math.PI) / Math.max(dilim.length, 1);

        return (
          <div
            key={halkaIdx}
            className="yorunge absolute top-1/2 left-1/2 rounded-full border border-dashed border-white/16"
            style={{
              width: `${cap}%`,
              height: `${cap}%`,
              // -50% kaydırma animasyonun transform'uyla çakışmasın diye
              // margin ile yapılıyor: dönen öğede translate kullanılsaydı
              // rotate onu ezerdi.
              marginLeft: `-${cap / 2}%`,
              marginTop: `-${cap / 2}%`,
              animationDuration: `${sure[halkaIdx]}s`,
            }}
          >
            {dilim.map((r, i) => {
              // Başlangıç açısı halkadan halkaya kaydırılıyor; hepsi aynı
              // açıdan başlasaydı logolar tek bir yarıçap üzerinde dizilirdi.
              const aci = i * aciAdim + halkaIdx * 0.6;
              const x = 50 + 50 * Math.cos(aci);
              const y = 50 + 50 * Math.sin(aci);

              return (
                <div
                  key={r.id}
                  className="absolute flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/12 bg-white shadow-[0_10px_26px_rgba(0,0,0,0.35)]"
                  style={{ left: `${x}%`, top: `${y}%`, marginLeft: -26, marginTop: -26 }}
                >
                  {/* Ters dönüş: halka ile aynı süre, zıt yön. */}
                  <span
                    className="yorunge-ters flex items-center justify-center"
                    style={{ animationDuration: `${sure[halkaIdx]}s` }}
                  >
                    {/* Supabase Storage adresi; next/image için remotePatterns
                        gerekirdi, mevcut logolar zaten optimize yükleniyor. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.logoUrl!}
                      alt=""
                      loading="lazy"
                      className="h-[26px] w-[34px] object-contain"
                    />
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
