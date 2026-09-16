import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
/*
  ÇÖZÜM ADAYI: /kayit'ın (tek temiz gerçek sayfa) kazanan yapısını taklit —
  tüm içerik min-h-dvh + arka planlı TEK bir kapsayıcı içinde.
  Temiz çıkarsa aynı kapsayıcıyı root layout'a koyup bütün sayfalarda çözerim.
*/
export const revalidate = 3600;
export default async function Page() {
  return (
    <div className="min-h-dvh bg-white">
      <PublicHeader />
      <main>
        <section style={{ minHeight: "85vh", background: "#fff", color: "#0a0d18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 24, textAlign: "center" }}>
          KAPSAYICILI (min-h-dvh bg) — gerçek header + footer. En alta in.
        </section>
        <section style={{ minHeight: "85vh", background: "#0a0d18", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, padding: 24, textAlign: "center" }}>
          Koyu bölüm — gri şerit var mı?
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
