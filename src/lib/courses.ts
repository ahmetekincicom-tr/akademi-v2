import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { createPublicClient } from "@/lib/supabase/public";
import { kapakUrl } from "@/lib/kapak";
import type { IconName } from "@/components/Icon";

export type CurriculumModule = {
  baslik: string;
  meta: string;
  dersler: { ad: string; sure: string }[];
};

export type FaqItem = { soru: string; cevap: string };
export type Testimonial = { metin: string; isim: string; rol: string };

/** Panelden yazılan, başında ikon olan tek satır. */
export type IkonluSatir = { ad: string; ikon: IconName };

/**
 * Panelde seçilebilen ikonlar.
 *
 * Tüm ikon seti değil, bir alt küme: "x", "logout", "menu" gibi arayüz
 * işaretlerinin bir eğitim maddesinin başında hiçbir anlamı yok ve listede
 * durmaları seçimi zorlaştırıyor. Etiketler Türkçe, çünkü seçen kişi ikonun
 * kod adını değil ne anlattığını arıyor.
 */
export const SECILEBILIR_IKONLAR: { ikon: IconName; etiket: string }[] = [
  { ikon: "user", etiket: "Kişi" },
  { ikon: "users", etiket: "Grup" },
  { ikon: "sparkle", etiket: "Yıldız" },
  { ikon: "check", etiket: "Onay" },
  { ikon: "message", etiket: "Mesaj / destek" },
  { ikon: "whatsapp", etiket: "WhatsApp" },
  { ikon: "phone", etiket: "Telefon" },
  { ikon: "mail", etiket: "E-posta" },
  { ikon: "file", etiket: "Doküman" },
  { ikon: "folder", etiket: "Klasör" },
  { ikon: "book", etiket: "Kitap" },
  { ikon: "grid", etiket: "Panel" },
  { ikon: "plug", etiket: "Kurulum / entegrasyon" },
  { ikon: "sliders", etiket: "Ayar / seviye" },
  { ikon: "clock", etiket: "Süre" },
  { ikon: "calendar", etiket: "Takvim" },
  { ikon: "pin", etiket: "Konum" },
  { ikon: "shield", etiket: "Güvence" },
  { ikon: "card", etiket: "Ödeme" },
  { ikon: "play", etiket: "Video" },
  { ikon: "eye", etiket: "Görüntüleme" },
  { ikon: "bell", etiket: "Bildirim" },
];

const IKON_ADLARI = new Set<string>(SECILEBILIR_IKONLAR.map((i) => i.ikon));

/**
 * content JSON'u serbest: elle düzenlenen ya da eski bir kayıttan gelen bir
 * satırda ikon adı bozuk olabilir. Tanınmayan ad ekranı çökertmesin diye
 * onay işaretine düşüyor.
 */
export function ikonuDuzelt(deger: unknown): IconName {
  return typeof deger === "string" && IKON_ADLARI.has(deger) ? (deger as IconName) : "check";
}

function satirlariDuzelt(deger: unknown): IkonluSatir[] {
  if (!Array.isArray(deger)) return [];
  return deger
    .map((s) => ({ ad: typeof s?.ad === "string" ? s.ad.trim() : "", ikon: ikonuDuzelt(s?.ikon) }))
    .filter((s) => s.ad);
}

/**
 * Eğitim özelinde doldurulmadığında kullanılan liste.
 *
 * Bunlar akademinin çalışma biçimini anlatıyor, tek bir eğitimi değil; yeni
 * açılan bir program bu yüzden boş bir kutuyla değil doğru varsayılanla
 * başlıyor. Panelden değiştirilen an bu liste devreden çıkıyor.
 */
export const VARSAYILAN_KAPSAM: IkonluSatir[] = [
  { ad: "Kişiye Özel Eğitim", ikon: "user" },
  { ad: "Ömür Boyu Destek", ikon: "message" },
  { ad: "Ömür Boyu Güncelleme", ikon: "sparkle" },
  { ad: "Doküman Desteği", ikon: "file" },
  { ad: "Üye Paneline Erişim Hakkı", ikon: "grid" },
  { ad: "WhatsApp Grubuna Katılım Hakkı", ikon: "whatsapp" },
  { ad: "CRM Sistemi Kurulum Desteği", ikon: "plug" },
];

