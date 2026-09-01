import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { seansAyir } from "@/lib/seans";
import { saatBicimi } from "@/lib/admin/format";
import { guvenliUrl } from "@/lib/guvenli-url";
import { Icon } from "@/components/Icon";

/**
 * Takvim: planlanmış her şeyin tek listesi.
 *
 * Bu ekran eskiden "seanslar" tablosuna yazan ayrı bir planlama ekranıydı ve
 * kullanılmıyordu — birebir dersler "Birebir eğitim"den, danışmanlıklar
 * "Danışmanlık talepleri"nden planlanıyor. Üçüncü bir planlama yeri hem
 * gereksiz hem de tehlikeliydi: oraya yazılan bir ders ne katılımcının
 * panelinde ne de Google Takvim'de görünüyordu.
 *
 * Yerine SALT OKUNUR bir gündem kondu. Planlama hâlâ kendi ekranında
 * yapılıyor (tek bir doğru yer), burası ise "önümüzdeki hafta neyim var"
 * sorusunu iki ekran arasında gidip gelmeden yanıtlıyor.
 *
 * `seanslar` tablosuna dokunulmadı: içindeki kayıtlar duruyor, yalnızca
 * yazan ekran kaldırıldı. Kullanılmayan bir tabloyu silmek geri alınamaz bir
 * iş ve buradaki kazanç sıfır.
 */

type Satir = {
  id: string;
  tur: "egitim" | "danismanlik";
  baslangic: string;
  sureDk: number;
  kisi: string;
  baslik: string;
  toplantiLink: string;
  durum: "planlandi" | "tamamlandi" | "iptal";
  href: string;
};

function adiyla(p: { ad: string | null; soyad: string | null; email: string | null } | null) {
  return [p?.ad, p?.soyad].filter(Boolean).join(" ").trim() || p?.email || "—";
}

export default async function AdminTakvimPage() {
  const supabase = await createClient();

  const [{ data: oturumlar }, { data: gorusmeler }] = await Promise.all([
    supabase
      .from("egitim_oturumlari")
      .select("id, baslangic, sure_dk, konu, toplanti_link, durum, profiles(ad, soyad, email), courses(baslik)")
      .order("baslangic", { ascending: true }),
    /*
      Tarihi olmayan görüşmeler DIŞARIDA: talep gelmiş ama henüz
      planlanmamış kayıtların takvimde yeri yok, onlar "Danışmanlık
      talepleri" ekranının işi.
    */
    supabase
      .from("gorusmeler")
      .select("id, baslangic, sure_dk, konu, toplanti_link, durum, profiles(ad, soyad, email)")
      .not("baslangic", "is", null)
      .order("baslangic", { ascending: true }),
  ]);

  const satirlar: Satir[] = [
    ...(oturumlar ?? []).map((o) => ({
      id: o.id,
      tur: "egitim" as const,
      baslangic: o.baslangic,
      sureDk: o.sure_dk,
      kisi: adiyla(o.profiles),
      baslik: o.konu?.trim() || o.courses?.baslik || "Birebir eğitim",
      toplantiLink: o.toplanti_link ?? "",
      durum: o.durum as Satir["durum"],
      href: "/kontrol-9f4x2k/birebir-egitim",
    })),
    ...(gorusmeler ?? [])
      // İptaller listede yok: takvim "ne yapacağım"ı gösteriyor.
      .filter((g) => g.durum !== "iptal")
      .map((g) => ({
        id: g.id,
        tur: "danismanlik" as const,
        baslangic: g.baslangic as string,
        sureDk: g.sure_dk,
        kisi: adiyla(g.profiles),
        baslik: g.konu?.trim() || "Danışmanlık görüşmesi",
        toplantiLink: g.toplanti_link ?? "",
        durum: (g.durum === "tamamlandi" ? "tamamlandi" : "planlandi") as Satir["durum"],
        href: "/kontrol-9f4x2k/gorusmeler",
      })),
  ]
    .filter((s) => s.durum !== "iptal")
    // İki liste ayrı ayrı sıralı geliyor; birleşince sıra bozuluyor.
    .sort((a, b) => new Date(a.baslangic).getTime() - new Date(b.baslangic).getTime());

  const { yaklasan, gecmis } = seansAyir(satirlar);

  return (
    <main className="flex flex-col gap-5 p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-[#656B7A] uppercase">Takvim</div>
          <h1 className="mt-[9px] font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Planlanmış her şey
          </h1>
          <p className="mt-2 max-w-[560px] text-[13.5px] leading-[1.6] text-[#656B7A]">
            Birebir eğitim oturumları ve danışmanlık görüşmeleri tek listede. Bu ekran yalnızca gösterir; planlama
            kendi ekranlarında yapılır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/kontrol-9f4x2k/birebir-egitim"
            className="inline-flex h-[38px] items-center gap-2 rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <Icon name="book" size={15} />
            Oturum planla
          </Link>
          <Link
            href="/kontrol-9f4x2k/gorusmeler"
            className="inline-flex h-[38px] items-center gap-2 rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <Icon name="clock" size={15} />
            Görüşme planla
          </Link>
        </div>
      </div>

      <Bolum baslik="Yaklaşan" satirlar={yaklasan} bosMetin="Yaklaşan bir oturum ya da görüşme yok." />
      <Bolum baslik="Geçmiş" satirlar={[...gecmis].reverse()} bosMetin="Henüz geçmiş kayıt yok." />
    </main>
  );
}

