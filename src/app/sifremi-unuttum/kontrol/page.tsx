import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Icon } from "@/components/Icon";

/**
 * Adres form tarafından sorgu parametresiyle taşınıyor.
 *
 * Burada gösterilmesinin sebebi kozmetik değil: adresi yanlış yazan kişi
 * mailin neden gelmediğini başka türlü anlayamıyor. Parametre yoksa (sayfa
 * elle açılmışsa) genel metne düşülüyor.
 *
 * Metin bilerek koşullu: "gönderdik" değil, "bağlıysa gönderdik".
 *
 * Supabase kayıtlı olmayan adres için de başarı dönüyor (HTTP 200, boş
 * gövde) — adresin sistemde olup olmadığını sızdırmamak için. Yani bu sayfa
 * mailin gerçekten gidip gitmediğini BİLMİYOR; kesin konuşursa yarısı yalan
 * oluyor ve rastgele adres yazan kişi o adresin kayıtlı olduğunu sanıyor.
 * Koşullu cümle hem doğru hem de kimseye hesap listesi vermiyor.
 */
export default async function EPostaKontrolPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <AuthShell topText="Hesabın yok mu?" topLinkLabel="Hesap oluştur" topLinkHref="/kayit">
      <div>
        <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand/12 text-brand">
          <Icon name="mail" size={22} />
        </span>
        <h1 className="mt-6 font-heading text-[32px] leading-[1.12] font-semibold tracking-[-0.03em]">
          E-postanı kontrol et
        </h1>
        <p className="mt-3 text-[15.5px] leading-[1.65] text-[#5C6273]">
          {email ? (
            <>
              <span className="font-semibold text-ink">{email}</span> adresi bir hesaba bağlıysa sıfırlama
              bağlantısını oraya gönderdik.
            </>
          ) : (
            "Yazdığın adres bir hesaba bağlıysa sıfırlama bağlantısını oraya gönderdik."
          )}{" "}
          Bağlantıya tıkladıktan sonra yeni şifreni belirleyebilirsin.
        </p>
        <div className="mt-[26px] rounded-[13px] border border-ink/11 bg-white px-5 py-[18px]">
          <div className="font-mono text-[10px] tracking-[0.13em] text-[#656B7A] uppercase">Gelmedi mi?</div>
          <p className="mt-[9px] text-sm leading-[1.6] text-[#3A3F4F]">
            Önce spam klasörüne bak. Mail hiç gelmediyse bu adres kayıtlı olmayabilir; hesabını başka bir adresle
            açmış olabilirsin. Adresi yanlış yazdıysan baştan deneyebilirsin; bağlantı 30 dakika geçerli.
          </p>
        </div>
        <Link
          href="/sifremi-unuttum"
          className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[11px] border border-ink/14 bg-white text-[15px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Tekrar gönder
        </Link>
        <Link
          href="/giris"
          className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[11px] bg-brand text-base font-semibold text-white shadow-[0_12px_28px_rgba(28,86,243,0.28)] hover:bg-ink"
        >
          Girişe dön
        </Link>
      </div>
    </AuthShell>
  );
}
