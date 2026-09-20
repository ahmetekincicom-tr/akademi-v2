import "server-only";

import { createSign } from "node:crypto";

/**
 * GA4 Data API erişimi — servis hesabı ile, YALNIZCA sunucuda.
 *
 * Kimlik bilgileri ortam değişkenlerinde (asla client bundle'a girmez):
 *  - GA4_PROPERTY_ID      → GA4 mülk kimliği (yalnız rakam, ör. 123456789)
 *  - GA4_SA_CLIENT_EMAIL  → servis hesabı e-postası
 *  - GA4_SA_PRIVATE_KEY   → servis hesabı özel anahtarı (\n kaçışlı olabilir)
 *
 * Harici bağımlılık yok: erişim token'ı imzalı JWT ile alınıyor (node crypto).
 * Token ~1 saat geçerli; bellekte süresine kadar saklanıyor.
 */

const TOKEN_UCU = "https://oauth2.googleapis.com/token";
const KAPSAM = "https://www.googleapis.com/auth/analytics.readonly";

export type Ga4Yapi = { propertyId: string; email: string; key: string };

/** Ortamdan yapılandırma; eksikse null (panel "yapılandırılmadı" gösterir). */
export function ga4Yapisi(): Ga4Yapi | null {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const email = process.env.GA4_SA_CLIENT_EMAIL?.trim();
  const key = process.env.GA4_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!propertyId || !email || !key) return null;
  return { propertyId, email, key };
}

function base64url(veri: Buffer | string): string {
  return Buffer.from(veri).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let tokenOnbellek: { token: string; bitis: number } | null = null;

/** Erişim token'ı (bellekte önbellekli). */
async function erisimTokeni(yapi: Ga4Yapi): Promise<string> {
  const simdi = Math.floor(Date.now() / 1000);
  if (tokenOnbellek && tokenOnbellek.bitis - 60 > simdi) return tokenOnbellek.token;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({ iss: yapi.email, scope: KAPSAM, aud: TOKEN_UCU, iat: simdi, exp: simdi + 3600 }),
  );
  const imza = base64url(createSign("RSA-SHA256").update(`${header}.${claim}`).sign(yapi.key));
  const jwt = `${header}.${claim}.${imza}`;

  const cevap = await fetch(TOKEN_UCU, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!cevap.ok) {
    // Google'ın gövdesi ({error, error_description}) hatanın gerçek sebebini
    // söyler (ör. "invalid_grant: Invalid JWT Signature" → anahtar servis
    // hesabıyla eşleşmiyor). Tanıya taşımak için mesaja ekliyoruz.
    const detay = await cevap.text().catch(() => "");
    throw new Error(`GA4 token alınamadı (${cevap.status}): ${detay.replace(/\s+/g, " ").slice(0, 200)}`);
  }
  const veri = (await cevap.json()) as { access_token: string; expires_in: number };
  tokenOnbellek = { token: veri.access_token, bitis: simdi + (veri.expires_in ?? 3600) };
  return veri.access_token;
}

/** GA4 Data API runReport çağrısı (ham yanıt döner). */
export async function ga4RunReport(yapi: Ga4Yapi, govde: Record<string, unknown>): Promise<Ga4Rapor> {
  const token = await erisimTokeni(yapi);
  const cevap = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(yapi.propertyId)}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    },
  );
  if (!cevap.ok) {
    const metin = await cevap.text().catch(() => "");
    throw new Error(`GA4 runReport ${cevap.status}: ${metin.slice(0, 200)}`);
  }
  return (await cevap.json()) as Ga4Rapor;
}

export type Ga4Satir = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
export type Ga4Rapor = { rows?: Ga4Satir[] };

/**
 * Servis hesabının ERİŞEBİLDİĞİ GA4 mülkleri (Admin API accountSummaries).
 *
 * Tanı için: "runReport 403" alındığında sorun çoğu zaman yanlış GA4_PROPERTY_ID
 * ya da iznin başka bir mülke/e-postaya verilmiş olması. Bu liste, yapılandırılan
 * kimliğin gerçekten erişilebilir olup olmadığını kesin gösterir.
 *
 * Not: Admin API (analyticsadmin) projede ayrıca enable edilmemişse bu çağrı da
 * hata verebilir; çağıran tarafı bunu ayrı ele alıyor.
 */
export type Ga4Mulk = { id: string; ad: string };
export async function ga4ErisilebilirMulkler(yapi: Ga4Yapi): Promise<Ga4Mulk[]> {
  const token = await erisimTokeni(yapi);
  const cevap = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!cevap.ok) {
    const detay = await cevap.text().catch(() => "");
    throw new Error(`GA4 admin ${cevap.status}: ${detay.replace(/\s+/g, " ").slice(0, 180)}`);
  }
  const veri = (await cevap.json()) as {
    accountSummaries?: { propertySummaries?: { property?: string; displayName?: string }[] }[];
  };
  const liste: Ga4Mulk[] = [];
  for (const hesap of veri.accountSummaries ?? []) {
    for (const p of hesap.propertySummaries ?? []) {
      const id = (p.property ?? "").replace("properties/", "").trim();
      if (id) liste.push({ id, ad: p.displayName ?? "" });
    }
  }
  return liste;
}
