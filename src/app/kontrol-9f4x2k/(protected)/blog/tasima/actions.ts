"use server";

import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { supabaseNesneUrl } from "@/lib/depo";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { blogSayfalariniTazele } from "@/lib/blog-tazele";
import {
  wpAdresleriniDegistir,
  wpDepoYolu,
  wpGorselleriBul,
  wpIndirmeAdresi,
  wpKapakYolu,
} from "@/lib/wp-gorsel";
import type { Json } from "@/lib/supabase/tipler";

/**
 * WordPress görsellerinin taşınması (açıklama: lib/wp-gorsel.ts).
 *
 * Her adım ayrı bir çağrı ve tekrar çalıştırılabilir: kopyalanmış dosya
 * yeniden indirilmiyor, adresi güncellenmiş yazıda değiştirilecek bir şey
 * kalmıyor. Yarıda kalırsa kaldığı yerden devam edilir.
 *
 * Yetki: oturumdaki yönetici. RLS ve depolama politikaları zaten is_admin()
 * istiyor; yine de her eylem başta ayrıca soruyor, çünkü bu eylemler
 * veritabanına yazmadan ÖNCE dışarıya (WordPress, depo) istek atıyor ve
 * server action herkesin çağırabildiği bir uç.
 */

const YETKISIZ = "Bu işlem için yönetici girişi gerekiyor.";

const KAYNAK = () => process.env.WORDPRESS_KAYNAK?.replace(/\/$/, "") ?? "";
const EN_BUYUK = 15 * 1024 * 1024;

export type TaramaSonucu = {
  kaynak: string | null;
  dosyalar: { wpYol: string; depoYolu: string; yazilar: string[]; tasindi: boolean }[];
  yaziSayisi: number;
  error?: string;
};

type YaziSatiri = { id: string; slug: string; baslik: string; icerik_html: string; icerik_json: Json; kapak_gorsel: string | null };

async function yazilariOku() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, baslik, icerik_html, icerik_json, kapak_gorsel")
    .order("slug");
  return { supabase, yazilar: (data ?? []) as YaziSatiri[], error };
}

function yazidakiGorseller(y: YaziSatiri): string[] {
  return wpGorselleriBul(`${y.icerik_html}\n${JSON.stringify(y.icerik_json ?? {})}\n${y.kapak_gorsel ?? ""}`);
}

/** Depoda bu yolda dosya var mı? Herkese açık kovaya HEAD isteği. */
async function depodaVar(depoYolu: string): Promise<boolean> {
  const adres = supabaseNesneUrl("kapaklar", depoYolu);
  if (!adres) return false;
  try {
    const yanit = await fetch(adres, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(8000) });
    return yanit.ok;
  } catch {
    return false;
  }
}

export async function wpTaramasi(): Promise<TaramaSonucu> {
  if (!(await yoneticiMi())) return { kaynak: null, dosyalar: [], yaziSayisi: 0, error: YETKISIZ };
  const { yazilar, error } = await yazilariOku();
  if (error) return { kaynak: KAYNAK() || null, dosyalar: [], yaziSayisi: 0, error: error.message };

  const harita = new Map<string, Set<string>>();
  for (const y of yazilar) {
    for (const g of yazidakiGorseller(y)) {
      if (!harita.has(g)) harita.set(g, new Set());
      harita.get(g)!.add(y.baslik);
    }
  }

  const dosyalar = await Promise.all(
    [...harita.entries()].map(async ([wpYol, ylr]) => {
      const depoYolu = wpDepoYolu(wpYol);
      return { wpYol, depoYolu, yazilar: [...ylr], tasindi: await depodaVar(depoYolu) };
    }),
  );
  dosyalar.sort((a, b) => a.wpYol.localeCompare(b.wpYol));
  const yaziSayisi = yazilar.filter((y) => yazidakiGorseller(y).length > 0).length;
  return { kaynak: KAYNAK() || null, dosyalar, yaziSayisi };
}

export type KopyaSonucu = { wpYol: string; ok: boolean; hata?: string };

