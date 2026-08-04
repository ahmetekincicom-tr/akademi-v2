import { AuthShell } from "@/components/auth/AuthShell";
import { GirisFormu } from "@/components/auth/GirisFormu";
import type { Metadata } from "next";
import { sayfaMeta } from "@/lib/seo";

/**
 * The shell stays on the server because it renders <Logo>, which is an async
 * component that reads the uploaded brand mark. Pulled into a client bundle it
 * can never hydrate, and the page freezes — or, behind a null Suspense
 * fallback, goes completely blank.
 */
export const metadata: Metadata = sayfaMeta({
  baslik: "Giriş",
  aciklama: "Katılımcı paneline giriş.",
  yol: "/giris",
  // Oturum sayfalarının arama sonucunda işi yok.
  indeksleme: false,
});

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Set by the proxy when it bounces a signed-out visitor off a /panel page.
  const { next } = await searchParams;
  const hedef = next?.startsWith("/panel") ? next : "/panel";

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <GirisFormu hedef={hedef} />
    </AuthShell>
  );
}
