"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { silmeTalebiOlustur, silmeTalebiGeriAl } from "@/app/panel/hesabim/silme-actions";
import { useNativeUygulama } from "@/lib/native";
import { useBildirim } from "@/components/Bildirim";
import { Icon } from "@/components/Icon";

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

/**
 * Hesap silme. Apple App Store 5.1.1(v) hesabın uygulama içinden silinmeye
 * başlatılabilmesini şart koşuyor.
 *
 * Yalnızca native uygulamada gösteriliyor — web tarafı bu turda bilerek
 * değişmiyor. Onay iki adımlı: yanlışlıkla tıklanacak bir düğme değil.
 */
export function HesapSilme({ talepTarihi }: { talepTarihi: string | null }) {
  const native = useNativeUygulama();
  const router = useRouter();
  const bildir = useBildirim();
  const [islemde, startTransition] = useTransition();
  const [onayAcik, setOnayAcik] = useState(false);

  if (!native) return null;

  const talepEt = () => {
    startTransition(async () => {
      const r = await silmeTalebiOlustur();
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Hesap silme talebin alındı.");
        setOnayAcik(false);
        router.refresh();
      }
    });
  };

  const geriAl = () => {
    startTransition(async () => {
      const r = await silmeTalebiGeriAl();
      if (r?.error) bildir.hata(r.error);
      else {
        bildir.basarili("Silme talebin iptal edildi.");
        router.refresh();
      }
    });
  };

  if (talepTarihi) {
    return (
      <div className="mt-6 rounded-2xl border border-danger/35 bg-[#FDF2F2] p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="mt-[2px] flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-danger/15 text-danger-ink">
            <Icon name="clock" size={19} />
          </span>
          <div className="min-w-0 sm:grow sm:basis-[240px]">
            <div className="text-[15.5px] font-semibold text-ink">Hesap silme talebin alındı</div>
            <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">
              {tarihBicimi.format(new Date(talepTarihi))} tarihinde talep ettin. Hesabın ve kişisel verilerin
              30 gün içinde siliniyor. Ödeme ve fatura kayıtları, yasal saklama süresi boyunca tutulmak
              zorunda.
            </div>
          </div>
          <button
            type="button"
            disabled={islemde}
            onClick={geriAl}
            className="h-10 flex-none rounded-[10px] border border-ink/15 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-ink disabled:opacity-50"
          >
            Talebi iptal et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">Hesabını sil</h2>
      <p className="mt-2 max-w-[560px] text-[13.5px] leading-[1.6] text-[#5C6273]">
        Hesabın kapatılır ve kişisel verilerin 30 gün içinde silinir. Eğitim kayıtlarına, ders videolarına ve
        dokümanlara erişimin sona erer. Ödeme ve fatura kayıtları yasal saklama süresi boyunca tutulmak
        zorunda; bu kayıtlar kimliğinden ayrıştırılır.
      </p>

      {onayAcik ? (
        <div className="mt-4 rounded-[12px] border border-danger/30 bg-[#FDF2F2] p-4">
          <div className="text-[14px] font-semibold text-ink">Bu işlem geri alınamaz.</div>
          <div className="mt-1 text-[13px] leading-[1.55] text-[#5C6273]">
            Devam edersen hesabın silinmek üzere işaretlenir. 30 gün içinde fikrin değişirse bu sayfadan
            talebini iptal edebilirsin.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={islemde}
              onClick={talepEt}
              className="h-10 flex-none rounded-[10px] bg-danger px-4 text-[13.5px] font-semibold text-white transition hover:bg-danger-ink disabled:opacity-50"
            >
              Evet, hesabımı sil
            </button>
            <button
              type="button"
              onClick={() => setOnayAcik(false)}
              className="h-10 flex-none rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-ink"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOnayAcik(true)}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] border border-danger/40 bg-white px-4 text-[13.5px] font-semibold text-danger-ink transition hover:border-danger hover:bg-[#FDF2F2]"
        >
          <Icon name="x" size={14} />
          Hesabımı silmek istiyorum
        </button>
      )}
    </div>
  );
}
