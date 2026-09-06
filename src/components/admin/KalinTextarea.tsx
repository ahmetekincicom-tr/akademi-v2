"use client";

import { useRef } from "react";
import { Icon } from "@/components/Icon";

/**
 * Kalınlaştırma düğmeli metin alanı.
 *
 * Seçili metni `**...**` ile sarıyor; sitede bu çift yıldız arası kalın basılıyor
 * (lib/kalin.tsx). Tam bir zengin editör yerine bu: metin veritabanında düz ve
 * taşınabilir kalıyor, panelde de tek tık kalın.
 */
export function KalinTextarea({
  value,
  onDegis,
  className,
  placeholder,
}: {
  value: string;
  onDegis: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const kalinYap = () => {
    const el = ref.current;
    if (!el) return;
    const bas = el.selectionStart;
    const son = el.selectionEnd;
    if (bas === son) return; // seçim yoksa yapacak bir şey yok

    const secili = value.slice(bas, son);
    // Zaten sarılıysa kaldır (aç/kapa gibi davransın).
    const zatenKalin = secili.startsWith("**") && secili.endsWith("**") && secili.length > 4;
    const yerine = zatenKalin ? secili.slice(2, -2) : `**${secili}**`;
    const yeni = value.slice(0, bas) + yerine + value.slice(son);
    onDegis(yeni);

    // İmleç/seçim, işlem sonrası da metnin üzerinde kalsın.
    const fark = zatenKalin ? -2 : 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(bas + fark, son + fark);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={kalinYap}
          title="Seçtiğin metni kalın yap"
          className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-ink/13 bg-white px-2.5 text-[13px] font-bold text-ink transition hover:border-brand hover:text-brand"
        >
          <Icon name="book" size={13} />B
        </button>
        <span className="text-[11.5px] text-[#656B7A]">Metni seç, Kalın’a bas. (Kalınlık için **çift yıldız** da yazabilirsin.)</span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onDegis(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}
