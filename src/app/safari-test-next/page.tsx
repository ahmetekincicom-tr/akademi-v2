import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";

/*
  TEŞHİS ROTASI — gerçek Next + root layout + gerçek PublicHeader/PublicFooter.

  Statik HTML testlerinin (test1-9) hepsi temizdi ama gerçek normal sayfalarda
  gri şerit var. Fark, statik HTML'in taklit edemediği gerçek bileşen davranışı
  olmalı (PublicHeader client mantığı vb.). Bu sayfa, karmaşık ana sayfa
  section'ları OLMADAN sadece gerçek header + footer + basit iki bölüm
  render ediyor.

  - Bu sayfada gri şerit ÇIKARSA → suçlu gerçek PublicHeader/PublicFooter
    davranışında (ana sayfa section'ları değil).
  - ÇIKMAZSA → suçlu ana sayfanın kendi section'larında (hero negatif margin,
    Beliriver vb.) — sıradaki adımda onları test ederim.

  Teşhis bitince bu rota silinecek.
*/
export const revalidate = 3600;

export default async function SafariTestNext() {
  return (
    <>
      <PublicHeader />
      <main>
        <section
          style={{
            minHeight: "80vh",
            background: "#ffffff",
            color: "#0a0d18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 20,
            padding: 24,
            textAlign: "center",
          }}
        >
          Gerçek PublicHeader + basit bölüm — aşağı scroll et
        </section>
        <section
          style={{
            minHeight: "80vh",
            background: "#ffffff",
            color: "#0a0d18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 20,
            padding: 24,
            textAlign: "center",
          }}
        >
          En alta in: footer&apos;ın altında / Safari çubuğunun arkasında gri bant var mı?
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
