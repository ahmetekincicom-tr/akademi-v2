import "server-only";

import { createSign } from "node:crypto";

/**
 * Google Search Console (Search Analytics) erişimi — servis hesabı ile, YALNIZCA
 * sunucuda. GA4 ile AYNI servis hesabı kullanılıyor (tek anahtar, iki API):
 *  - GSC_SITE_URL          → property (ör. "sc-domain:site.com" ya da "https://site.com/")
 *  - GA4_SA_CLIENT_EMAIL   → servis hesabı e-postası (GA4 ile ortak)
 *  - GA4_SA_PRIVATE_KEY    → servis hesabı özel anahtarı (GA4 ile ortak)
 *
 * Servis hesabı ayrıca Search Console'da o property'ye kullanıcı olarak
 * eklenmiş olmalı. Kapsam: webmasters.readonly. Harici bağımlılık yok; token
 * imzalı JWT ile alınıyor (node crypto), belleğinde süresine kadar saklanıyor.
 */

const TOKEN_UCU = "https://oauth2.googleapis.com/token";
const KAPSAM = "https://www.googleapis.com/auth/webmasters.readonly";

export type GscYapi = { siteUrl: string; email: string; key: string };

/** Ortamdan yapılandırma; eksikse null (panel "yapılandırılmadı" gösterir). */
export function gscYapisi(): GscYapi | null {
  const siteUrl = process.env.GSC_SITE_URL?.trim();
  const email = process.env.GA4_SA_CLIENT_EMAIL?.trim();
  const key = process.env.GA4_SA_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!siteUrl || !email || !key) return null;
  return { siteUrl, email, key };
}

function base64url(veri: Buffer | string): string {
  return Buffer.from(veri).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let tokenOnbellek: { token: string; bitis: number } | null = null;

async function erisimTokeni(yapi: GscYapi): Promise<string> {
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
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!cevap.ok) {
    const detay = await cevap.text().catch(() => "");
    throw new Error(`GSC token alınamadı (${cevap.status}): ${detay.replace(/\s+/g, " ").slice(0, 200)}`);
  }
  const veri = (await cevap.json()) as { access_token: string; expires_in: number };
  tokenOnbellek = { token: veri.access_token, bitis: simdi + (veri.expires_in ?? 3600) };
  return veri.access_token;
}

export type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscYanit = { rows?: GscRow[] };

/** Search Analytics query (ham yanıt döner). */
export async function gscQuery(yapi: GscYapi, govde: Record<string, unknown>): Promise<GscYanit> {
  const token = await erisimTokeni(yapi);
  const cevap = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(yapi.siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    },
  );
  if (!cevap.ok) {
    const metin = await cevap.text().catch(() => "");
    throw new Error(`GSC query ${cevap.status}: ${metin.replace(/\s+/g, " ").slice(0, 200)}`);
  }
  return (await cevap.json()) as GscYanit;
}
