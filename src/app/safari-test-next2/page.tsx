import { PublicFooter } from "@/components/site/PublicFooter";
// Teşhis: SADECE gerçek PublicFooter (PublicHeader YOK). Şerit çıkarsa suçlu footer.
export const revalidate = 3600;
export default async function Page() {
  return (
    <>
      <main>
        <section style={{ minHeight: "85vh", background: "#fff", color: "#0a0d18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 24, textAlign: "center" }}>
          Sadece gerçek FOOTER (header YOK) — en alta in, gri şerit var mı?
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
