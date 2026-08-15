import { Icon } from "@/components/Icon";

/**
 * Adım göstergesi. Ödeme ve danışmanlık sihirbazları paylaşıyor.
 *
 * İkisinde ayrı ayrı yazılsaydı biri diğerinden kaçınılmaz olarak ayrışırdı;
 * kullanıcı için ikisi de "aynı akış" olarak okunmalı.
 */
export function SihirbazAdimlari({ basliklar, adim }: { basliklar: string[]; adim: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {basliklar.map((b, i) => {
        const no = i + 1;
        const gecildi = adim > no;
        const aktif = adim === no;
        return (
          <li key={b} className="flex min-w-0 flex-1 items-center gap-[10px]">
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors"
              style={{
                background: gecildi || aktif ? "#1C56F3" : "#EEF1F8",
                color: gecildi || aktif ? "#FFFFFF" : "#8A90A0",
              }}
            >
              {gecildi ? <Icon name="check" size={13} strokeWidth={3} /> : no}
            </span>
            {/* Başlık dar ekranda gizleniyor: dört adımın adı yan yana
                sığmayınca hepsi tek harfe kırpılıp okunmaz oluyordu. */}
            <span
              className="hidden truncate text-[13.5px] font-medium sm:block"
              style={{ color: aktif ? "#0A0D18" : "#8A90A0" }}
            >
              {b}
            </span>
            {i < basliklar.length - 1 && <span className="h-px flex-1 bg-ink/12" />}
          </li>
        );
      })}
    </ol>
  );
}
