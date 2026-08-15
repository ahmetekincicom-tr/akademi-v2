import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

// Panel arayan otomatik taramaların denediği bilinen adresler. Cevap olarak
// giriş ekranı değil, ana sayfa dönüyor: burada bir panel olduğu bilgisi bile
// verilmiyor.
const TUZAK_KOKLER = ["/admin", "/administrator", "/wp-admin", "/wp-login.php", "/yonetim"];

export async function proxy(request: NextRequest) {
  // Oturum tazelemesinden önce: bu adreslerde yapılacak başka iş yok.
  const yol = request.nextUrl.pathname;
  if (TUZAK_KOKLER.some((k) => yol === k || yol.startsWith(k + "/"))) {
    return NextResponse.redirect(new URL("/", request.url));
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
  if (!indekslenebilirMi(request)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Not: burada Vary: User-Agent EKLENMİYOR. Next kendi Vary başlığını
  // sonradan yazıp üzerine geçiyor, dolayısıyla ölü kod olurdu. Gerek de yok:
  // tarayıcı kimliğine göre değişen cevapların hepsi ya bu ara katmandan
  // dönen yönlendirme (hiç önbelleklenmiyor) ya da force-dynamic sayfa.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
