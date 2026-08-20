import { SayfaBasligiIskeleti, ListeKartiIskeleti } from "@/components/panel/Iskelet";

/* Öğrenci listesi: arama kutusu ve 25 satırlık sayfa. En çok
   beklenen ekran — altı sorgu birden çalışıyor. */
export default function Loading() {
  return (
    <main role="status" aria-label="Sayfa yükleniyor" className="p-4 pb-14 sm:p-7">
      <SayfaBasligiIskeleti />
      <div className="mt-[22px] flex flex-col gap-5">
        <ListeKartiIskeleti satir={6} simge={false} />
      </div>
    </main>
  );
}
