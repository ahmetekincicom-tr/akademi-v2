"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { veriHatasi } from "@/lib/auth-hatalari";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { OLAYLAR } from "@/lib/meta/olaylar";
import { basarisizlariSiraya } from "@/lib/meta/gonderim";
import { temasiProfileBagla } from "@/lib/temas-bagla";

/*
  Kapatılabilir olayların listesi burada da kuruluyor.

  Server action'lar herkese açık uç noktalar ve TypeScript'in "MetaOlay" tipi
  çalışma zamanında yok. Tarayıcıdan gönderilen olayların anahtarı elle
  yollansa, sunucu tabloya hiçbir işe yaramayan bir satır yazardı — ve o
  satır ekranda "kapalı" görünüp yanlış bir güven verirdi.
*/
const KAPATILABILIR = new Set<string>(OLAYLAR.filter((o) => o.kaynak === "sunucu").map((o) => o.anahtar));

export async function metaOlayiDegistir(anahtar: string, acik: boolean) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!KAPATILABILIR.has(anahtar)) {
    return { error: "Bu olay tarayıcıdan gönderiliyor; kapatmak için Pixel ID'yi boşalt." };
  }

  const supabase = await createClient();
  /*
    upsert: olay hiç kapatılmamışsa tabloda satırı yok. Tablo "kapalı olanlar
    defteri" olduğu için tekrar açıldığında satırın kaybolması değil, açık
    olduğunun yazması doğru.
  */
  const { error } = await supabase
    .from("meta_akislari")
    .upsert({ anahtar, acik, guncelleme: new Date().toISOString() }, { onConflict: "anahtar" });

  if (error) return { error: veriHatasi(error) };
  revalidatePath("/kontrol-9f4x2k/meta");
  return {};
}

/**
 * Başarısız olayları yeniden sıraya alır.
 *
 * Otomatik yeniden deneme bilerek yok: kesin bir hata (yanlış token gibi)
 * her beş dakikada bir aynı yanıtı üretir ve günlüğü doldururdu. Sorunu
 * düzeltip düğmeye basmak, düzeltmenin işe yarayıp yaramadığını da gösteriyor.
 */
export async function metaKuyrugunuTazele() {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const supabase = await createClient();
  const { sayi } = await basarisizlariSiraya(supabase);
  revalidatePath("/kontrol-9f4x2k/meta");
  return { sayi };
}

/**
 * Bir temas kodunu kişiye bağlar (öğrenci kartındaki "Geliş kaynağı" alanı).
 * Kural ve gerekçesi lib/temas-bagla içinde; otomatik eşleşme de aynı yolu
 * kullanıyor.
 */
export async function temasiKisiyeBagla(kod: string, userId: string) {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };

  const servis = gorevIstemcisi();
  if (!servis) return { error: "Sunucu yapılandırması eksik." };

  const sonuc = await temasiProfileBagla(servis, kod, userId);
  if (sonuc.error) return sonuc;

  revalidatePath("/kontrol-9f4x2k/ogrenciler");
  revalidatePath("/kontrol-9f4x2k/meta");
  return {};
}
