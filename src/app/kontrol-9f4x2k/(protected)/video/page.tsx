import { createClient } from "@/lib/supabase/server";
import { VideoYonetimi, type VideoDers } from "@/components/admin/VideoYonetimi";
import { bunnyDurumu } from "@/lib/bunny";

export default async function AdminVideoPage() {
  const supabase = await createClient();
  // Video kimlikleri ders satırından okunamıyor (yetki yalnızca fonksiyonda,
  // gerekçesi 20261021120000_video_aboneligi.sql'de); ayrı çekilip eşleniyor.
  const [{ data }, { data: videolar }] = await Promise.all([
    supabase
      .from("courses")
      .select("baslik, modules(sira, baslik, lessons(id, sira, baslik, sure, aciklama))")
      .order("created_at"),
    supabase.rpc("yonetici_ders_videolari"),
  ]);
  const videoKimligi = new Map((videolar ?? []).map((v) => [v.lesson_id, v.video_url]));

  type Row = {
    baslik: string;
    modules: {
      sira: number;
      baslik: string;
      lessons: {
        id: string;
        sira: number;
        baslik: string;
        sure: string | null;
        aciklama: string | null;
      }[];
    }[];
  };

  const dersler: VideoDers[] = ((data ?? []) as unknown as Row[]).flatMap((c) =>
    [...c.modules]
      .sort((a, b) => a.sira - b.sira)
      .flatMap((m) =>
        [...m.lessons]
          .sort((a, b) => a.sira - b.sira)
          .map((l) => ({
            id: l.id,
            ad: l.baslik,
            kurs: c.baslik,
            modul: `${m.sira}. ${m.baslik}`,
            sure: l.sure ?? "",
            videoUrl: videoKimligi.get(l.id) ?? "",
            aciklama: l.aciklama ?? "",
          })),
      ),
  );

  return <VideoYonetimi dersler={dersler} bunnyAktif={bunnyDurumu().kutuphane} />;
}
