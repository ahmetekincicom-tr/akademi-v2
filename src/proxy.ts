import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** İstek native uygulamanın içinden mi geliyor? */
function uygulamadanMi(request: NextRequest): boolean {
  return request.headers.get("user-agent")?.includes("AEAkademiApp") ?? false;
}

// Uygulamada açılabilen adresler. Panel, oturum akışı ve yasal metinler;
// yasal metinler App Store için şart, o yüzden listede.
const ACIK_KOKLER = [
  "/panel",
  "/admin",
  "/giris",
  "/kayit",
  "/sifremi-unuttum",
  "/sifre-belirle",
  "/auth",
  "/api",
  "/cevrimdisi",
  "/gizlilik-politikasi",
  "/kisisel-verilerin-islenmesi",
  "/satis-sozlesmesi",
  "/iptal-iade-politikasi",
];

function uygulamayaAcik(pathname: string): boolean {
  return ACIK_KOKLER.some((k) => pathname === k || pathname.startsWith(k + "/"));
}

export async function proxy(request: NextRequest) {
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

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/giris";
  const isPanelRoute = pathname.startsWith("/panel");

  if ((isAdminRoute || isPanelRoute) && !user) {
    const loginUrl = new URL(isAdminRoute ? "/admin/giris" : "/giris", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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