function Bolum({ baslik, satirlar, bosMetin }: { baslik: string; satirlar: Satir[]; bosMetin: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-[22px] py-[15px]">
        <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">{baslik}</h2>
        <span className="font-mono text-[11px] text-[#656B7A]">{satirlar.length}</span>
      </div>

      {satirlar.length === 0 ? (
        <p className="px-[22px] py-6 text-[13.5px] text-[#656B7A]">{bosMetin}</p>
      ) : (
        satirlar.map((s) => {
          const link = guvenliUrl(s.toplantiLink);
          return (
            <div
              key={`${s.tur}-${s.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/7 px-[22px] py-[13px] last:border-b-0"
            >
              {/* Tür rozeti: aynı listedeki iki farklı işi ayıran tek şey bu. */}
              <span
                className="flex h-[26px] flex-none items-center gap-[6px] rounded-[8px] px-[9px] font-mono text-[10px] tracking-[0.1em] uppercase"
                style={
                  s.tur === "egitim"
                    ? { background: "rgba(28,86,243,0.1)", color: "#1C56F3" }
                    : { background: "rgba(10,13,24,0.06)", color: "#3A3F4F" }
                }
              >
                <Icon name={s.tur === "egitim" ? "book" : "clock"} size={12} />
                {s.tur === "egitim" ? "Eğitim" : "Danışmanlık"}
              </span>

              <span className="flex-none font-mono text-[12.5px] text-ink">{saatBicimi.format(new Date(s.baslangic))}</span>
              <span className="flex-none font-mono text-[11px] text-[#656B7A]">{s.sureDk} dk</span>

              <span className="min-w-0 grow basis-[220px]">
                <span className="block truncate text-[14px] font-semibold text-ink">{s.kisi}</span>
                <span className="block truncate text-[12.5px] text-[#656B7A]">{s.baslik}</span>
              </span>

              {s.durum === "tamamlandi" && (
                <span className="flex-none rounded-[7px] bg-[#F2F4FA] px-[9px] py-[5px] font-mono text-[10px] tracking-[0.1em] text-[#656B7A] uppercase">
                  Tamamlandı
                </span>
              )}

              <span className="flex flex-none items-center gap-2">
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-[30px] items-center gap-[6px] rounded-[8px] border border-ink/13 px-[10px] text-[12.5px] font-semibold text-ink transition hover:border-brand hover:text-brand"
                  >
                    <Icon name="external" size={13} />
                    Katıl
                  </a>
                )}
                <Link
                  href={s.href}
                  className="inline-flex h-[30px] items-center rounded-[8px] px-[10px] text-[12.5px] font-semibold text-[#5C6273] transition hover:text-brand"
                >
                  Düzenle →
                </Link>
              </span>
            </div>
          );
        })
      )}
    </section>
  );
}
