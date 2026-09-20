"use server";

import { revalidatePath } from "next/cache";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { seoOnbellegiTemizle } from "@/lib/google/gsc-site";
import { ga4SiteOnbellegiTemizle } from "@/lib/google/ga4-site";

/** Site geneli SEO (GSC + GA4 site) önbelleğini temizleyip dashboard'u tazeler. */
export async function seoYenile(): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  seoOnbellegiTemizle();
  ga4SiteOnbellegiTemizle();
  revalidatePath("/kontrol-9f4x2k/seo-performans", "layout");
  return {};
}
