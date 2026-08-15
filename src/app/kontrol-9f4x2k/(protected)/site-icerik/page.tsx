import { getSiteIcerik } from "@/lib/site-icerik";
import { SiteIcerikFormu } from "@/components/admin/SiteIcerikFormu";

export const dynamic = "force-dynamic";

export default async function AdminSiteIcerikPage() {
  const icerik = await getSiteIcerik();

  return (
    <main className="p-4 pb-14 sm:p-7">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">
        Duyuru ve eğitmen
      </h1>
      <p className="mt-[7px] max-w-[640px] text-[14.5px] text-[#5C6273]">
        Eğitim detay sayfalarının en üstünde çıkan kayıt duyurusu ve sayfadaki eğitmen kutusu buradan yönetilir.
      </p>

      <SiteIcerikFormu icerik={icerik} />
    </main>
  );
}
