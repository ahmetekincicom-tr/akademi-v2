const ayarKartlar = [
  {
    baslik: "Ödeme sağlayıcı",
    durum: "Bağlı",
    metin: "Kart ödemeleri ve taksit seçenekleri sağlayıcı üzerinden yürütülür.",
    satirlar: [
      { etiket: "Sağlayıcı", deger: "iyzico" },
      { etiket: "Taksit", deger: "1 / 3 / 6 / 9" },
    ],
    btn: "Ayarları düzenle",
  },
  {
    baslik: "Fatura bilgileri",
    durum: "Tamam",
    metin: "Faturalar bu bilgilerle düzenlenir ve panele arşivlenir.",
    satirlar: [
      { etiket: "Unvan", deger: "Ahmet Ekinci Akademi" },
      { etiket: "Vergi dairesi", deger: "Ankara / Çankaya" },
    ],
    btn: "Bilgileri güncelle",
  },
  {
    baslik: "E-posta bildirimleri",
    durum: "3 aktif",
    metin: "Yeni satış, havale bildirimi ve destek talebi e-postaları.",
    satirlar: [
      { etiket: "Gönderen", deger: "bilgi@ahmetekinciakademi.com" },
      { etiket: "Şablon", deger: "5 şablon" },
    ],
    btn: "Şablonları aç",
  },
  {
    baslik: "Yönetici erişimi",
    durum: "2 kişi",
    metin: "Panel yönetimi yapan kullanıcılar ve yetki seviyeleri.",
    satirlar: [
      { etiket: "Yönetici", deger: "Ahmet Ekinci" },
      { etiket: "Asistan", deger: "1 kişi · sınırlı" },
    ],
    btn: "Kullanıcıları yönet",
  },
];

export default function AyarlarPage() {
  return (
    <main className="p-7 pb-14">
      <h1 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-[-0.03em] sm:text-[29px]">Ayarlar</h1>
      <p className="mt-[7px] text-[14.5px] text-[#5C6273]">
        Ödeme sağlayıcı, fatura bilgileri, e-posta bildirimleri ve yönetici erişimleri.
      </p>
      <div className="mt-[22px] grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ayarKartlar.map((a) => (
          <div key={a.baslik} className="rounded-2xl border border-ink/10 bg-white p-6 px-6 pt-[22px] pb-6">
            <div className="flex items-center justify-between gap-[14px]">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.02em]">{a.baslik}</h2>
              <span className="rounded-full bg-brand/12 px-[9px] py-[3px] font-mono text-[9.5px] tracking-[0.08em] text-brand uppercase">
                {a.durum}
              </span>
            </div>
            <p className="mt-[10px] text-[13.5px] leading-[1.6] text-[#5C6273]">{a.metin}</p>
            <div className="mt-4 flex flex-col gap-[9px]">
              {a.satirlar.map((s) => (
                <div key={s.etiket} className="flex items-center justify-between gap-[14px] text-[13.5px]">
                  <span className="text-[#8A8F9E]">{s.etiket}</span>
                  <span className="font-mono text-[12.5px] font-medium">{s.deger}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-[18px] h-10 rounded-[9px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink hover:bg-ink hover:text-white"
            >
              {a.btn}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
