import { redirect } from "next/navigation";
import { getTalepler } from "@/lib/destek";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { TalepGorunumu } from "@/components/destek/TalepGorunumu";
import { GorulduIsareti } from "@/components/panel/GorulduIsareti";

export default async function SoruCevapPage() {
  const [profil, talepler, courses] = await Promise.all([getPanelProfile(), getTalepler("kendi"), getPanelCourses()]);
  if (!profil) redirect("/giris");

  return (
    <>
      {/* Sayfa açıldı: yeni yanıt rozeti düşüyor. */}
      <GorulduIsareti alan="soru_cevap" />
      <TalepGorunumu
        talepler={talepler}
        benimId={profil.id}
        rol="ogrenci"
        kurslar={courses.map((c) => ({ id: c.id, ad: c.baslik }))}
      />
    </>
  );
}
