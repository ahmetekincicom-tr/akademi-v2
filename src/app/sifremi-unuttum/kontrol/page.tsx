import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Icon } from "@/components/Icon";
import { ALT_BASLIK, BASLIK, BIRINCIL, IKINCIL } from "@/components/auth/stil";

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
    <AuthShell>
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] border border-brand/40 bg-brand/15 text-[#8fb0ff]">
          <Icon name="mail" size={22} />
        </span>
        <h1 className={`mt-6 ${BASLIK}`}>E-postanı kontrol et</h1>
        <p className={`${ALT_BASLIK} mt-3`}>
          {email ? (
            <>
              <span className="font-semibold break-all text-[#fafafa]">{email}</span> adresi bir hesaba bağlıysa
              sıfırlama bağlantısını oraya gönderdik.
            </>
          ) : (
            "Yazdığın adres bir hesaba bağlıysa sıfırlama bağlantısını oraya gönderdik."
          )}{" "}
          Bağlantıya tıkladıktan sonra yeni şifreni belirleyebilirsin.
        </p>
        <div className="mt-6 rounded-[11px] border border-[#27272a] bg-[#111114] px-4 py-4 text-left">
          <h2 className="text-[13px] font-semibold text-[#d4d4d8]">Gelmedi mi?</h2>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-[#a1a1aa]">
            Önce spam klasörüne bak. Mail hiç gelmediyse bu adres kayıtlı olmayabilir; hesabını başka bir adresle
            açmış olabilirsin. Adresi yanlış yazdıysan baştan deneyebilirsin; bağlantı 30 dakika geçerli.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/sifremi-unuttum" className={IKINCIL}>
            Tekrar gönder
          </Link>
          <Link href="/giris" className={BIRINCIL}>
            Girişe dön
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
