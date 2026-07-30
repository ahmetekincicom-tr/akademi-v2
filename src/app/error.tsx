"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-8 py-24">
      <div className="w-full max-w-[560px]">
        <span className="font-mono text-[11px] tracking-[0.16em] text-brand uppercase">Bir sorun oluştu</span>
        <h1 className="mt-4 font-heading text-[32px] leading-[1.1] font-semibold tracking-[-0.035em] sm:text-[40px]">
          Sayfa yüklenemedi.
        </h1>
        <p className="mt-5 text-[16px] leading-[1.62] text-[#5C6273]">
          Geçici bir aksaklık olabilir. Tekrar denemek çoğu zaman yeterli oluyor; sorun sürerse bize haber ver.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-[#9CA1AE]">Hata kodu: {error.digest}</p>
        )}

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-[52px] items-center rounded-[11px] bg-brand px-7 text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] transition hover:bg-ink"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex h-[52px] items-center rounded-[11px] border border-ink/14 px-6 text-base font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}
