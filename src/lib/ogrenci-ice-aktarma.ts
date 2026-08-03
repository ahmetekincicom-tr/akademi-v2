/**
 * İçe aktarılan satırların temizlenmesi ve doğrulanması.
 *
 * Hem tarayıcı (önizleme) hem sunucu (yazmadan önceki son kontrol) aynı
 * kuralları kullanıyor. Kural iki yerde ayrı yazılırsa önizlemede temiz
 * görünen bir satır kayıt sırasında reddedilir ve sebebi anlaşılmaz.
 */

export type HamSatir = { ad: string; soyad: string; eposta: string; telefon: string };

export type IceAktarmaSonucu = {
  eposta: string;
  durum: "eklendi" | "guncellendi" | "atlandi" | "hata";
  aciklama?: string;
};

/** Başlık eşlemesi: dosyaların başlıkları herkeste farklı yazılıyor. */
const ESLESMELER: Record<keyof HamSatir, string[]> = {
  ad: ["ad", "isim", "adi", "first name", "firstname", "name", "ad soyad", "adsoyad", "ad-soyad"],
  soyad: ["soyad", "soyisim", "soyadi", "last name", "lastname", "surname"],
  eposta: ["eposta", "e-posta", "email", "e-mail", "mail", "e posta", "mail adresi", "eposta adresi"],
  telefon: ["telefon", "tel", "gsm", "cep", "cep telefonu", "phone", "telefon no", "numara"],
};

function sadelestir(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Dosyanın başlıklarını alanlarımıza eşler; bulunamayan alan boş kalır.
 *
 * İki turlu: önce tam eşleşmeler, sonra kalan alanlar için parça eşleşme.
 * Bir başlık yalnızca bir alana verilebiliyor — tek turlu ve serbest bir
 * eşleme "Ad Soyad" başlığını hem ad hem soyad sanıyordu, o da soyad
 * sütununa kişinin tam adını yazıyordu.
 */
export function basliklariEsle(basliklar: string[]): Record<keyof HamSatir, string> {
  const secim = { ad: "", soyad: "", eposta: "", telefon: "" };
  const alanlar = Object.keys(ESLESMELER) as (keyof HamSatir)[];
  const kullanilan = new Set<string>();

  for (const alan of alanlar) {
    const adaylar = ESLESMELER[alan].map(sadelestir);
    const tam = basliklar.find((b) => !kullanilan.has(b) && adaylar.includes(sadelestir(b)));
    if (tam) {
      secim[alan] = tam;
      kullanilan.add(tam);
    }
  }

  for (const alan of alanlar) {
    if (secim[alan]) continue;
    const adaylar = ESLESMELER[alan].map(sadelestir);
    const yakin = basliklar.find(
      (b) => !kullanilan.has(b) && adaylar.some((a) => sadelestir(b).includes(a)),
    );
    if (yakin) {
      secim[alan] = yakin;
      kullanilan.add(yakin);
    }
  }

  return secim;
}

const EPOSTA_KALIBI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function epostaTemizle(ham: string): string {
  return ham.trim().toLocaleLowerCase("en-US");
}

export function epostaGecerliMi(eposta: string): boolean {
  return EPOSTA_KALIBI.test(eposta);
}

/**
 * Telefonu +90XXXXXXXXXX biçimine getirir.
 *
 * Excel telefon sütununu sayı sayıp baştaki sıfırı yutuyor; "5321234567"
 * ve "0532 123 45 67" aynı numara. Tanınmayan bir şey gelirse olduğu gibi
 * bırakılıyor: içe aktarmayı telefon yüzünden durdurmak, elde 400 kaydı
 * olan birinin işine yaramaz.
 */
export function telefonTemizle(ham: string): string {
  const temiz = ham.trim();
  if (!temiz) return "";

  const rakam = temiz.replace(/\D/g, "");

  if (rakam.length === 10 && rakam.startsWith("5")) return `+90${rakam}`;
  if (rakam.length === 11 && rakam.startsWith("05")) return `+90${rakam.slice(1)}`;
  if (rakam.length === 12 && rakam.startsWith("905")) return `+${rakam}`;
  if (rakam.length === 13 && temiz.startsWith("+90")) return `+${rakam.slice(0, 12)}`;

  return temiz;
}

export function adTemizle(ham: string): string {
  return ham.trim().replace(/\s+/g, " ").slice(0, 80);
}

export type DogrulamaSonucu =
  | { gecerli: true; satir: HamSatir }
  | { gecerli: false; sebep: string; satir: HamSatir };

export function satirDogrula(ham: HamSatir): DogrulamaSonucu {
  const eposta = epostaTemizle(ham.eposta);
  const satir: HamSatir = {
    ad: adTemizle(ham.ad),
    soyad: adTemizle(ham.soyad),
    eposta,
    telefon: telefonTemizle(ham.telefon),
  };

  // E-posta zorunlu: giriş kimliği o. Adsız kayıt açılabilir, e-postasız
  // hesap açılamaz.
  if (!eposta) return { gecerli: false, sebep: "E-posta boş", satir };
  if (!epostaGecerliMi(eposta)) return { gecerli: false, sebep: "E-posta geçersiz", satir };

  return { gecerli: true, satir };
}

/**
 * Ad ve soyad tek sütunda geldiyse böler.
 *
 * Son kelime soyad sayılıyor; "Ahmet Can Ekinci" → "Ahmet Can" + "Ekinci".
 * Türkçede çift soyad seyrek, çift ad yaygın.
 */
export function tamAdiBol(tamAd: string): { ad: string; soyad: string } {
  const parcalar = tamAd.trim().split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return { ad: "", soyad: "" };
  if (parcalar.length === 1) return { ad: parcalar[0], soyad: "" };
  return { ad: parcalar.slice(0, -1).join(" "), soyad: parcalar[parcalar.length - 1] };
}
