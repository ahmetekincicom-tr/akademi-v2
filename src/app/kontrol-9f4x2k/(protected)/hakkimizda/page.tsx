import { getHakkimizda } from "@/lib/hakkimizda";
import { HakkimizdaFormu } from "@/components/admin/HakkimizdaFormu";

export const dynamic = "force-dynamic";

export default async function AdminHakkimizdaPage() {
  const icerik = await getHakkimizda();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Hakkımızda sayfası
      </h1>
      <p className="mt-[7px] max-w-[680px] text-[14.5px] leading-[1.6] text-[#5C6273]">
        Sayfanın üst bölümü, &ldquo;kimdir&rdquo; metni, fotoğrafı ve akademi bölümü buradan düzenlenir. Buradaki
        &ldquo;kimdir&rdquo; metni eğitim sayfalarındaki kısa eğitmen biyografisinden bağımsızdır; istediğin kadar
        uzun yazabilirsin.
      </p>

      <HakkimizdaFormu icerik={icerik} />
    </main>
  );
}
