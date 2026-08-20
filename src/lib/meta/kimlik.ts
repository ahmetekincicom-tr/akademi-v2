import { createHash } from "node:crypto";

/**
 * Meta'ya gönderilen kimlik bilgisinin hazırlanması.
 *
 * Kural tek cümle: HAM kişisel veri Meta'ya gitmez, veritabanına da yazılmaz.
 * E-posta ve telefon SHA-256'lanıyor, hash geri çevrilemiyor ama Meta kendi
 * tarafındaki aynı hash'le eşleştirebiliyor.
 *
 * Hash'in işe yaraması normalleştirmeye bağlı: Meta kendi tarafında aynı
 * normalleştirmeyi uyguluyor ve tek bir boşluk farkı bile hash'i tamamen
 * değiştirdiği için eşleşme sessizce sıfıra düşüyor. "Gönderiyoruz ama hiç
 * eşleşmiyor" hatasının kaynağı hemen her zaman burasıdır.
 *
 * Bu dosya node:crypto kullanıyor; Edge çalışma zamanında içe aktarılamaz.
 */

/**
 * Meta'nın beklediği user_data alanları.
 *
 * Adlar Meta'nın kısaltmaları (em, ph, fn ...) ve öyle kalmalı — API başka
 * bir ad tanımıyor.
 */
export type MetaKimlik = {
  /** Hash'li e-posta. */
  em?: string[];
  /** Hash'li telefon. */
  ph?: string[];
  fn?: string[];
  ln?: string[];
  /** Hash'li iç kullanıcı kimliği; olaylar arası birleştirmeyi güçlendiriyor. */
  external_id?: string[];
  fbp?: string;
  fbc?: string;
  client_ip_address?: string;
  client_user_agent?: string;
};

function hash(deger: string): string {
  return createHash("sha256").update(deger, "utf8").digest("hex");
}

/** Boş ve anlamsız değerleri eler. Boş dizgenin hash'i de geçerli bir hash'tir
 *  ve gönderilirse Meta onu gerçek bir kimlik sanıp eşleşme oranını düşürür. */
function doluMu(deger: string | null | undefined): deger is string {
  return typeof deger === "string" && deger.trim().length > 0;
}

/** E-posta: kırp, küçük harfe indir, hash'le. */
export function epostaHash(deger: string | null | undefined): string | null {
  if (!doluMu(deger)) return null;
  const temiz = deger.trim().toLowerCase();
  if (!temiz.includes("@")) return null;
  return hash(temiz);
}

/**
 * Telefon: yalnızca rakam, ülke koduyla, başında + YOK.
 *
 * Türkiye numaraları veritabanına "+90 5xx ..." ya da "05xx ..." gibi farklı
 * biçimlerde girilmiş olabiliyor. Başındaki 0 atılıp 90 ekleniyor: ülke kodu
 * olmadan gönderilen numara Meta'da hiçbir zaman eşleşmiyor ve bu, sessizce
 * kaybedilen eşleşmenin en yaygın sebebi.
 */
export function telefonHash(deger: string | null | undefined): string | null {
  if (!doluMu(deger)) return null;

  let rakam = deger.replace(/\D/g, "");
  if (!rakam) return null;

  // "0090..." biçimi: uluslararası arama öneki.
  if (rakam.startsWith("00")) rakam = rakam.slice(2);
  // "05xx..." → yerel biçim; varsayılan ülke Türkiye.
  else if (rakam.startsWith("0")) rakam = "90" + rakam.slice(1);
  // "5xx..." → ülke kodu hiç yazılmamış, 10 hane Türkiye cep numarası.
  else if (rakam.length === 10 && rakam.startsWith("5")) rakam = "90" + rakam;

  // Ülke kodu dahil en az 8, en fazla 15 hane (E.164 üst sınırı).
  if (rakam.length < 8 || rakam.length > 15) return null;
  return hash(rakam);
}

/** Ad ve soyad: küçük harf, noktalama yok. Meta böyle normalleştiriyor. */
export function adHash(deger: string | null | undefined): string | null {
  if (!doluMu(deger)) return null;
  const temiz = deger
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]/gu, "");
  return temiz ? hash(temiz) : null;
}

/** Kullanıcı kimliği de hash'leniyor: iç UUID'lerimizi dışarı vermeye gerek yok. */
export function kimlikHash(deger: string | null | undefined): string | null {
  return doluMu(deger) ? hash(deger.trim()) : null;
}

/**
 * user_data nesnesini kurar ve boş alanları atar.
 *
 * Meta eksik alana aldırmıyor ama BOŞ alana aldırıyor: null ya da "" gönderen
 * olaylar "düşük kaliteli" sayılıp eşleşme puanını düşürüyor.
 */
export function kimlikKur(girdi: {
  eposta?: string | null;
  telefon?: string | null;
  ad?: string | null;
  soyad?: string | null;
  userId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  ua?: string | null;
}): MetaKimlik {
  const kimlik: MetaKimlik = {};

  const em = epostaHash(girdi.eposta);
  if (em) kimlik.em = [em];
  const ph = telefonHash(girdi.telefon);
  if (ph) kimlik.ph = [ph];
  const fn = adHash(girdi.ad);
  if (fn) kimlik.fn = [fn];
  const ln = adHash(girdi.soyad);
  if (ln) kimlik.ln = [ln];
  const dis = kimlikHash(girdi.userId);
  if (dis) kimlik.external_id = [dis];

  if (doluMu(girdi.fbp)) kimlik.fbp = girdi.fbp.trim();
  if (doluMu(girdi.fbc)) kimlik.fbc = girdi.fbc.trim();
  if (doluMu(girdi.ip)) kimlik.client_ip_address = girdi.ip.trim();
  if (doluMu(girdi.ua)) kimlik.client_user_agent = girdi.ua.trim();

  return kimlik;
}

/**
 * Kimlik Meta'ya gönderilmeye değer mi?
 *
 * Meta en az bir eşleştirme parametresi istiyor; hiçbiri yoksa olay kabul
 * edilse bile kimseye bağlanamıyor ve kuyrukta yer kaplamaktan başka işe
 * yaramıyor. IP ve tarayıcı kimliği tek başına sayılmıyor: onlar bir kişiyi
 * değil, bir isteği tarif ediyor.
 */
export function kimlikYeterliMi(kimlik: MetaKimlik): boolean {
  return Boolean(kimlik.em || kimlik.ph || kimlik.fbp || kimlik.fbc || kimlik.external_id);
}
