"use client";

import { baytBoyut, tarihBicimi } from "@/lib/admin/format";
import { Icon } from "@/components/Icon";

export type OgrenciDokuman = {
  id: string;
  baslik: string;
  program: string;
  dosyaYolu: string;
  dosyaTipi: string;
  boyut: number | null;
  tarih: string;
};

export function DokumanListesi({ dokumanlar }: { dokumanlar: OgrenciDokuman[] }) {
  /*
    İndirme adresi ARTIK KENDİ ALAN ADIMIZDA: /indir/<doküman kimliği>.

    Önceden sunucudan 60 saniyelik imzalı bir Supabase adresi alınıp yeni
    sekmede açılıyordu; kullanıcı supabase.co adresini görüyor, kopyaladığı
    bağlantı bir dakika sonra ölüyordu. Yetki kontrolü ve imzalı adres artık
    o uçta, sunucuda kalıyor (app/indir/[id]/route.ts).
  */

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Doküman kütüphanesi
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitimlerinde paylaşılan şablonlar, kontrol listeleri ve kaynaklar.
      </p>

      {dokumanlar.length === 0 ? (
        <div className="mt-[26px] rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
            <Icon name="folder" size={22} />
          </div>
          <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
            Henüz seninle paylaşılmış bir doküman yok. Eğitmenin ders materyali yüklediğinde burada listelenir.
          </p>
        </div>
      ) : (
        <div className="mt-[26px] overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {dokumanlar.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-3 border-b border-ink/7 px-5 py-[16px] last:border-b-0 hover:bg-[#F7F9FF] sm:gap-4 sm:px-6"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-mist font-mono text-[10px] font-semibold text-[#5C6273]">
                {d.dosyaTipi.slice(0, 4) || "DOC"}
              </span>
              <div className="min-w-0 flex-1">
                {/* Doküman adı da sarıyor: kesilince iki dosya ayırt edilemiyor. */}
                <div className="text-[15px] leading-[1.35] font-semibold text-ink">{d.baslik}</div>
                <div className="mt-[5px] font-mono text-[10.5px] leading-[1.5] text-[#656B7A]">
                  {d.program} · {baytBoyut(d.boyut)} · {tarihBicimi.format(new Date(d.tarih))}
                </div>
              </div>
              <a
                href={`/indir/${d.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 flex-none items-center gap-[6px] rounded-[9px] border border-ink/13 bg-white px-3 text-[13px] font-semibold whitespace-nowrap text-ink transition hover:border-brand hover:text-brand sm:px-[15px] sm:text-[13.5px]"
              >
                <Icon name="download" size={14} />
                İndir
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
