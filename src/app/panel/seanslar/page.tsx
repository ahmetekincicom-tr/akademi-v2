import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { durumStil } from "@/lib/admin/shared";
import { seansDurumEtiket, saatBicimi } from "@/lib/admin/format";
import { seansAyir } from "@/lib/seans";
import { guvenliUrl } from "@/lib/guvenli-url";
import { Icon } from "@/components/Icon";
import { SadeceWeb, SadeceUygulama } from "@/components/panel/SadeceWeb";

export default async function SeanslarPage() {
  const supabase = await createClient();
  // RLS limits this to the signed-in student's own sessions.
  const { data } = await supabase
    .from("seanslar")
    .select("id, baslangic, sure_dk, konu, toplanti_link, durum, courses(baslik)")
    .order("baslangic", { ascending: true });

  const seanslar = (data ?? []).map((s) => ({
    id: s.id,
    baslangic: s.baslangic,
    sureDk: s.sure_dk,
    konu: s.konu ?? "",
    toplantiLink: s.toplanti_link ?? "",
    durum: s.durum as "planlandi" | "tamamlandi" | "iptal",
    program: (s.courses as unknown as { baslik: string } | null)?.baslik ?? "Genel",
  }));

  const { yaklasan, gecmis } = seansAyir(seanslar);

  const kart = (s: (typeof seanslar)[number]) => {
    const etiket = seansDurumEtiket[s.durum];
    const st = durumStil(etiket);
    const toplanti = guvenliUrl(s.toplantiLink);
    return (
      <div
        key={s.id}
        className="flex flex-col gap-3 border-b border-ink/7 px-5 py-4 last:border-b-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-[16px]"
      >
        {/* Mobilde satır tek sütuna iner: seans adı daha önce 60 piksele
            sıkışıp "Birebi…" diye kırpılıyordu. */}
        <div className="order-2 sm:order-none sm:w-[150px] sm:flex-none">
          <div className="font-mono text-[12px] font-medium text-ink">{saatBicimi.format(new Date(s.baslangic))}</div>
          <div className="mt-[2px] font-mono text-[10px] text-[#656B7A]">{s.sureDk} dk</div>
        </div>
        <div className="order-1 min-w-0 sm:order-none sm:flex-1">
          <div className="text-[15px] leading-[1.3] font-semibold text-ink">{s.konu || "Birebir seans"}</div>
          <div className="mt-1 font-mono text-[10.5px] text-[#656B7A]">{s.program}</div>
        </div>
        <span
          className="order-3 w-fit flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase sm:order-none"
          style={{ background: st.bg, color: st.renk }}
        >
          {etiket}
        </span>
        {toplanti && s.durum === "planlandi" && (
          <a
            href={toplanti}
            target="_blank"
            rel="noreferrer"
            className="order-4 inline-flex h-9 w-fit flex-none items-center gap-[6px] rounded-[9px] bg-brand px-[15px] text-[13.5px] font-semibold text-white transition hover:bg-ink sm:order-none"
          >
            <Icon name="external" size={14} />
            Toplantıya katıl
          </a>
        )}
      </div>
    );
  };

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Birebir seanslar
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitmenle yaptığın birebir görüşmelerin takvimi ve geçmişi.
      </p>

      {seanslar.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="clock" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Planlanmış bir seansın görünmüyor. Randevu oluşturmak için eğitmenle iletişime geçebilirsin.
          </p>
          {/* Uygulamada site iletişim sayfasına çıkmıyor; panel içindeki
              destek kanalına yönlendiriliyor. */}
          <SadeceWeb>
            <Link
              href="/iletisim"
              className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
            >
              İletişime geç
            </Link>
          </SadeceWeb>
          <SadeceUygulama>
            <Link
              href="/panel/soru-cevap"
              className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
            >
              Destek talebi oluştur
            </Link>
          </SadeceUygulama>
        </div>
      ) : (
        <>
          <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div className="border-b border-ink/8 px-6 py-[15px]">
              <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Yaklaşan</h2>
            </div>
            {yaklasan.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-[#656B7A]">Planlanmış seansın yok.</div>
            ) : (
              yaklasan.map(kart)
            )}
          </div>

          {gecmis.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <div className="border-b border-ink/8 px-6 py-[15px]">
                <h2 className="font-heading text-base font-semibold tracking-[-0.02em]">Geçmiş</h2>
              </div>
              {gecmis.map(kart)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
