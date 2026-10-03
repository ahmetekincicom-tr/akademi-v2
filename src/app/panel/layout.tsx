import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { getBaslangic } from "@/lib/baslangic";
import { DERSLER_ACIK } from "@/lib/bolumler";
import { getBildirimler } from "@/lib/bildirimler";
import { panelOlcumlemeTazele } from "@/lib/meta/toplama";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, bildirim, courses, baslangic] = await Promise.all([
    getPanelProfile(),
    getBildirimler(),
    getPanelCourses(),
    getBaslangic(),
  ]);
  if (!profil) redirect("/giris");
  // Google ile açılan hesap: sözleşme/KVKK onayı ve telefon bir kez alınıyor.
  if (profil.kayitTamamlanmadi) redirect("/kayit/tamamla");

  /*
    İzin ve tıklama kimliği her panel ziyaretinde tazeleniyor.

    await ediliyor: sunucusuz ortamda cevap döndükten sonra devam eden bir işin
    tamamlanacağı garanti değil. Maliyeti tek bir okuma ve — yalnızca gerçekten
    bir şey değiştiyse — tek bir yazma.

    Burada olmasının sebebi: kişinin izni ödeme gününde okunamıyor. Havaleyi
    yönetici işaretliyor, mutabakatı zamanlayıcı çalıştırıyor; o anda ortada
    çerez yok. İzin bir yerde donmak zorunda ve o yer profil.
  */
  await panelOlcumlemeTazele(profil.id);

  /*
    Yan menünün "Aktif program" kartı. İlerleme: kurulum bitmediyse kurulum
    adımları (2/4), bittiyse ve dersler açıksa ders yüzdesi; ikisi de yoksa
    yalnız programın adı. Veriler genel bakışla aynı (istek başına önbellekli).
  */
  const aktifKurs = courses.find((c) => c.yuzde < 100) ?? courses[0];
  const adimTamam = baslangic.adimlar.filter((a) => a.tamam).length;
  const program = aktifKurs
    ? {
        baslik: aktifKurs.baslik,
        ilerleme:
          baslangic.adimlar.length > 0 && !baslangic.tamamlandi
            ? {
                etiket: `${adimTamam}/${baslangic.adimlar.length}`,
                yuzde: Math.round((adimTamam / baslangic.adimlar.length) * 100),
              }
            : DERSLER_ACIK && aktifKurs.dersSayisi > 0
              ? { etiket: `%${aktifKurs.yuzde}`, yuzde: aktifKurs.yuzde }
              : null,
      }
    : null;

  return (
    <>
      <AcilisEkrani />
      <PanelShell profil={profil} bildirim={bildirim} program={program}>
        {children}
      </PanelShell>
    </>
  );
}
