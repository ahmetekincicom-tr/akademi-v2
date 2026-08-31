"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { veriHatasi } from "@/lib/auth-hatalari";
import { AKISLAR } from "@/lib/eposta-akislari";

/*
  Kapatılabilir akışların listesi burada da kuruluyor.

  Server action'lar herkese açık uç noktalar: TypeScript'in "EpostaAkisi"
  tipi çalışma zamanında yok. Zorunlu bir akışın anahtarı elle gönderilse
  sunucu onu da kapatırdı — oysa o akışların kapatılamaması bilinçli.
*/
const KAPATILABILIR = new Set<string>(
  AKISLAR.filter((a) => !("zorunlu" in a && a.zorunlu)).map((a) => a.anahtar),
);

export async function akisDurumuDegistir(anahtar: string, acik: boolean) {
  if (!KAPATILABILIR.has(anahtar)) return { error: "Bu bildirim kapatılamıyor." };

  const supabase = await createClient();
  /*
    upsert: akış hiç kapatılmamışsa tabloda satırı yok. Tablo "kapalı olanlar
    defteri" olduğu için varsayılan durumu (açık) tutan satırlar da burada
    oluşuyor — tekrar açıldığında kaydın kaybolması değil, açık olduğunun
    yazması doğru.
  */
  const { error } = await supabase
    .from("eposta_akislari")
    .upsert({ anahtar, acik, guncelleme: new Date().toISOString() }, { onConflict: "anahtar" });

  if (error) return { error: veriHatasi(error) };
  revalidatePath("/kontrol-9f4x2k/e-postalar");
  return {};
}

/**
 * Bir akışın metinlerini kaydeder.
 *
 * Boş bırakılan alan NULL yazılıyor, boş string değil: "temizledim" ile
 * "hiç dokunmadım" aynı sonuca çıkmalı — ikisinde de doğru davranış koddaki
 * varsayılana dönmek. Konusuz bir mail göndermek seçenek değil.
 *
 * Akış anahtarı katalogdan doğrulanıyor: server action'lar herkese açık uç
 * noktalar ve elle gönderilen bir anahtar tabloya çöp satır açardı.
 */
export async function akisMetniKaydet(
  anahtar: string,
  metin: { konu: string; ustEtiket: string; baslik: string; ozet: string; eylemEtiketi: string },
) {
  if (!AKISLAR.some((a) => a.anahtar === anahtar)) return { error: "Bilinmeyen bildirim." };

  const bosaNull = (s: string) => (s.trim() ? s.trim() : null);

  const supabase = await createClient();
  const { error } = await supabase.from("eposta_akislari").upsert(
    {
      anahtar,
      konu: bosaNull(metin.konu),
      ust_etiket: bosaNull(metin.ustEtiket),
      baslik: bosaNull(metin.baslik),
      ozet: bosaNull(metin.ozet),
      eylem_etiketi: bosaNull(metin.eylemEtiketi),
      guncelleme: new Date().toISOString(),
    },
    { onConflict: "anahtar" },
  );

  if (error) return { error: veriHatasi(error) };
  revalidatePath("/kontrol-9f4x2k/e-postalar");
  return {};
}
