/**
 * Hazır cevap şablonları (destek masası).
 *
 * Uydurma veri DEĞİL: yöneticinin composer'a tek tıkla ekleyebileceği, sık
 * kullanılan yanıt metinleri (editör kolaylığı). İçerik tek yerde dursun diye
 * burada; ileride panelden düzenlenebilir hale getirilebilir.
 */
export const HAZIR_CEVAPLAR: { etiket: string; metin: string }[] = [
  {
    etiket: "Karşılama",
    metin: "Merhaba, mesajınız için teşekkürler. Konuyu inceliyorum, en kısa sürede dönüş yapacağım.",
  },
  {
    etiket: "Ek bilgi",
    metin: "Talebinizi daha net anlayabilmem için ilgili ekran görüntüsünü ve adımları paylaşabilir misiniz?",
  },
  {
    etiket: "Eğitim erişimi",
    metin: "Eğitim erişiminiz tanımlandı. Panelde “Eğitimlerim” bölümünden içeriğe ulaşabilirsiniz.",
  },
  {
    etiket: "Çözüldü",
    metin: "Sorunu çözdüğümüzü düşünüyorum. Başka bir konuda yardımcı olabilirsem çekinmeden yazın.",
  },
];
