# Google ile giriş / kayıt

Google Identity Services (GIS) + Supabase `signInWithIdToken`.

## Neden bu yöntem

Supabase'in yönlendirmeli OAuth akışında (`signInWithOAuth`) Google'ın onay
ekranı dönüş adresi olarak `…supabase.co` gösteriyor. GIS'te Google düğmesi
bizim sayfamızda çiziliyor, onay açılır pencerede ve Google yalnızca
uygulama adını ve **bizim alan adımızı** gösteriyor. Supabase'in ücretli özel
alan adı eklentisi gerekmiyor.

## Akış

1. `/giris` ya da `/kayit` → "Google ile devam et" düğmesi
   (`src/components/auth/GoogleIleDevam.tsx`): görünen kısım bizim tasarımımız,
   tıklamayı üstündeki görünmez Google düğmesi (GIS iframe'i) alıyor.
2. Google açılır pencere → ID token → `supabase.auth.signInWithIdToken`
   (nonce: Google'a SHA-256 özeti, Supabase'e ham değer).
3. `oturumKaydet()` (giriş kaydı + hoş geldin maili) → hedef sayfa.
4. Aynı e-postayla hesap varsa Supabase Google kimliğini o hesaba bağlar.
5. Yeni hesapta sözleşme/KVKK onayı yok → panel bir kez `/kayit/tamamla`'ya
   yönlendirir (ad, soyad, telefon, onaylar; `rizaKaydet` ile kayıt).

Düğme `NEXT_PUBLIC_GOOGLE_CLIENT_ID` doluyken çiziliyor
(`src/lib/bolumler.ts`). iOS uygulamasında gösterilmiyor (Google gömülü
tarayıcıda oturum açmayı engelliyor). Google betiği engellenirse (reklam
engelleyici) düğme ve "veya" ayırıcı sessizce gizleniyor; e-postayla giriş
etkilenmiyor.

## Kurulum

### Google Cloud Console → OAuth client (Web application)
- **Authorized JavaScript origins** (zorunlu — düğme yalnız buralarda çalışır):
  - `https://ahmetekinciakademi.com`
  - `https://panel.ahmetekinciakademi.com`
- Authorized redirect URIs: GIS için gerekmiyor (Supabase callback'i kalsa da
  zararı yok).
- OAuth consent screen: uygulama adı "Ahmet Ekinci Akademi", authorized
  domain `ahmetekinciakademi.com`, gizlilik/koşullar bağlantıları, kapsamlar
  `openid email profile`, **Published**.

### Supabase → Authentication → Sign In / Providers → Google
- Enabled.
- **Client IDs**: Web client ID (virgülle birden fazla eklenebilir).
- Client Secret: yönlendirmeli akış için; GIS'te kullanılmıyor, dolu kalabilir.
- **Skip nonce checks: KAPALI** (nonce doğrulanıyor).

### Vercel → Environment Variables
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Web client ID (`…apps.googleusercontent.com`)
  — Production (ve istersen Preview). Gizli değil; sayfada görünür.
- Değişkenden sonra **Redeploy** (NEXT_PUBLIC değerleri derleme anında gömülür).

## Test
1. Yeni Gmail ile Google'dan kayıt → açılır pencerede "Ahmet Ekinci Akademi"
   ve `ahmetekinciakademi.com` görünmeli (supabase.co yok) →
   `/kayit/tamamla` → onayla → panel. Yönetim → öğrenci → "Verilen onaylar".
2. E-postayla kayıtlı bir hesabın Gmail'iyle Google → doğrudan panel.
3. Açılır pencereyi kapat → sayfada kal, hata yok.
4. `panel.ahmetekinciakademi.com/giris` üzerinde de dene (ikinci origin).
