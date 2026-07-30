import { createClient } from "@/lib/supabase/server";
import { VideoYonetimi, type VideoDers } from "@/components/admin/VideoYonetimi";
import { bunnyDurumu } from "@/lib/bunny";

export default async function AdminVideoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("baslik, modules(sira, baslik, lessons(id, sira, baslik, sure, video_url, aciklama))")
    .order("created_at");

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
        video_url: string | null;
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
            videoUrl: l.video_url ?? "",
            aciklama: l.aciklama ?? "",
          })),
      ),
  );

  return <VideoYonetimi dersler={dersler} bunnyAktif={bunnyDurumu().kutuphane} />;
}
