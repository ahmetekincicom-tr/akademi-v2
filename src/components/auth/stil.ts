/**
 * Oturum ekranlarının ortak sınıfları (koyu tema). Tek yerde: dört form ve
 * alt bileşenler aynı alanı, etiketi ve düğmeyi kullanıyor.
 *
 * Odak: kenarlık markaya döner, halka globals.css'teki `.auth-koyu` kuralıyla
 * koyu zemine göre güçlenir.
 */

/** Görünür etiket. */
export const ETIKET = "text-[13px] font-medium text-[#d4d4d8]";

/** Metin alanı. 44px: parmakla rahat hedef, referanstaki kompakt ölçü. */
export const ALAN =
  "h-11 w-full min-w-0 rounded-[9px] border border-[#27272a] bg-[#111114] px-[13px] text-[15px] text-[#fafafa] outline-none transition-colors placeholder:text-[#71717a] hover:border-[#3f3f46] focus:border-brand aria-[invalid=true]:border-[#f87171]";

/** Alan altı yardım metni. */
export const YARDIM = "text-[12.5px] leading-[1.5] text-[#a1a1aa]";

/** Alan altı hata metni (aria-describedby ile bağlanır). */
export const ALAN_HATASI = "text-[12.5px] leading-[1.5] text-[#fca5a5]";

/** Birincil eylem. */
export const BIRINCIL =
  "flex h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-brand text-[14.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(28,86,243,0.9)] transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50";

/** İkincil eylem (koyu çerçeveli). */
export const IKINCIL =
  "flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-[#27272a] bg-[#18181b] text-[14.5px] font-semibold text-[#fafafa] transition-colors hover:border-[#3f3f46] hover:bg-[#1f1f23]";

/** Metin bağlantısı (koyu zeminde okunur mavi-beyaz). */
export const BAGLANTI = "font-semibold text-[#c7d6ff] underline-offset-2 hover:text-white hover:underline";

/** Başlık bloğu. */
export const BASLIK = "font-heading text-[26px] leading-[1.15] font-semibold tracking-[-0.03em] text-[#fafafa]";
export const ALT_BASLIK = "mt-2 text-[14.5px] leading-[1.6] text-[#a1a1aa]";
