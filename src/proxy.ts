import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cerezAlanAdi } from "@/lib/izin";
import { FBC_CEREZI, FBC_OMRU_SN, fbcKur } from "@/lib/meta/fbc";

/**
 * Arama motorlarına açık alan adları. Virgülle ayrılır.
 *
 * Liste boşsa hiçbir alan adı indekslenmiyor — panel alt alan adında yayına
 * girerken doğru varsayılan bu: içerik ana sitedekiyle aynı ve ikiz içerik
 * olarak sayılır. Kademeli geçişte ana alan adı buraya eklenince o alan adı
 * indekslenmeye başlıyor, panel kapalı kalıyor.
 *
 * Vercel'in *.vercel.app adresi de bilerek listede değil.
 */
function indekslenebilirMi(request: NextRequest): boolean {
  const izinli = (process.env.INDEKSLENEBILIR_ALAN_ADLARI ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  if (izinli.length === 0) return false;

  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  return izinli.includes(host);
}

/** İstek native uygulamanın içinden mi geliyor? */
function uygulamadanMi(request: NextRequest): boolean {
  return request.headers.get("user-agent")?.includes("AEAkademiApp") ?? false;
}

/**
 * Yönetim panelinin kökü. Rota klasörünün adıyla aynı olmalı
 * (src/app/kontrol-9f4x2k).
 *
 * Tahmin edilebilir bir adres değil: /admin açıkta durduğu sürece otomatik
 * tarayıcılar günde binlerce kez giriş ekranını dövüyor. Bu, kimlik
 * doğrulamanın yerine geçmiyor — asıl koruma hâlâ (protected)/layout.tsx
 * içindeki oturum ve rol kontrolü — yalnızca gürültüyü ve deneme hacmini
 * kesiyor.
 */
export const YONETIM_KOKU = "/kontrol-9f4x2k";

// Uygulamada açılabilen adresler. Panel, oturum akışı ve yasal metinler;
// yasal metinler App Store için şart, o yüzden listede.
const ACIK_KOKLER = [
  "/panel",
  YONETIM_KOKU,
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-belirle",
  "/auth",
  "/api",
  "/cevrimdisi",
  "/gizlilik-politikasi",
  "/kisisel-verilerin-islenmesi",
  "/uyelik-sozlesmesi",
  "/satis-sozlesmesi",
  "/iptal-iade-politikasi",
];

function uygulamayaAcik(pathname: string): boolean {
  return ACIK_KOKLER.some((k) => pathname === k || pathname.startsWith(k + "/"));
}

/**
 * Tanıtım sitesi (ön yüz) yayında mı?
 *
 * false iken ana sayfa, eğitimler, hakkımızda gibi tanıtım sayfalarının
 * hiçbiri sunulmuyor; hepsi panel girişine yönlendiriliyor. Tasarım ve
 * içerikler bitene kadar yarım bir ön yüzü ne ziyaretçiye ne arama motoruna
 * göstermenin anlamı var.
 *
 * Ön yüz hazır olduğunda: bu değeri true yap, yeterli. Sayfaları tek tek
 * açmak istersen yolunu AYRICA_ACIK listesine ekle — o liste bayrak
 * kapalıyken de geçerli.
 */
export const ON_YUZ_ACIK = false;

/**
 * Ön yüz kapalıyken bile açık kalan yollar.
 *
 * ACIK_KOKLER'den ayrı tutuluyor: o liste "uygulamanın içinde açılabilir"
 * sorusunu, bu liste "tarayıcıda sunulur" sorusunu yanıtlıyor. İkisi bugün
 * büyük ölçüde örtüşüyor ama aynı şey değil ve birini diğeri için
 * değiştirmek sessiz hatalara yol açar.
 */
const AYRICA_ACIK = [
  // Oturum akışı ve panel
  "/panel",
  YONETIM_KOKU,
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-belirle",
  "/auth",
  "/api",
  "/cevrimdisi",
  /*
    Dışarı çıkan yönlendirmeler (WhatsApp).

    Ön yüz kapalıyken de açık kalmak ZORUNDA: bu bağlantıyı WordPress'teki
    ana site kullanıyor ve orası yayında. Kapalı olsaydı ana sitedeki
    WhatsApp butonu panel giriş ekranına düşerdi.
  */
  "/git",
  // Yasal metinler: kayıt ve ödeme ekranları buraya bağlantı veriyor,
  // App Store da erişilebilir olmasını şart koşuyor.
  "/gizlilik-politikasi",
  "/kisisel-verilerin-islenmesi",
  "/uyelik-sozlesmesi",
  "/satis-sozlesmesi",
  "/iptal-iade-politikasi",
  // Makine tarafından okunan dosyalar. Bunlar ara katmandan geçiyor
  // (matcher yalnızca görsel uzantılarını dışarıda bırakıyor); yönlendirilirse
  // arama motoru site haritası yerine giriş sayfasının HTML'ini alır.
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/manifest.webmanifest",
  "/sw.js",
];

/** Ön yüz kapalıyken ziyaretçinin gönderildiği yer. */
const KAPALI_HEDEF = "/giris";

/**
 * Ön yüz kapalıyken tanıtım sayfalarını GÖREBİLEN kullanıcılar.
 *
 * Virgülle ayrılmış kullanıcı kimlikleri (ON_YUZ_ONIZLEME). Boşsa kimse
 * göremiyor — varsayılan bu ve öyle olmalı: eksik tanımlanmış bir ayar
 * yüzünden yarım bir site açılmasın.
 *
 * Neden rol sorgusu değil: rolü öğrenmek profiles tablosuna gitmek demek ve
 * bu kontrol HER istekte, ara katmanda çalışıyor. Kimlik zaten oturumdan
 * geliyor, ek sorgu gerekmiyor.
 *
 * Neden gizli bir adres değil: gizli adres paylaşılınca ya da tarayıcı
 * geçmişinden sızınca geri alınamıyor. Oturuma bağlı izin, çıkış yapmakla
 * biter.
 */
function onizlemeYetkisi(userId: string | undefined): boolean {
  if (!userId) return false;
  return (process.env.ON_YUZ_ONIZLEME ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .includes(userId);
}

function suAndaSunuluyor(pathname: string, onizleme: boolean): boolean {
  if (ON_YUZ_ACIK || onizleme) return true;
  return AYRICA_ACIK.some((k) => pathname === k || pathname.startsWith(k + "/"));
}

// Panel arayan otomatik taramaların denediği bilinen adresler. Cevap olarak
// giriş ekranı değil, ana sayfa dönüyor: burada bir panel olduğu bilgisi bile
// verilmiyor.
const TUZAK_KOKLER = ["/admin", "/administrator", "/wp-admin", "/wp-login.php", "/yonetim"];

/**
 * Reklam tıklamasını çereze yazar.
 *
 * Meta reklamından gelen adreste `fbclid` parametresi bulunuyor. Pixel bunu
 * kendisi de `_fbc` çerezine çeviriyor — ama iki sebeple burada, sunucudan
 * yazılıyor:
 *
 *  1. Pixel yalnızca reklam izni verilmişse yükleniyor ve izin bandı
 *     kapanana kadar geçen sürede tıklama kimliği kaybolabiliyor. Burası
 *     ilk isteğin kendisi.
 *
 *  2. Safari'nin ITP'si JavaScript'in yazdığı çerezlere 7 gün ömür biçiyor;
 *     sunucudan Set-Cookie ile yazılana biçmiyor. Tıklama ile ödeme arasında
 *     haftalar olan bir funnel'da bu fark, ölçülen ile ölçülmeyen arasındaki
 *     fark.
 *
 * VAR OLAN çerezin üzerine yazılmıyor: ilk tıklama, sonrakinden değerli —
 * kişiyi getiren o.
 *
 * Alan adı `.ahmetekinciakademi.com` olarak yazılıyor ki WordPress'teki ana
 * site ile panel aynı değeri görsün.
 */
function tiklamaKimliginiYaz(request: NextRequest, response: NextResponse): void {
  const fbclid = request.nextUrl.searchParams.get("fbclid");
  if (!fbclid || request.cookies.has(FBC_CEREZI)) return;

  const deger = fbcKur(fbclid);
  if (!deger) return;

  const alan = cerezAlanAdi(request.nextUrl.hostname);
  response.cookies.set(FBC_CEREZI, deger, {
    path: "/",
    maxAge: FBC_OMRU_SN,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    // httpOnly DEĞİL: Meta'nın kendi pixel'i de bu çerezi okuyor ve
    // gizlenmiş bir değer tarayıcı tarafındaki olayları eşleşmesiz bırakırdı.
    httpOnly: false,
    ...(alan ? { domain: alan } : {}),
  });
}

export async function proxy(request: NextRequest) {
  // Oturum tazelemesinden önce: bu adreslerde yapılacak başka iş yok.
  const yol = request.nextUrl.pathname;
  if (TUZAK_KOKLER.some((k) => yol === k || yol.startsWith(k + "/"))) {
    return NextResponse.redirect(new URL(ON_YUZ_ACIK ? "/" : KAPALI_HEDEF, request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie on every request so server components
  // always see a valid (non-expired) session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /*
    Ön yüz kapalı: tanıtım sayfaları sunulmuyor, panel girişine gidiliyor.

    Kontrol oturum çözüldükten SONRA: önizleme izni kullanıcı kimliğine bakıyor
    ve o kimlik ancak buradan sonra elde. Bedeli, tanıtım sayfasına gelen bir
    isteğin de oturum tazelemesinden geçmesi — bu sayfalar zaten yönlendirildiği
    için hacim düşük.

    307 kullanılıyor, 301 DEĞİL: bu geçici bir durum ve kalıcı yönlendirme hem
    tarayıcıda hem arama motorunda önbelleğe alınıyor. Ön yüz açıldığında 301
    yemiş ziyaretçiler aylarca giriş ekranına düşmeye devam ederdi.
  */
  const onizleme = onizlemeYetkisi(user?.id);
  if (!suAndaSunuluyor(pathname, onizleme)) {
    return NextResponse.redirect(new URL(KAPALI_HEDEF, request.url), 307);
  }

  /*
    Önizlemede olduğunu tarayıcıya söyleyen çerez.

    Sayfaya "bunu yalnızca sen görüyorsun" şeridini çizdiren şey bu. Neden
    çerez: şeridi sunucuda karar verip çizmek headers() okumak demek ve o,
    bütün tanıtım sayfalarını statiklikten düşürüyor — bu depoda bir kez
    yapıldı ve 13 sayfa dinamik render'a düştü.

    httpOnly değil: okuyan taraf tarayıcıdaki bileşen.
  */
  if (!ON_YUZ_ACIK) {
    if (onizleme) {
      response.cookies.set("aea-onizleme", "1", { path: "/", httpOnly: false, sameSite: "lax" });
    } else if (request.cookies.has("aea-onizleme")) {
      // İzin kalkmışsa (çıkış yapıldı, liste değişti) şerit de kalksın.
      response.cookies.delete("aea-onizleme");
    }
  }

  // Uygulama pazarlama sitesine geçemesin.
  //
  // Uygulama yalnızca panel olarak yayınlanıyor; içinden site gezinmesine
  // açılan tek bir bağlantı bile Apple'ın 3.1.3 (dışarıdaki ödemeye
  // yönlendirme) kapsamına giren sayfalara yol veriyor. Bağlantıları tek tek
  // gizlemek yetmiyor: geri tuşu, yönlendirme, elle yazılan adres ve
  // gözden kaçan bir bağlantı hep açık kapı bırakıyor.
  //
  // O yüzden sınır sunucuda çiziliyor. Uygulama kendini tarayıcı kimliğinde
  // bildiriyor (capacitor.config.ts → appendUserAgent); izinli olmayan her
  // adres panele geri döndürülüyor.
  if (uygulamadanMi(request) && !uygulamayaAcik(pathname)) {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  const isAdminRoute = pathname.startsWith(YONETIM_KOKU) && pathname !== `${YONETIM_KOKU}/giris`;
  const isPanelRoute = pathname.startsWith("/panel");

  if ((isAdminRoute || isPanelRoute) && !user) {
    const loginUrl = new URL(isAdminRoute ? `${YONETIM_KOKU}/giris` : "/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Arama motoruna kapalı alan adlarında noindex.
  //
  // Bunu yalnızca robots.txt ile yapmak yetmiyor: robots.txt taramayı
  // engelliyor, indekslemeyi değil. Başka bir siteden bağlantı verilen adres
  // taranmadan da sonuçlarda çıkabiliyor. Asıl direktif bu başlık — ve
  // görülebilmesi için sayfanın taranabilir kalması gerekiyor.
  /*
    Ön yüz kapalıyken KOŞULSUZ noindex.

    Önizleme izni bir insana veriliyor ama sayfa yine de sunuluyor demek; bir
    arama motoru o adrese başka bir yerden gelen bağlantıyla ulaşırsa yarım
    siteyi indeksleyebilir. Ön yüzü kapatmanın sebebi tam olarak buydu.
  */
  if (!ON_YUZ_ACIK || !indekslenebilirMi(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  tiklamaKimliginiYaz(request, response);

  // Not: burada Vary: User-Agent EKLENMİYOR. Next kendi Vary başlığını
  // sonradan yazıp üzerine geçiyor, dolayısıyla ölü kod olurdu. Gerek de yok:
  // tarayıcı kimliğine göre değişen cevapların hepsi ya bu ara katmandan
  // dönen yönlendirme (hiç önbelleklenmiyor) ya da force-dynamic sayfa.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
