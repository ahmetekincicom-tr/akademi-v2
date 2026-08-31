"use server";

import { oturumKaydiniYaz } from "@/lib/oturum-kayit";
import { hosgeldinGonder } from "@/lib/hosgeldin";

/**
 * Giriş formundan sonra çağrılıyor: hareketi kaydeder, sonra hoş geldin
 * mailini tetikler.
 *
 * Kaydın kendisi lib/oturum-kayit.ts içinde, çünkü doğrulama bağlantısıyla
 * gelen kişi bu formdan geçmiyor ve o yol da aynı kaydı yazmak zorunda.
 * Buradaki tek fark, mailin de gönderilmesi.
 */
export async function oturumKaydet() {
  await oturumKaydiniYaz();

  // Girişten sonra, kişiye bir kez. Kendi içinde damgaya bakıyor; buraya
  // koşul koymak aynı kontrolü iki yerde tutmak olurdu.
  await hosgeldinGonder();
}
