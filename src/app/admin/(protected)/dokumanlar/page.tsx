import { dokumanlarData } from "@/lib/admin/data";

export default function AdminDokumanlarPage() {
  return (
    <main className="p-7 pb-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
            Dokümanlar
          </h1>
          <p className="mt-[7px] text-[14.5px] text-[#5C6273]">Şablon, kontrol listesi ve sunumların programa ve derse ataması.</p>
        </div>
        <button type="button" className="h-[42px] rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-white hover:bg-ink">
          + Dosya yükle
        </button>
      </div>

      <div className="mt-[22px] flex items-center gap-4 rounded-[14px] border border-dashed border-ink/20 bg-white p-7">
        <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl bg-[#F2F4FA] text-base text-brand">
          ↑
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Dosyaları buraya sürükle</div>
          <div className="mt-1 text-[13px] text-[#8A8F9E]">PDF, XLSX, DOCX · en fazla 50 MB · yükledikten sonra programa ata</div>
        </div>
        <button
          type="button"
          className="h-10 flex-none rounded-[9px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Bilgisayardan seç
        </button>
      </div>

      <div className="mt-[18px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <div className="grid grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_0.9fr_100px] gap-[14px] border-b border-ink/8 bg-mist px-[22px] py-[13px] font-mono text-[9.5px] tracking-[0.12em] text-[#8A8F9E] uppercase">
          <span>Dosya</span>
          <span>Program</span>
          <span>Ders</span>
          <span>Tip</span>
          <span>İndirme</span>
          <span />
        </div>
        {dokumanlarData.map((d) => (
          <div
            key={d.ad}
            className="grid grid-cols-[2.2fr_1.6fr_1.2fr_0.9fr_0.9fr_100px] items-center gap-[14px] border-b border-ink/7 px-[22px] py-[13px] transition last:border-b-0 hover:bg-[#F7F9FF]"
          >
            <div className="flex min-w-0 items-center gap-[11px]">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] bg-[#F2F4FA] font-mono text-[9px] font-medium text-brand">
                {d.tip}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{d.ad}</span>
                <span className="mt-[2px] block font-mono text-[10px] text-[#8A8F9E]">{d.boyut}</span>
              </span>
            </div>
            <span className="min-w-0 text-[13.5px] text-[#3A3F4F]">{d.program}</span>
            <span className="min-w-0 text-[13px] text-[#5C6273]">{d.ders}</span>
            <span className="font-mono text-[11px] text-[#5C6273]">{d.tip}</span>
            <span className="font-mono text-[11px] text-[#5C6273]">{d.indirme}</span>
            <div className="flex gap-[7px]">
              <button
                type="button"
                className="h-8 flex-1 rounded-[8px] border border-ink/13 bg-white text-[12.5px] font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Ata
              </button>
              <button
                type="button"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] border border-ink/13 bg-white text-xs text-[#9CA1AE] hover:border-danger/45 hover:text-danger"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
