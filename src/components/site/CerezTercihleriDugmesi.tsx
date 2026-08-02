"use client";

import { CEREZ_ACMA_OLAYI } from "@/components/site/CerezBandi";

/**
 * Rızayı geri almak, vermek kadar kolay olmak zorunda. Bant seçim yapıldıktan
 * sonra gizlendiği için footer'daki bu bağlantı onu yeniden açıyor.
 *
 * Yalnızca ölçümleme tanımlıyken basılır (bkz. PublicFooter): bant yoksa bu
 * bağlantı tıklanınca hiçbir şey yapmayan ölü bir buton olurdu.
 */
export function CerezTercihleriDugmesi({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CEREZ_ACMA_OLAYI))}
      className={className}
    >
      Çerez tercihleri
    </button>
  );
}
