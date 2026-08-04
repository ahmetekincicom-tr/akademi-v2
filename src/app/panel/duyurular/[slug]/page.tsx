import Link from "next/link";
import { notFound } from "next/navigation";
import { getDuyuru } from "@/lib/duyuru-sorgu";
import { ONEM_ETIKET, ONEM_STIL } from "@/lib/duyuru";
import { YasalIcerik } from "@/components/site/YasalIcerik";
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

export default async function DuyuruDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const duyuru = await getDuyuru(slug);

  // Taslakları RLS zaten öğrenciden gizliyor; burada da 404'e düşüyor.
  if (!duyuru || duyuru.durum !== "yayinda") notFound();

  const st = ONEM_STIL[duyuru.onem];

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <Link
        href="/panel/duyurular"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C6273] hover:text-brand"
      >
        <Icon name="arrowLeft" size={14} />
        Gündem
      </Link>

      <div className="mt-4 max-w-[720px]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
            style={{ background: st.bg, color: st.renk }}
          >
            {ONEM_ETIKET[duyuru.onem]}
          </span>
          <span className="rounded-full bg-mist px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-[#5C6273] uppercase">
            {duyuru.kategori}
          </span>
          {duyuru.yayinTarihi && (
            <span className="font-mono text-[10.5px] text-[#8A90A0]">
              {tarihBicimi.format(new Date(duyuru.yayinTarihi))}
            </span>
          )}
        </div>

        <h1 className="mt-3 font-heading text-[28px] leading-[1.15] font-semibold tracking-[-0.03em] sm:text-[34px]">
          {duyuru.baslik}
        </h1>
        {duyuru.ozet && (
          <p className="mt-3 text-[16px] leading-[1.65] text-[#4A5060]">{duyuru.ozet}</p>
        )}

        {duyuru.icerik.trim() && (
          <div className="mt-7 rounded-2xl border border-ink/10 bg-white p-5 sm:p-7">
            <YasalIcerik icerik={duyuru.icerik} />
          </div>
        )}
      </div>
    </main>
  );
}
