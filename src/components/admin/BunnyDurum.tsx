export function BunnyDurum({ kutuphane, imzalama }: { kutuphane: boolean; imzalama: boolean }) {
  const satirlar = [
    {
      ad: "BUNNY_LIBRARY_ID",
      tamam: kutuphane,
      aciklama: "Bunny Stream video kütüphanesinin ID'si. Olmadan video gömülemez.",
    },
    {
      ad: "BUNNY_TOKEN_KEY",
      tamam: imzalama,
      aciklama: "Kütüphanenin Token Authentication anahtarı. Olmadan bağlantılar imzalanmaz ve paylaşılabilir kalır.",
    },
  ];

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">Bunny Stream</h2>
      <p className="mt-1 max-w-[640px] text-[13.5px] leading-[1.6] text-[#656B7A]">
        Video barındırma bilgileri güvenlik nedeniyle veritabanında değil, sunucu ortam değişkenlerinde tutulur.
        Vercel&apos;de Settings → Environment Variables altından tanımlarsın. Ders videolarını Video sayfasından
        bağlıyorsun.
      </p>

      <div className="mt-5 flex flex-col gap-[10px]">
        {satirlar.map((s) => (
          <div key={s.ad} className="flex items-start gap-3 rounded-[11px] border border-ink/11 px-[15px] py-[13px]">
            <span
              className="mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: s.tamam ? "#1C56F3" : "rgba(10,13,24,0.22)" }}
            >
              {s.tamam ? "✓" : "!"}
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[12px] font-semibold text-ink">{s.ad}</div>
              <div className="mt-[3px] text-[12.5px] leading-[1.55] text-[#5C6273]">{s.aciklama}</div>
            </div>
            <span
              className="ml-auto flex-none rounded-full px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] uppercase"
              style={
                s.tamam
                  ? { background: "rgba(28,86,243,0.12)", color: "#1C56F3" }
                  : { background: "rgba(10,13,24,0.07)", color: "#5C6273" }
              }
            >
              {s.tamam ? "Tanımlı" : "Eksik"}
            </span>
          </div>
        ))}
      </div>

      {kutuphane && !imzalama && (
        <div className="mt-4 rounded-[10px] border border-[rgba(201,138,27,0.35)] bg-[rgba(201,138,27,0.08)] px-4 py-3 text-[13px] leading-[1.55] text-[#A5711A]">
          Videolar oynatılır ama bağlantılar imzalanmadığı için kopyalanıp paylaşılabilir. Korumayı açmak için Bunny
          kütüphanesinde Token Authentication&apos;ı etkinleştirip anahtarı bu değişkene ekle.
        </div>
      )}
    </div>
  );
}
