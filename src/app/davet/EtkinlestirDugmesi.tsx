"use client";

import { useFormStatus } from "react-dom";
import { Icon } from "@/components/Icon";
import { BIRINCIL } from "@/components/auth/stil";

export function EtkinlestirDugmesi() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={BIRINCIL}>
      {pending ? "Hazırlanıyor…" : "Hesabımı etkinleştir"}
      {!pending && <Icon name="arrowRight" size={16} />}
    </button>
  );
}
