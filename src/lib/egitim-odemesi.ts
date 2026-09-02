/**
 * Hangi ödeme EĞİTİM ödemesi, hangisi danışmanlık?
 *
 * Danışmanlık görüşmesinin ücreti de `payments` tablosuna yazılıyor. "Ödenmiş
 * ödemesi var mı" diye sorulduğunda yalnızca danışmanlık alan, hiçbir eğitime
 * katılmayan kişi de eğitim müşterisi sayılıyordu: panelde ön değerlendirme
 * adımı açılıyor ve hatırlatma görevi ona da mail atıyordu. Ön değerlendirme
 * birebir eğitimin kapsamını kurmak için var; danışmanlığın böyle bir adımı
 * yok.
 *
 * Ayrım course_id'ye DEĞİL görüşme bağına bakıyor: yönetici elle ödeme
 * tanımlarken eğitim seçmeyebiliyor ve course_id boş kalabiliyor — o kural
 * gerçek bir eğitim ödemesini de danışmanlık sayardı. Danışmanlık ödemesi ise
 * her zaman bir `gorusmeler` satırından doğuyor ve `payment_id` ile ona bağlı.
 *
 * Aynı kural veritabanında da var (egitim_erisimim işlevi). İkisi ayrı yerde
 * duruyor çünkü biri RLS altındaki panel sorgusu, diğeri servis anahtarıyla
 * çalışan zamanlanmış görev; ortak olan tanım burada yazılı.
 */

/** Ödemenin kimliği; başka alanları bu kural umursamıyor. */
type OdemeBenzeri = { id: string };

export function danismanlikOdemesiMi(odemeId: string, danismanlikOdemeIdleri: Set<string>): boolean {
  return danismanlikOdemeIdleri.has(odemeId);
}

/** Listeden danışmanlık ödemelerini eler. */
export function egitimOdemeleri<T extends OdemeBenzeri>(
  odemeler: T[],
  danismanlikOdemeIdleri: Set<string>,
): T[] {
  return odemeler.filter((o) => !danismanlikOdemesiMi(o.id, danismanlikOdemeIdleri));
}

/** `gorusmeler` satırlarından danışmanlık ödemelerinin kimlik kümesi. */
export function danismanlikOdemeKumesi(
  gorusmeler: { payment_id: string | null }[] | null | undefined,
): Set<string> {
  const s = new Set<string>();
  for (const g of gorusmeler ?? []) {
    if (g.payment_id) s.add(g.payment_id);
  }
  return s;
}