/** Hero'daki dört hap için varsayılan. Gerekçesi VARSAYILAN_KAPSAM ile aynı. */
export const VARSAYILAN_HAPLAR: IkonluSatir[] = [
  { ad: "Birebir & Kişiye Özel", ikon: "user" },
  { ad: "%100 Uygulamalı", ikon: "sparkle" },
  { ad: "Seviyenize Özel İlerleme", ikon: "sliders" },
  { ad: "Ömür Boyu Ücretsiz Destek", ikon: "message" },
];

export type Course = {
  id: string;
  slug: string;
  /** Kapak görselinin tam adresi; yüklenmemişse null. */
  kapak: string | null;
  etiket: string;
  sure: string;
  modul: string;
  dersSayisi: number;
  baslik: string;
  baslikVurgu: string;
  aciklama: string;
  heroAciklama: string;
  maddeler: string[];
  hizli: { etiket: string; deger: string }[];
  /**
   * Hero'nun hemen altındaki serbest tanıtım metni. Panelden düz metin olarak
   * giriliyor; boşsa bölüm hiç basılmıyor (boş bir başlık bırakmıyoruz).
   */
  tanitimMetni: string;
  /** Yan kutudaki program kapsamı; boşsa VARSAYILAN_KAPSAM basılıyor. */
  kapsam: IkonluSatir[];
  /** Hero'daki değer hapları; boşsa VARSAYILAN_HAPLAR basılıyor. */
  haplar: IkonluSatir[];
  /** "6 kişilik kontenjan" gibi tek satır; boşsa satır hiç görünmüyor. */
  kontenjan: string;
  /**
   * Listeleme sırası. Küçük olan önce.
   *
   * created_at'e güvenilemiyor: üç eğitim de aynı toplu ekleme ile
   * oluşturulduğu için damgaları saniyesine kadar aynı ve veritabanı onları
   * her sorguda farklı sırada döndürebiliyor. Vitrin sırası da bir tercih —
   * kayıt zamanının yan etkisi olmamalı.
   */
  sira: number;
  kazanimlar: string[];
  modules: CurriculumModule[];
  uygun: string[];
  uygunDegil: string[];
  format: { etiket: string; deger: string; not: string }[];
  yorumlar: Testimonial[];
  sss: FaqItem[];
  online: boolean;
  yuzYuze: boolean;
};

/**
 * Eğitim başlığını üç parçaya ayırır: vurgudan önce, vurgu, vurgudan sonra.
 *
 * Amaç başlığın bir kısmını marka rengiyle göstermek — ama başlığın KENDİSİNİ
 * bozmadan. Önceden hero'da başlık parça parça kuruluyordu ("Birebir" sabiti +
 * vurgu + tek bir eğitim için elle eklenen "Eğitimi"), dolayısıyla ekranda
 * görünen ad ile eğitimin gerçek adı tutmuyordu; sekme başlığı, kırıntı yolu
 * ve yapısal veri tam adı kullandığı için aynı sayfada iki farklı isim vardı.
 *
 * Vurgu boşsa, tam başlığa eşitse ya da başlıkta geçmiyorsa vurgu yapılmıyor:
 * bu durumların hepsinde doğru davranış, adı olduğu gibi yazmak.
 */
export function basligiParcala(baslik: string, vurgu: string) {
  const tam = baslik.trim();
  const aranan = vurgu.trim();
  if (!aranan || aranan.toLocaleLowerCase("tr") === tam.toLocaleLowerCase("tr")) {
    return { once: tam, vurgu: "", sonra: "" };
  }

  const yer = tam.toLocaleLowerCase("tr").indexOf(aranan.toLocaleLowerCase("tr"));
  if (yer === -1) return { once: tam, vurgu: "", sonra: "" };

  return {
    once: tam.slice(0, yer),
    // Büyük/küçük harf başlıktaki hâliyle korunuyor.
    vurgu: tam.slice(yer, yer + aranan.length),
    sonra: tam.slice(yer + aranan.length),
  };
}

const COURSE_SELECT =
  "id, slug, baslik, baslik_vurgu, aciklama, hero_aciklama, sure, kapak_gorsel, content, modules(sira, baslik, meta, lessons(sira, baslik, sure))";

type CourseRow = {
  id: string;
  slug: string;
  kapak_gorsel: string | null;
  baslik: string;
  baslik_vurgu: string;
  aciklama: string | null;
  hero_aciklama: string | null;
  sure: string | null;
  content: {
    etiket: string;
    modul: string;
    dersSayisi: number;
    maddeler: string[];
    hizli: { etiket: string; deger: string }[];
    tanitimMetni?: string;
    kapsam?: unknown;
    haplar?: unknown;
    kontenjan?: string;
    sira?: number;
    kazanimlar: string[];
    uygun: string[];
    uygunDegil: string[];
    format: { etiket: string; deger: string; not: string }[];
    yorumlar: Testimonial[];
    sss: FaqItem[];
    online: boolean;
    yuzYuze: boolean;
  };
  modules: {
    sira: number;
    baslik: string;
    meta: string | null;
    lessons: { sira: number; baslik: string; sure: string | null }[];
  }[];
};

