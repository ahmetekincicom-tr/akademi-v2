/**
 * Supabase Auth hatalarını Türkçeye çevirir.
 *
 * Supabase hataları İngilizce döndürüyor ve bunlar doğrudan ekrana basılıyordu:
 * "Invalid login credentials", "User already registered", "Password should be
 * at least 6 characters"… Katılımcı için hem yabancı hem de çoğu zaman ne
 * yapacağını söylemeyen metinler.
 *
 * Eşleştirme ÖNCE hata koduna bakıyor (error.code), metne değil. Kod GoTrue'nun
 * sözleşmesi; metin ise sürümden sürüme değişiyor ve tek bir kelime
 * değiştiğinde sessizce İngilizceye düşerdi. Eski sürümlerden ya da ara
 * katmanlardan kod gelmeyebildiği için metin eşleştirmesi ikinci savunma
 * olarak duruyor.
 *
 * Hiçbir durumda İngilizce bir metin dönmüyor: tanınmayan hata da Türkçe bir
 * genel mesaja düşüyor, aslı konsola yazılıyor ki tanılama kaybolmasın.
 */

/** Hatanın hangi ekrandan geldiği; aynı kod farklı ekranda farklı şey anlatıyor. */
export type AuthBaglam = "giris" | "kayit" | "sifre-degistir" | "sifre-sifirla";

type AuthBenzeri = {
  code?: string;
  message?: string;
  status?: number;
  reasons?: string[];
};

const GENEL = "Bir sorun oldu ve işlem tamamlanamadı. Birkaç saniye sonra tekrar dener misin?";

/** Zayıf şifre gerekçeleri; Supabase bunları dizi olarak veriyor. */
function zayifSifreMetni(reasons: string[] | undefined): string {
  const parcalar: string[] = [];
  if (!reasons || reasons.length === 0 || reasons.includes("length")) {
    parcalar.push("en az 8 karakter olmalı");
  }
  if (reasons?.includes("characters")) {
    parcalar.push("harf ve rakam içermeli");
  }
  if (reasons?.includes("pwned")) {
    // Bu ayrı bir şey: uzunluk değil, şifrenin sızıntı listelerinde olması.
    return "Bu şifre daha önce başka sitelerdeki veri sızıntılarında görülmüş. Güvenliğin için başka bir şifre seç.";
  }
  return `Şifren yeterince güçlü değil: ${parcalar.join(", ")}.`;
}

/** Kod bazlı eşleştirme. Bağlam yalnızca metni keskinleştirmek için. */
function koddanMetin(kod: string, baglam: AuthBaglam, hata: AuthBenzeri): string | null {
  switch (kod) {
    case "invalid_credentials":
      return "E-posta veya şifre hatalı. Şifreni hatırlamıyorsan sıfırlama bağlantısı isteyebilirsin.";

    case "email_not_confirmed":
      return "E-posta adresin henüz doğrulanmamış. Kayıt sırasında gönderdiğimiz doğrulama bağlantısına tıklaman gerekiyor; gelen kutunda yoksa spam klasörüne de bak.";

    case "user_already_exists":
    case "email_exists":
      return "Bu e-posta adresiyle bir hesap zaten var. Giriş yapabilir, şifreni hatırlamıyorsan sıfırlayabilirsin.";

    case "phone_exists":
      return "Bu telefon numarası başka bir hesapta kayıtlı.";

    case "weak_password":
      return zayifSifreMetni(hata.reasons);

    case "same_password":
      return "Yeni şifren eskisiyle aynı olamaz. Farklı bir şifre seç.";

    case "user_not_found":
      return baglam === "sifre-sifirla"
        ? "Bu adrese ait bir hesap bulamadık."
        : "Hesap bulunamadı. E-posta adresini kontrol eder misin?";

    case "user_banned":
      return "Bu hesap askıya alınmış. Durumu netleştirmek için bize yazabilirsin.";

    case "signup_disabled":
    case "email_provider_disabled":
    case "provider_disabled":
      return "Yeni kayıtlar şu anda kapalı. Eğitime katılmak istiyorsan bize yazabilirsin.";

    case "email_address_invalid":
    case "validation_failed":
      return "E-posta adresi geçersiz görünüyor. Yazımını kontrol eder misin?";

    case "email_address_not_authorized":
      return "Bu adrese e-posta gönderemiyoruz. Farklı bir adres denemen gerekebilir.";

    case "over_request_rate_limit":
      return "Çok fazla deneme yapıldı. Güvenlik gereği kısa bir süre beklemen gerekiyor; birkaç dakika sonra tekrar dene.";

    case "over_email_send_rate_limit":
      return "Kısa sürede çok fazla e-posta istendi. Birkaç dakika bekleyip tekrar dener misin?";

    case "over_sms_send_rate_limit":
      return "Kısa sürede çok fazla SMS istendi. Birkaç dakika bekleyip tekrar dener misin?";

    // Süresi geçmiş / kullanılmış bağlantı ve oturumlar. Hepsi aynı şeyi
    // anlatıyor: elindeki bağlantı ya da oturum artık geçerli değil.
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return baglam === "sifre-degistir"
        ? "Şifre sıfırlama bağlantısının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı iste."
        : "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı iste.";

    case "session_expired":
    case "session_not_found":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
    case "bad_jwt":
      return "Oturumun sona ermiş. Tekrar giriş yapman gerekiyor.";

    case "reauthentication_needed":
      return "Güvenlik gereği bu işlem için tekrar giriş yapman gerekiyor.";

    case "captcha_failed":
      return "Güvenlik doğrulaması geçilemedi. Sayfayı yenileyip tekrar dener misin?";

    case "request_timeout":
    case "hook_timeout":
    case "hook_timeout_after_retry":
      return "İşlem zaman aşımına uğradı. Tekrar dener misin?";

    case "conflict":
      return "Aynı anda birden fazla işlem yapıldı. Sayfayı yenileyip tekrar dene.";

    default:
      return null;
  }
}

