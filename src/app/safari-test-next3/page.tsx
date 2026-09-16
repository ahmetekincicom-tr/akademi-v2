import { PublicHeader } from "@/components/site/PublicHeader";
// Teşhis: SADECE gerçek PublicHeader (PublicFooter YOK). Şerit çıkarsa suçlu header/MobilMenu.
export const revalidate = 3600;
export default async function Page() {
  return (
    <>
      <PublicHeader />
      <main>
        <section style={{ minHeight: "85vh", background: "#fff", color: "#0a0d18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 24, textAlign: "center" }}>
          Sadece gerçek HEADER (footer YOK) — en alta in, gri şerit var mı?
        </section>
        <section style={{ minHeight: "85vh", background: "#0a0d18", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 24, textAlign: "center" }}>
          Koyu alt bölüm — burada gri şerit var mı?
        </section>
      </main>
    </>
  );
}
