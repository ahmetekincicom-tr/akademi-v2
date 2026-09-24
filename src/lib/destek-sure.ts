/**
 * Talep açılışından ekibin ilk (iç not olmayan) yanıtına kadar geçen sürenin
 * medyanı, dakika. "Ekip" = talep sahibi olmayan gönderen (bkz. lib/destek.ts
 * egitmenMi). 3'ten az örnek → null: az veriyle verilen tahmin yanıltıcı.
 * Saf modül — test edilebilsin diye destek.ts'ten ayrı.
 */
export function medyanIlkYanit(
  talepler: { user_id: string; created_at: string; support_messages: { gonderen_id: string; ic_not: boolean; created_at: string }[] }[],
): number | null {
  const sureler: number[] = [];
  for (const t of talepler) {
    const ilk = t.support_messages
      .filter((m) => !m.ic_not && m.gonderen_id !== t.user_id)
      .map((m) => new Date(m.created_at).getTime())
      .sort((a, b) => a - b)[0];
    if (ilk === undefined) continue;
    const dk = (ilk - new Date(t.created_at).getTime()) / 60000;
    if (dk >= 0) sureler.push(dk);
  }
  if (sureler.length < 3) return null;
  sureler.sort((a, b) => a - b);
  const orta = Math.floor(sureler.length / 2);
  const medyan = sureler.length % 2 ? sureler[orta] : (sureler[orta - 1] + sureler[orta]) / 2;
  return Math.max(1, Math.round(medyan));
}
