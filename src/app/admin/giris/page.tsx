import type { Metadata } from "next";
import { girisYap } from "./actions";

export const metadata: Metadata = { title: "Yönetim girişi — Ahmet Ekinci Akademi" };

export default async function AdminGirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; hata?: string }>;
}) {
  const { next = "/admin", hata } = await searchParams;
  const hataMesaji =
    hata === "yetki"
      ? "Bu hesabın yönetim paneline erişim yetkisi yok."
      : hata
        ? "E-posta veya şifre hatalı. Tekrar dener misin?"
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-[11px] text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand font-heading text-[15px] font-bold">
            AE
          </span>
          <span className="flex flex-col leading-[1.15]">
            <span className="font-heading text-[15px] font-semibold">Akademi Yönetim</span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-white/45 uppercase">Admin</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.025em] text-white">Yönetim girişi</h1>
          <p className="mt-2 text-sm text-white/55">Bu alan yalnızca akademi yönetimi içindir.</p>

          {hataMesaji && (
            <div className="mt-5 rounded-[10px] border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-white/85">
              {hataMesaji}
            </div>
          )}

          <form action={girisYap} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.13em] text-white/45 uppercase">E-posta</span>
              <input
                type="email"
                name="email"
                autoFocus
                placeholder="ad@ahmetekinci.com"
                className="h-12 rounded-[11px] border border-white/15 bg-white/5 px-4 text-[15px] text-white outline-none placeholder:text-white/55 focus:border-brand focus:bg-white/8"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] tracking-[0.13em] text-white/45 uppercase">Şifre</span>
              <input
                type="password"
                name="sifre"
                placeholder="••••••••"
                className="h-12 rounded-[11px] border border-white/15 bg-white/5 px-4 text-[15px] text-white outline-none placeholder:text-white/55 focus:border-brand focus:bg-white/8"
              />
            </label>
            <button
              type="submit"
              className="mt-1 h-12 rounded-[11px] bg-brand text-[15px] font-semibold text-white hover:bg-white hover:text-ink"
            >
              Giriş yap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
