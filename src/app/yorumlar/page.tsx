import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { CorporateStrip } from "@/components/site/CorporateStrip";
import { YorumListesi } from "@/components/site/YorumListesi";
import { getYorumlar } from "@/lib/icerik";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";
import { otomatikSeo } from "@/lib/sayfa-seo";

// Gerekçe: src/app/page.tsx
export const revalidate = 3600;

// Paylaşım görseli panelden okunduğu için metadata istek anında üretiliyor.
export function generateMetadata(): Promise<Metadata> {
  return sayfaMeta({
  // Metinler tek kaynakta: src/lib/sayfa-seo.ts. Panel de aynı yerden
  // okuyor — iki yere yazılsaydı biri değiştiğinde diğeri sessizce eskir.
  ...otomatikSeo("/yorumlar"),
  yol: "/yorumlar",
});
}

export default async function YorumlarPage() {
  const yorumlar = await getYorumlar();

  return (
    <div className="bg-white">
      <PublicHeader />

      {/* Üst etiket kaldırıldı: başlık zaten "Katılımcı Yorumları", etiket onu
          tekrar ediyordu. Ana sayfadaki yorumlar bölümüyle aynı başlık ve alt
          metin — ikisi uyumlu. */}
      <section className="mx-auto max-w-[1240px] px-5 sm:px-8 pt-16 pb-10">
        <h1 className="max-w-[640px] font-heading text-[36px] leading-[1.08] font-semibold tracking-[-0.035em] sm:text-[46px]">
          Katılımcı Yorumları
        </h1>
        <p className="mt-6 max-w-[560px] text-[16.5px] leading-[1.62] text-[#5C6273]">
          Eğitime katılan katılımcıların, eğitim sonrası yorumları.
        </p>
      </section>

      <YorumListesi yorumlar={yorumlar} />

      <CorporateStrip text="Ekibinize özel, yerinde ya da uzaktan dijital pazarlama eğitimi." />
      <PublicFooter />
    </div>
  );
}
