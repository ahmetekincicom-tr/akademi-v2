import Link from "next/link";
import { getYayindakiDuyurular } from "@/lib/duyuru-sorgu";
import { ONEM_ETIKET, ONEM_STIL } from "@/lib/duyuru";
import { Icon } from "@/components/Icon";
import { TR_ZAMAN } from "@/lib/zaman";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function PanelDuyurularPage() {
  const duyurular = await getYayindakiDuyurular();

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Gündem
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] leading-[1.6] text-[#5C6273]">
        Meta ve sosyal medya tarafındaki gelişmeler. Önemli bir şey olduğunda uygulamadan bildirim
        gönderiyoruz.
      </p>

      {duyurular.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="bell" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Şu an paylaşılmış bir gelişme yok. Yeni bir şey olduğunda burada ve telefonunda görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] flex flex-col gap-3">
          {duyurular.map((d) => {
            const st = ONEM_STIL[d.onem];
            return (
              <Link
                key={d.id}
                href={`/panel/duyurular/${d.slug}`}
                className="group rounded-2xl border border-ink/10 bg-white p-5 transition hover:border-brand/45 hover:shadow-[0_14px_32px_rgba(10,13,24,0.08)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
                    style={{ background: st.bg, color: st.renk }}
                  >
                    {ONEM_ETIKET[d.onem]}
                  </span>
                  <span className="rounded-full bg-mist px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
                    {d.kategori}
                  </span>
                  {d.yeni && (
                    <span className="rounded-full bg-brand px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-white uppercase">
                      Yeni
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[10.5px] text-[#8A90A0]">
                    {d.yayinTarihi ? tarihBicimi.format(new Date(d.yayinTarihi)) : ""}
                  </span>
                </div>

                <div className="mt-2 text-[16.5px] leading-[1.3] font-semibold text-ink group-hover:text-brand">
                  {d.baslik}
                </div>
                {d.ozet && (
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-[#5C6273]">{d.ozet}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