function mapCourse(row: CourseRow): Course {
  const modules: CurriculumModule[] = [...row.modules]
    .sort((a, b) => a.sira - b.sira)
    .map((m) => ({
      baslik: m.baslik,
      meta: m.meta ?? "",
      dersler: [...m.lessons]
        .sort((a, b) => a.sira - b.sira)
        .map((d) => ({ ad: d.baslik, sure: d.sure ?? "" })),
    }));

  return {
    id: row.id,
    slug: row.slug,
    kapak: kapakUrl(row.kapak_gorsel),
    etiket: row.content.etiket,
    sure: row.sure ?? "",
    modul: row.content.modul,
    dersSayisi: row.content.dersSayisi,
    baslik: row.baslik,
    baslikVurgu: row.baslik_vurgu,
    aciklama: row.aciklama ?? "",
    heroAciklama: row.hero_aciklama ?? "",
    maddeler: row.content.maddeler,
    hizli: row.content.hizli,
    // Alan sonradan eklendi: eski kayıtlarda yok, boş metin doğru varsayılan.
    tanitimMetni: row.content.tanitimMetni ?? "",
    // Boş liste = "doldurulmadı": varsayılana düşüyor. Panelden tek satır
    // bırakmak isteyen zaten bir satır yazıyor, sıfır satır bir tercih değil.
    kapsam: satirlariDuzelt(row.content.kapsam).length
      ? satirlariDuzelt(row.content.kapsam)
      : VARSAYILAN_KAPSAM,
    haplar: satirlariDuzelt(row.content.haplar).length
      ? satirlariDuzelt(row.content.haplar)
      : VARSAYILAN_HAPLAR,
    kontenjan: (row.content.kontenjan ?? "").trim(),
    // Sırası verilmemiş eğitim listenin sonuna: yeni eklenen bir program
    // kendiliğinden vitrinin başına geçmemeli.
    sira: typeof row.content.sira === "number" ? row.content.sira : 999,
    kazanimlar: row.content.kazanimlar,
    modules,
    uygun: row.content.uygun,
    uygunDegil: row.content.uygunDegil,
    format: row.content.format,
    yorumlar: row.content.yorumlar,
    sss: row.content.sss,
    online: row.content.online,
    yuzYuze: row.content.yuzYuze,
  };
}

/**
 * cache(): aynı istekte birden fazla yerden çağrılıyor (footer her sayfada,
 * eğitimler listesi, site haritası). Sarmalanmazsa her çağrı ayrı bir
 * veritabanı gidiş-dönüşü demek ve ilk bayt süresi buna doğrudan yansıyor.
 */
export const getCourses = cache(async function getCourses(client?: SupabaseClient<Database>): Promise<Course[]> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    // Silently returning [] here made an RLS or schema failure look exactly
    // like "no courses exist", which cost a lot of debugging time.
    console.error("[courses] getCourses başarısız:", error.message, error.details ?? "", error.hint ?? "");
    return [];
  }
  if (!data) return [];
  /*
    Sıralama BURADA, sorguda değil: sira content JSON'unun içinde ve
    PostgREST'te JSON alanına göre sıralamak, alanı olmayan kayıtlarda
    sürprizli davranıyor. Liste üç-beş kayıt; bellekte sıralamanın maliyeti
    yok. Eşitlikte başlık: sıra verilmemiş iki program her yüklemede yer
    değiştirmesin.
  */
  return (data as unknown as CourseRow[])
    .map(mapCourse)
    .sort((a, b) => a.sira - b.sira || a.baslik.localeCompare(b.baslik, "tr"));
});

export async function getCourseBySlug(slug: string, client?: SupabaseClient<Database>): Promise<Course | undefined> {
  const supabase = client ?? createPublicClient();
  const { data, error } = await supabase.from("courses").select(COURSE_SELECT).eq("slug", slug).maybeSingle();

  if (error) {
    console.error("[courses] getCourseBySlug başarısız:", slug, error.message, error.details ?? "");
    return undefined;
  }
  if (!data) return undefined;
  return mapCourse(data as unknown as CourseRow);
}
