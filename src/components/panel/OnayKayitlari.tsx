import Link from "next/link";
import { Icon } from "@/components/Icon";
import { BAGLAM_ETIKET, type RizaKaydi } from "@/lib/riza-tipleri";
import { TR_ZAMAN } from "@/lib/zaman";

/*
  Saat de yazılıyor, yalnızca tarih değil. Onayın ne zaman verildiği ispat
  gerektiren bir bilgi ve "20 Ağustos" bir gün boyunca her an olabilir.
  Saniye yok: o ayrıntıyı okuyan yok, gereken kayıt zaten veritabanında tam
  hassasiyetle duruyor.
*/
const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Metni panelde açılabilen belgeler; kendi adı olan onaylarda bağlantı yok. */
const YASAL_SLUGLAR = new Set([
  "uyelik-sozlesmesi",
  "kisisel-verilerin-islenmesi",
  "gizlilik-politikasi",
  "satis-sozlesmesi",
  "iptal-iade-politikasi",
]);

/**
 * Verilen onayların zaman damgalı listesi.
 *
 * Metnin SHA-256 özeti burada gösterilmiyor. İşe yaradığı yer bir uyuşmazlık
 * ve orada bakan kişi yönetici — katılımcı için okunacak bir bilgi değil.
 * Yönetimdeki öğrenci detayında duruyor.
 */
export function OnayKayitlari({ kayitlar }: { kayitlar: RizaKaydi[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-ink/8 px-5 py-[18px] sm:px-[26px]">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand/11 text-brand">
          <Icon name="shield" size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Onaylarım</h2>
          <p className="mt-[2px] text-[13px] leading-[1.5] text-[#656B7A]">
            Hangi metni ne zaman kabul ettiğinin kaydı. Kayıtlar değiştirilemez.
          </p>
        </div>
      </div>

      {kayitlar.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13.5px] leading-[1.6] text-[#656B7A] sm:px-[26px]">
          Kayıtlı bir onay görünmüyor. Bu hesap onay kaydı tutulmaya başlanmadan önce açılmış olabilir;
          üyelik onayının tarihi profilinde duruyor.
        </p>
      ) : (
        <ul className="divide-y divide-ink/7">
          {kayitlar.map((k) => (
            <li key={k.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-4 sm:px-[26px]">
              <span className="mt-[2px] flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[rgba(24,140,90,0.13)] text-[#15774E]">
                <Icon name="check" size={14} strokeWidth={2.8} />
              </span>

              <div className="min-w-0 grow basis-[220px]">
                <div className="flex flex-wrap items-center gap-2">
                  {YASAL_SLUGLAR.has(k.belge) ? (
                    <Link
                      href={`/${k.belge}`}
                      target="_blank"
                      className="text-[14.5px] leading-[1.3] font-semibold text-ink underline decoration-ink/25 underline-offset-[3px] hover:text-brand hover:decoration-brand"
                    >
                      {k.baslik}
                    </Link>
                  ) : (
                    <span className="text-[14.5px] leading-[1.3] font-semibold text-ink">{k.baslik}</span>
                  )}
                  <span className="rounded-full bg-mist px-[8px] py-[2px] font-mono text-[9px] tracking-[0.1em] text-[#5C6273] uppercase">
                    {BAGLAM_ETIKET[k.baglam] ?? k.baglam}
                  </span>
                </div>

              </div>

              <time
                dateTime={k.tarih}
                className="flex-none font-mono text-[11.5px] whitespace-nowrap text-[#5C6273]"
              >
                {anBicimi.format(new Date(k.tarih))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
