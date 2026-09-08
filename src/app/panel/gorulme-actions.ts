"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBildirimler, type GorulmeAlani } from "@/lib/bildirimler";

const IZINLI: GorulmeAlani[] = ["birebir", "soru_cevap"];

/**
 * Bir bölümün görüldüğünü işaretler; o bölümün rozetini sıfırlar.
 *
 * İstemciden çağrılıyor (bölüm açıldığında), sayfanın render'ı sırasında
 * değil: render sırasında yazmak Next'in önbelleğiyle çakışıyor ve aynı
 * sayfanın iki kez çizildiği durumlarda iki kez yazıyor.
 *
 * Alan adı istemciden geliyor, bu yüzden listeden geçiyor. Kendi satırından
 * başkasına yazamıyor zaten (RLS), ama uydurma bir alan adı tabloda çöp
 * satır bırakırdı.
 */
export async function alaniGorulduIsaretle(alan: GorulmeAlani) {
  if (!IZINLI.includes(alan)) return { error: "Bilinmeyen bölüm." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı." };

  /*
    DÜŞECEK ROZET YOKSA HİÇBİR ŞEY YAPMA.

    Bu eylem bölüm her açıldığında çalışıyor ve eskiden koşulsuz yazıp
    revalidatePath ile bütün /panel düzenini tazeliyordu. Ziyaretlerin
    neredeyse tamamında rozet zaten sıfır — yani her açılışta boşuna bir
    yazma ve sayfanın kendini yeniden çizmesi oluyordu. O tazeleme
    görünür bir zarar da veriyordu: sayfa daha yeni açılmışken kendini
    yenilediği için içerik bir an oynuyordu ("bakarken kayıtlar kayboldu"
    bildiriminin arkasındaki zincirin halkalarından biri buydu) ve
    tarayıcı konsoluna "useInsertionEffect must not schedule updates"
    hatası düşüyordu.

    Artık yalnızca gerçekten sıfırlanacak bir rozet varken yazıyoruz.
  */
  const { sayac } = await getBildirimler();
  const bekleyen = alan === "birebir" ? sayac.birebir : sayac.soruCevap;
  if (bekleyen === 0) return {};

  // upsert: ilk ziyarette satır yok, sonrakilerde zamanı ilerletiyoruz.
  await supabase
    .from("panel_gorulme")
    .upsert({ user_id: user.id, alan, gorulme: new Date().toISOString() }, { onConflict: "user_id,alan" });

  // Rozet yan menüde, yani her sayfanın düzeninde duruyor.
  revalidatePath("/panel", "layout");
  return {};
}
