import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOnDegerlendirmeFormu, formUrlKimlikle } from "@/lib/form-ayarlari";
import { OnDegerlendirmeFormu } from "@/components/panel/OnDegerlendirmeFormu";
import { Icon } from "@/components/Icon";

export default async function OnDegerlendirmePage() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    formUrl,
  ] = await Promise.all([supabase.auth.getUser(), getOnDegerlendirmeFormu()]);

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, email, on_degerlendirme_tarihi")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const isim = [profil?.ad, profil?.soyad].filter(Boolean).join(" ") || null;
  const tamamMi = Boolean(profil?.on_degerlendirme_tarihi);

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <h1 className="font-heading text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[32px]">
        Ön değerlendirme
      </h1>
      <p className="mt-2 max-w-[620px] text-[15px] text-[#5C6273]">
        Eğitimi sana göre kurabilmemiz için kısa bir soru seti. Cevapların yalnızca eğitmene açıktır.
      </p>

      <div className="mt-[26px]">
        {formUrl ? (
          <OnDegerlendirmeFormu
            src={formUrlKimlikle(formUrl, {
              email: profil?.email ?? user?.email ?? null,
              isim,
              id: user?.id ?? "",
            })}
            tamamMi={tamamMi}
          />
        ) : (
          // Form adresi panelde tanımlı değilse boş bir iframe basmak yerine
          // durumu açıkça söylüyoruz.
          <div className="rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[13px] bg-mist text-[#656B7A]">
              <Icon name="file" size={22} />
            </div>
            <p className="mx-auto mt-4 max-w-[440px] text-[14.5px] leading-[1.6] text-[#5C6273]">
              Ön değerlendirme formu henüz tanımlanmadı. Eğitmen formu ekledikten sonra burada açılacak.
            </p>
            <Link
              href="/panel"
              className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white hover:bg-ink"
            >
              Panele dön
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
