import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTalepler, destekYanitSuresi } from "@/lib/destek";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { OgrenciDestek } from "@/components/destek/OgrenciDestek";
import { GorulduIsareti } from "@/components/panel/GorulduIsareti";

export default async function SoruCevapPage() {
  const [profil, talepler, courses, yanitSuresiDk] = await Promise.all([
    getPanelProfile(),
    getTalepler("kendi"),
    getPanelCourses(),
    destekYanitSuresi(),
  ]);
  if (!profil) redirect("/giris");

  return (
    <>
      {/* Sayfa açıldı: yeni yanıt rozeti düşüyor. */}
      <GorulduIsareti alan="soru_cevap" />
      {/* useSearchParams (?talep=) için sınır. */}
      <Suspense>
        <OgrenciDestek
          talepler={talepler}
          benimId={profil.id}
          kurslar={courses.map((c) => ({ id: c.id, ad: c.baslik, yuzde: c.yuzde }))}
          yanitSuresiDk={yanitSuresiDk}
        />
      </Suspense>
    </>
  );
}
