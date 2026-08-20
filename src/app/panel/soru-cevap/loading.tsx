import { SayfaBasligiIskeleti, ListeKartiIskeleti } from "@/components/panel/Iskelet";

/* Soru-cevap: solda talep listesi, sağda yazışma. Dar ekranda alt alta. */
export default function Loading() {
  return (
    <main role="status" aria-label="Sayfa yükleniyor" className="p-4 pb-14 sm:p-[34px]">
      <SayfaBasligiIskeleti />
      <div className="mt-[26px] flex flex-col gap-5">
        <ListeKartiIskeleti satir={3} />
        <ListeKartiIskeleti satir={2} simge={false} />
      </div>
    </main>
  );
}
