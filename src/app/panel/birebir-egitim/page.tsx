import { getEgitimOturumlarim, getKayitArsivim } from "@/lib/egitim-oturumu";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { seansAyir } from "@/lib/seans";
import { guvenliUrl } from "@/lib/guvenli-url";
import { oynatmaCoz } from "@/lib/oynatma";
import { Icon } from "@/components/Icon";
import { SeansKaydi } from "@/components/panel/SeansKaydi";

/**
 * Birebir eğitimin kayıtları ve takvimi. Eğitim bittikten sonra kullanılan
 * görüşme hakları ayrı sayfada: /panel/seanslar.
 *
 * Sayfa iki bölüme ayrıldı, bilerek. Kayıt bağlantısı önce her oturumun kendi
 * satırında duruyordu; kayıtlar tek bir klasörde toplandığı için aynı adres
 * her derste tekrar ediyor, katılımcı da "kayıtlar nerede" sorusunun cevabını
 * takvimin içinde arıyordu. Kayıtlar artık başlı başına bir bölüm; takvim
 * yalnızca "ne zaman, hangi konu, nereden katılacağım" sorusuna bakıyor.
 */
export default async function PanelBirebirEgitimPage() {
  const [oturumlar, arsiv] = await Promise.all([getEgitimOturumlarim(), getKayitArsivim()]);
  const { yaklasan, gecmis } = seansAyir(oturumlar);

  const kart = (o: (typeof oturumlar)[number]) => {
    const etiket = seansDurumEtiket[o.durum];
    const st = durumStil(etiket);
    const toplanti = guvenliUrl(o.toplantiLink);
    /*
      Oturuma özel kayıt hâlâ destekleniyor: "yalnızca şu dersin kaydı"
      demek isteyen durum var ve eskiden girilmiş bağlantılar da geçerli.
      Ortak klasör yukarıdaki bölümde; buradaki satır ona ek.
    */
    const kayitKaynak = guvenliUrl(o.kayitLink);
    const kayit = kayitKaynak ? oynatmaCoz(o.kayitLink) : null;

    return (
      <div
        key={o.id}
        className="flex flex-col gap-3 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-[16px]"
      >
        <div className="order-2 sm:order-none sm:w-[150px] sm:flex-none">
          <div className="font-mono text-[12px] font-medium text-ink">
            {saatBicimi.format(new Date(o.baslangic))}
          </div>
          <div className="mt-[2px] font-mono text-[10px] text-[#656B7A]">{o.sureDk} dk</div>
        </div>
        <div className="order-1 min-w-0 sm:order-none sm:flex-1">
          <div className="text-[15px] leading-[1.3] font-semibold text-ink">{o.konu || "Eğitim oturumu"}</div>
          <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">{o.program}</div>
        </div>
        <span
          className="order-3 w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase sm:order-none"
          style={{ background: st.bg, color: st.renk }}
        >
          {etiket}
        </span>
        {toplanti && o.durum === "planlandi" && (
          <a
            href={toplanti}
            target="_blank"
            rel="noreferrer"
            className="order-4 inline-flex h-9 w-fit flex-none items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink sm:order-none"
          >
            <Icon name="external" size={14} />
            Derse katıl
          </a>
        )}
        {kayit && kayitKaynak && (
          <SeansKaydi video={kayit} kaynak={kayitKaynak} baslik={o.konu || "Eğitim kaydı"} />
        )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Birebir eğitim
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Ders kayıtların ve eğitim takvimin.
      </p>

      {/* ------------------------------------------------ eğitim kayıtları --- */}
      <section className="mt-[26px]">
        <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Eğitim kayıtları</h2>
        <p className="mt-1.5 max-w-[620px] text-[14px] leading-[1.6] text-[#5C6273]">
          Derslerin ekran kayıtları burada toplanıyor. Klasör canlı: yeni ders işlendikçe kayıt aynı yere
          ekleniyor, senin bir şey yapman gerekmiyor.
        </p>

        {arsiv.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink/16 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
              <Icon name="folder" size={22} />
            </div>
            <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
              Henüz paylaşılmış bir kayıt klasörün yok. İlk dersinden sonra kayıtlar burada görünmeye
              başlayacak.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {arsiv.map((a) => {
              const kaynak = guvenliUrl(a.link);
              if (!kaynak) return null;
              const video = oynatmaCoz(a.link);
              const baslik = a.baslik || "Ders kayıtları";

              return (
                <div key={a.id} className="rounded-2xl border border-ink/10 bg-white px-5 py-[18px] sm:px-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] bg-brand/11 text-brand">
                      <Icon name="folder" size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15.5px] leading-[1.3] font-semibold text-ink">{baslik}</div>
                      {a.program && (
                        <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">{a.program}</div>
                      )}
                    </div>
                  </div>

                  {a.aciklama && (
                    <p className="mt-2.5 text-[14px] leading-[1.6] text-[#5C6273]">{a.aciklama}</p>
                  )}

                  {/*
                    Gömülebilen bir kaynaksa (Drive klasörü, video) sayfadan
                    çıkmadan açılıyor; değilse yalnızca bağlantı veriliyor —
                    gömülemeyen bir adres için boş bir çerçeve açmak, hiç
                    açmamaktan kötü.
                  */}
                  <div className="mt-3">
                    {video ? (
                      <SeansKaydi video={video} kaynak={kaynak} baslik={baslik} />
                    ) : (
                      <a
                        href={kaynak}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-fit items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink"
                      >
                        <Icon name="external" size={14} />
                        Kayıtları aç
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- eğitim planı --- */}
      <section className="mt-10">
        <h2 className="font-heading text-[19px] font-semibold tracking-[-0.02em]">Eğitim planı</h2>
        <p className="mt-1.5 max-w-[620px] text-[14px] leading-[1.6] text-[#5C6273]">
          Planlanan derslerin tarihi, konusu ve katılım bağlantısı.
        </p>

        {oturumlar.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink/16 bg-white px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
              <Icon name="calendar" size={22} />
            </div>
            <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
              Henüz planlanmış bir eğitim oturumun yok. Ön değerlendirmen tamamlandıktan sonra tarihleri
              birlikte belirliyoruz.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
                <h3 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Yaklaşan</h3>
              </div>
              {yaklasan.length === 0 ? (
                <p className="px-5 py-8 text-center text-[14px] text-[#656B7A] sm:px-6">
                  Planlanmış oturumun yok.
                </p>
              ) : (
                yaklasan.map(kart)
              )}
            </div>

            {gecmis.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="border-b border-ink/7 px-5 py-4 sm:px-6">
                  <h3 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Geçmiş</h3>
                </div>
                {gecmis.map(kart)}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
