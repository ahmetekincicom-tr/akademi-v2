import { SayfaBasligiIskeleti, ListeKartiIskeleti } from "@/components/panel/Iskelet";

/* Hesabım: profil formu, eğitim kayıtları, onaylar, giriş hareketleri. */
export default function Loading() {
  return (
    <main role="status" aria-label="Sayfa yükleniyor" className="p-4 pb-14 sm:p-[34px]">
      <SayfaBasligiIskeleti />
      <div className="mt-[26px] flex flex-col gap-5">
        <ListeKartiIskeleti satir={3} simge={false} />
        <ListeKartiIskeleti satir={2} />
        <ListeKartiIskeleti satir={2} />
      </div>
    </main>
  );
}
