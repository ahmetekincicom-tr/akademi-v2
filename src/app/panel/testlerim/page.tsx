import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOnDegerlendirmeFormu } from "@/lib/form-ayarlari";
import { getErisim } from "@/lib/erisim";
import { Icon } from "@/components/Icon";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function TestlerimPage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    formUrl,
    erisim,
  ] = await Promise.all([supabase.auth.getUser(), getOnDegerlendirmeFormu(), getErisim()]);

  const { data: profil } = await supabase
    .from("profiles")
    .select("on_degerlendirme_tarihi")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const tamamTarih = profil?.on_degerlendirme_tarihi ?? null;
  /*
    Eğitim satın alınmadan test açılmıyor; sıra bozulursa süreç karışıyor.

    "Satın alınmış" olmak, kişinin KENDİ ödemesi demek değil: kurumsal
    kayıtta ödemeyi ajans yapıyor, katılımcının kendi ödeme satırı hiç
    olmuyor. Kuralın tek yeri lib/erisim.ts.
  */
  const odendi = erisim.var;
  const acik = odendi && Boolean(formUrl);

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Testlerim
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitim sürecinde doldurman gereken formlar. Cevapların yalnızca eğitmene açıktır.
      </p>

      <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6">
          <span
            className={`flex h-11 w-11 flex-none items-center justify-center rounded-[13px] ${
              tamamTarih ? "bg-[rgba(28,86,243,0.12)] text-brand" : "bg-mist text-[#656B7A]"
            }`}
          >
            <Icon name={tamamTarih ? "check" : "file"} size={20} strokeWidth={tamamTarih ? 2.6 : 2} />
          </span>

          {/* basis yalnızca sm'den itibaren: kapsayıcı mobilde flex-col olduğu
              için orada basis genişliği değil YÜKSEKLİĞİ belirler. */}
          <div className="min-w-0 sm:grow sm:basis-[240px]">
            <div className="text-[15.5px] font-semibold text-ink">Ön değerlendirme</div>
            <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">
              {tamamTarih
                ? `${tarihBicimi.format(new Date(tamamTarih))} tarihinde tamamladın.`
                : acik
                  ? "Eğitimi sana göre kurabilmemiz için kısa bir soru seti."
                  : odendi
                    ? "Form henüz tanımlanmadı. Eğitmen eklediğinde burada açılacak."
                    : "Ödemen onaylandıktan sonra açılır."}
            </div>
          </div>

          {tamamTarih ? (
            // Tamamlanan test yeniden doldurulamaz: cevaplar Tally'de kayıtlı
            // ve ikinci bir gönderim eğitmende çelişkili iki kayıt bırakır.
            <span className="w-fit flex-none rounded-full bg-[rgba(28,86,243,0.12)] px-[11px] py-[5px] font-mono text-[9.5px] tracking-[0.08em] text-brand uppercase">
              Tamamlandı
            </span>
          ) : acik ? (
            <Link
              href="/panel/on-degerlendirme"
              className="h-10 flex-none rounded-[10px] bg-brand px-[18px] text-[13.5px] leading-10 font-semibold text-white transition hover:bg-ink"
            >
              Testi doldur
            </Link>
          ) : (
            <span className="w-fit flex-none rounded-full bg-mist px-[11px] py-[5px] font-mono text-[9.5px] tracking-[0.08em] text-[#656B7A] uppercase">
              Kilitli
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