/**
 * Kod gelmediğinde metne bakan yedek eşleştirme.
 *
 * Eski GoTrue sürümleri ve bazı ara katmanlar code alanını doldurmuyor.
 * Karşılaştırma küçük harfe indirgenip parça arayarak yapılıyor; tam eşitlik
 * ararsak noktalama değişimi bile kaçırır.
 */
function metindenMetin(mesaj: string, baglam: AuthBaglam, hata: AuthBenzeri): string | null {
  const m = mesaj.toLowerCase();

  if (m.includes("invalid login credentials")) return koddanMetin("invalid_credentials", baglam, hata);
  if (m.includes("email not confirmed")) return koddanMetin("email_not_confirmed", baglam, hata);
  if (m.includes("already registered") || m.includes("already exists"))
    return koddanMetin("user_already_exists", baglam, hata);
  if (m.includes("password should be") || m.includes("password is too weak"))
    return koddanMetin("weak_password", baglam, hata);
  if (m.includes("different from the old password")) return koddanMetin("same_password", baglam, hata);
  if (m.includes("unable to validate email") || m.includes("invalid format"))
    return koddanMetin("email_address_invalid", baglam, hata);
  if (m.includes("signups not allowed")) return koddanMetin("signup_disabled", baglam, hata);
  if (m.includes("rate limit") || m.includes("you can only request this after"))
    return koddanMetin("over_request_rate_limit", baglam, hata);
  if (m.includes("expired") || m.includes("invalid token")) return koddanMetin("otp_expired", baglam, hata);
  if (m.includes("user not found")) return koddanMetin("user_not_found", baglam, hata);

  // Ağ katmanı: fetch başarısız olduğunda mesaj "Failed to fetch" oluyor ve
  // bunun sunucuyla ilgisi yok. Kullanıcıya bağlantısını söylemek doğrusu.
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed"))
    return "İnternet bağlantında bir sorun var gibi görünüyor. Bağlantını kontrol edip tekrar dene.";

  return null;
}

/**
 * Supabase Auth hatasını kullanıcıya gösterilecek Türkçe metne çevirir.
 *
 * @param hata  supabase.auth.* çağrısından dönen error (ya da yakalanan Error)
 * @param baglam Hangi ekrandan geldiği; metni keskinleştiriyor.
 */
export function authHatasi(hata: unknown, baglam: AuthBaglam = "giris"): string {
  if (!hata) return GENEL;

  const h = hata as AuthBenzeri;
  const kod = typeof h.code === "string" ? h.code : "";
  const mesaj = typeof h.message === "string" ? h.message : "";

  const koddan = kod ? koddanMetin(kod, baglam, h) : null;
  if (koddan) return koddan;

  const metinden = mesaj ? metindenMetin(mesaj, baglam, h) : null;
  if (metinden) return metinden;

  // 429 kod olmadan da gelebiliyor.
  if (h.status === 429) return koddanMetin("over_request_rate_limit", baglam, h)!;

  /*
    Buraya düşmek "tanımadığımız bir hata" demek. Kullanıcı Türkçe genel bir
    mesaj görüyor; aslı konsola yazılıyor ki hangi hatanın eşleşmediğini
    görüp sözlüğe ekleyebilelim.
  */
  console.error("[auth] eşleşmeyen hata:", { kod, mesaj, status: h.status });
  return GENEL;
}

/* ------------------------------------------------------- veri hataları --- */

/**
 * Veritabanı hatalarını Türkçeleştirir.
 *
 * Panel ekranları tablo yazma hatalarını doğrudan gösteriyordu ve bunlar
 * PostgREST'ten İngilizce geliyor ("new row violates row-level security
 * policy for table …" gibi) — katılımcı için hem anlaşılmaz hem korkutucu.
 *
 * Kendi yazdığımız mesajlar (RPC içindeki `raise exception`) olduğu gibi
 * geçiyor: onlar zaten Türkçe ve duruma özel. Ayırt etmek için Türkçeye özgü
 * harflere bakılıyor — bütün RPC mesajlarımızda en az biri var; yanılırsa
 * sonuç yine Türkçe bir genel mesaj oluyor, yani kötü tarafa düşmüyor.
 */
export function veriHatasi(hata: unknown): string {
  if (!hata) return GENEL;

  const h = hata as { code?: string; message?: string };
  const mesaj = typeof h.message === "string" ? h.message : "";

  if (/[çğıİöşüÇĞÖŞÜ]/.test(mesaj)) return mesaj;

  switch (h.code) {
    case "42501":
      return "Bu işlem için yetkin yok.";
    case "23505":
      return "Bu kayıt zaten var.";
    case "23503":
      return "Bağlı bir kayıt olduğu için bu işlem tamamlanamadı.";
    case "23514":
      return "Girilen değer kabul edilmedi. Alanları kontrol eder misin?";
    case "PGRST116":
      return "Kayıt bulunamadı.";
    default:
      break;
  }

  console.error("[veri] eşleşmeyen hata:", { kod: h.code, mesaj });
  return GENEL;
}
