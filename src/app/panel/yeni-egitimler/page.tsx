import Link from "next/link";

const magazaUrunler = [
  {
    baslik: "Birebir Meta Business Eğitimi",
    meta: "15 saat · 6 modül",
    aciklama: "Reklam hesabı kurulumundan bütçe ölçeklemeye kadar Meta Ads'in tamamı.",
    sahip: true,
  },
  {
    baslik: "Birebir Sosyal Medya Eğitimi",
    meta: "22 saat · 8 modül",
    aciklama: "Bir markanın sosyal medyasını baştan sona yürütme pratiği.",
    sahip: true,
  },
  {
    baslik: "Pazarlamada Yapay Zekâ Eğitimi",
    meta: "7 saat · 4 modül",
    aciklama: "İçerik, görsel, analiz ve otomasyon akışlarında yapay zekâ kullanımı.",
    sahip: false,
  },
  {
    baslik: "İleri Seviye Ölçekleme Atölyesi",
    meta: "6 saat · 3 modül",
    aciklama: "Mevcut kampanyaları bozmadan bütçe büyütme senaryoları.",
    sahip: false,
  },
];

export default function YeniEgitimlerPage() {
  return (
    <main className="p-[34px] pb-14">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Yeni eğitimler
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Mevcut katılımcılar için ek programlar. Kapsam yine ön görüşmede size göre kurulur; panelden doğrudan
        başvurabilirsiniz.
      </p>

      <div className="mt-[26px] grid grid-cols-1 gap-5 md:grid-cols-2">
        {magazaUrunler.map((u) => (
          <div
            key={u.baslik}
            className="flex gap-[18px] rounded-2xl border border-ink/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(10,13,24,0.1)]"
          >
            <div className="placeholder-block aspect-[4/3] w-[120px] flex-none rounded-[11px]" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="font-mono text-[10.5px] tracking-[0.08em] text-[#8A8F9E]">{u.meta}</div>
              <div className="mt-[9px] font-heading text-[19px] leading-[1.22] font-semibold tracking-[-0.02em]">
                {u.baslik}
              </div>
              <p className="mt-2 mb-[18px] text-[14.5px] leading-[1.55] text-[#5C6273]">{u.aciklama}</p>
              {u.sahip ? (
                <div className="mt-auto inline-flex h-10 w-fit items-center gap-2 rounded-[9px] bg-[#F2F4FA] px-[15px] text-sm font-semibold text-[#5C6273]">
                  ✓ Kayıtlısın
                </div>
              ) : (
                <Link
                  href="/odeme"
                  className="mt-auto inline-flex h-[42px] w-fit items-center rounded-[9px] bg-brand px-[18px] text-[14.5px] font-semibold text-white hover:bg-ink"
                >
                  Ön görüşme talep et →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