/** Verilen görselleri WordPress'ten indirip depoya yükler (en çok 6 tane). */
export async function wpGorselKopyala(wpYollari: string[]): Promise<{ sonuclar: KopyaSonucu[]; error?: string }> {
  if (!(await yoneticiMi())) return { sonuclar: [], error: YETKISIZ };
  const kaynak = KAYNAK();
  if (!kaynak) return { sonuclar: [], error: "WORDPRESS_KAYNAK tanımlı değil; görseller nereden indirileceğini bilmiyor." };

  const supabase = await createClient();
  const sonuclar = await Promise.all(
    wpYollari.slice(0, 6).map(async (wpYol): Promise<KopyaSonucu> => {
      // Yol istemciden geliyor: yükleme klasörünün dışına çıkamasın.
      if (!wpYol || wpYol.startsWith("/") || wpYol.split("/").some((p) => p === ".." || p === ".")) {
        return { wpYol, ok: false, hata: "Geçersiz yol" };
      }
      const depoYolu = wpDepoYolu(wpYol);
      if (await depodaVar(depoYolu)) return { wpYol, ok: true };
      try {
        const yanit = await fetch(wpIndirmeAdresi(kaynak, wpYol), { cache: "no-store", signal: AbortSignal.timeout(20000) });
        if (!yanit.ok) return { wpYol, ok: false, hata: `WordPress ${yanit.status} döndü` };
        let tur = yanit.headers.get("content-type") ?? "";
        if (!tur.startsWith("image/")) return { wpYol, ok: false, hata: `Görsel değil (${tur || "tür yok"})` };
        let govde: ArrayBuffer | Buffer = await yanit.arrayBuffer();
        if (govde.byteLength > EN_BUYUK) return { wpYol, ok: false, hata: "15 MB'tan büyük" };
        /*
          Depo GIF kabul etmiyor: hareketli WebP'ye çevriliyor, animasyon
          kalıyor (yol da .webp: lib/wp-gorsel → wpDepoYolu).

          Hareketli GIF'te sharp bütün karelerin pikselini topluyor; 2000 px
          genişliğinde 150 karelik bir ekran kaydı varsayılan sınırı (268 MP)
          aşıyordu. Sınır o boyutu kaldıracak kadar açık (dosya zaten 15 MB
          ile sınırlı) ve görsel 1200 px'e küçültülüyor: içerik sütunu 760 px,
          yoğun ekranda da yetiyor; dosya ve çevirme süresi yarıya iniyor.
        */
        if (tur.startsWith("image/gif")) {
          govde = await sharp(Buffer.from(govde), { animated: true, limitInputPixels: 1_000_000_000 })
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          tur = "image/webp";
        }
        const { error } = await supabase.storage
          .from("kapaklar")
          .upload(depoYolu, govde, { contentType: tur, cacheControl: "31536000", upsert: false });
        // Aynı anda iki sekmede çalıştırılırsa ikinci yükleme "zaten var" der: başarı.
        if (error && !/exists|duplicate/i.test(error.message)) return { wpYol, ok: false, hata: error.message };
        return { wpYol, ok: true };
      } catch (e) {
        return { wpYol, ok: false, hata: e instanceof Error ? e.message : "indirilemedi" };
      }
    }),
  );
  return { sonuclar };
}

/**
 * Yazılardaki adresleri depodaki kopyalara çevirir. Kopyası DOĞRULANMAYAN
 * görselin adresine dokunulmuyor. Her değişen yazının eski hâli sürüm
 * geçmişine düşüyor (tetikleyici), yani geri alınabilir.
 */
export async function wpAdresleriniGuncelle(): Promise<{ guncellenen: number; kalan: number; error?: string }> {
  if (!(await yoneticiMi())) return { guncellenen: 0, kalan: 0, error: YETKISIZ };
  const { supabase, yazilar, error } = await yazilariOku();
  if (error) return { guncellenen: 0, kalan: 0, error: error.message };

  const tumu = [...new Set(yazilar.flatMap(yazidakiGorseller))];
  const dogrulanan = new Set<string>();
  await Promise.all(
    tumu.map(async (g) => {
      if (await depodaVar(wpDepoYolu(g))) dogrulanan.add(g);
    }),
  );

  let guncellenen = 0;
  const degisen: string[] = [];
  for (const y of yazilar) {
    const html = wpAdresleriniDegistir(y.icerik_html, dogrulanan);
    const jsonMetin = JSON.stringify(y.icerik_json ?? {});
    const yeniJsonMetin = wpAdresleriniDegistir(jsonMetin, dogrulanan);
    const kapak = wpKapakYolu(y.kapak_gorsel, dogrulanan);
    if (html === y.icerik_html && yeniJsonMetin === jsonMetin && kapak === y.kapak_gorsel) continue;

    // updated_at bilerek değişmiyor: bu teknik bir taşıma, içerik güncellemesi
    // değil; yazının "son güncelleme" tarihi ileri atılmasın.
    const { data, error: hata } = await supabase
      .from("posts")
      .update({ icerik_html: html, icerik_json: JSON.parse(yeniJsonMetin) as Json, kapak_gorsel: kapak })
      .eq("id", y.id)
      .select("id");
    if (hata) return { guncellenen, kalan: tumu.length - dogrulanan.size, error: `${y.slug}: ${hata.message}` };
    if (data && data.length > 0) {
      guncellenen++;
      degisen.push(y.slug);
    }
  }

  if (degisen.length) blogSayfalariniTazele(degisen);
  return { guncellenen, kalan: tumu.length - dogrulanan.size };
}
