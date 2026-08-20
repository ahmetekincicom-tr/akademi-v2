import { SayfaBasligiIskeleti, ListeKartiIskeleti } from "@/components/panel/Iskelet";

/* Meta ölçümleme: olay anahtarları, eşleşmemiş tıklamalar ve gönderim günlüğü. */
export default function Loading() {
  return (
    <main role="status" aria-label="Sayfa yükleniyor" className="p-4 pb-14 sm:p-7">
      <SayfaBasligiIskeleti />
      <div className="mt-[22px] flex flex-col gap-5">
        <ListeKartiIskeleti satir={8} simge={false} />
        <ListeKartiIskeleti satir={4} />
      </div>
    </main>
  );
}
