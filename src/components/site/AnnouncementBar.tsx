import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="border-b border-white/8 bg-ink text-white/72">
      <div className="mx-auto flex h-[42px] max-w-[1240px] items-center justify-between gap-6 px-8 text-[13px]">
        <div className="flex items-center gap-[10px]">
          <span className="h-[7px] w-[7px] flex-none animate-pulse-dot rounded-full bg-brand" />
          <span>Öğrenci paneli yayında — ders kayıtları, dokümanlar ve destek tek yerde.</span>
        </div>
        <div className="hidden items-center gap-[22px] font-mono text-[11px] tracking-[0.1em] uppercase sm:flex">
          <span>Ankara &amp; Online</span>
          <Link href="/panel" className="text-white">
            Panele giriş →
          </Link>
        </div>
      </div>
    </div>
  );
}
