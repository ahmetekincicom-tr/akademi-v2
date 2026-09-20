"use server";

import { revalidatePath } from "next/cache";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { ga4OnbellegiTemizle } from "@/lib/google/ga4-rapor";

/** GA4 önbelleğini temizleyip blog performans sayfalarını tazeler. */
export async function ga4Yenile(): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  ga4OnbellegiTemizle();
  // "layout" kapsamı: liste + tüm [slug] performans sayfaları.
  revalidatePath("/kontrol-9f4x2k/blog", "layout");
  return {};
}
