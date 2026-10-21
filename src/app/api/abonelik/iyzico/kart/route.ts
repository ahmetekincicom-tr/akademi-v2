import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { reddedilenOdemeyiYinele } from "@/lib/abonelik";
import { kokAdres } from "@/lib/kok-adres";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kart güncelleme formunun dönüşü.
 *
 * Aboneliğin kimliği adreste (?a=…) geliyor; form oturum çerezi taşımıyor.
 * Adres elle çağrılsa bile yaptığı tek şey o aboneliği iyzico'ya sorup
 * reddedilmiş bir çekim varsa yeniden denemek — kimsenin adına para çekmiyor,
 * kayıt da iyzico'nun söylediğinden başka bir şey olmuyor.
 */
export async function POST(istek: Request) {
  const kok = kokAdres(istek);
  const abonelikId = new URL(istek.url).searchParams.get("a") ?? "";
  const servis = gorevIstemcisi();

  let sonuc = "kart";
  // uuid biçiminde değilse sorguya hiç gitmiyor.
  if (servis && /^[0-9a-f-]{36}$/i.test(abonelikId)) {
    const yinelendi = await reddedilenOdemeyiYinele(servis, abonelikId);
    if (yinelendi) sonuc = "kart-odendi";
  }

  revalidatePath("/panel", "layout");
  return NextResponse.redirect(new URL(`/panel/abonelik?sonuc=${sonuc}`, kok), 303);
}

export async function GET(istek: Request) {
  return POST(istek);
}
