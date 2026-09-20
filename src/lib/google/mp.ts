/**
 * GA4 Measurement Protocol gövdesi (saf — server-only değil, test edilebilir).
 *
 * transaction_id = ödeme kimliği → GA4 aynı satışı iki kez saymıyor. consent,
 * profildeki reklam iznine göre (Consent Mode ile uyumlu). timestamp_micros
 * gönderim anı: çevrimdışı/gecikmeli dönüşümde olay zamanı doğru düşsün diye.
 */

export type MpGirdi = {
  clientId: string;
  tutar: number;
  paymentId: string;
  kursAdi: string;
  gclid: string | null;
  izin: boolean;
  zamanMs?: number;
};

export function mpGovdesi(g: MpGirdi): Record<string, unknown> {
  return {
    client_id: g.clientId,
    timestamp_micros: (g.zamanMs ?? Date.now()) * 1000,
    consent: {
      ad_user_data: g.izin ? "GRANTED" : "DENIED",
      ad_personalization: g.izin ? "GRANTED" : "DENIED",
    },
    events: [
      {
        name: "purchase",
        params: {
          currency: "TRY",
          value: g.tutar,
          transaction_id: g.paymentId,
          items: [{ item_name: g.kursAdi }],
          ...(g.gclid ? { gclid: g.gclid } : {}),
        },
      },
    ],
  };
}
