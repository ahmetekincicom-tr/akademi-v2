import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/panel-kapsam", () => ({ yoneticiMi: async () => true }));
vi.mock("@/lib/auth-hatalari", () => ({ veriHatasi: (e: { message: string }) => e.message }));
const yazilan: unknown[] = [];
vi.mock("@/lib/supabase/gorev", () => ({
  gorevIstemcisi: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { app_id: "2642842662842425", senkron: {} } }) }) }),
      upsert: async (v: unknown) => {
        yazilan.push(v);
        return { error: null };
      },
    }),
  }),
}));

const cagrilar: string[] = [];
let senaryo: { biz: unknown; gecmisHata?: boolean; scopes?: string[]; hedefsiz?: boolean } = { biz: true };
beforeEach(() => {
  cagrilar.length = 0;
  yazilan.length = 0;
  process.env.WHATSAPP_APP_SECRET = "sir";
  process.env.WHATSAPP_SISTEM_TOKENI = "tok";
  vi.stubGlobal("fetch", async (u: URL, o: { method?: string; body?: string; headers?: Record<string, string> }) => {
    const yol = `${o?.method ?? "GET"} ${u.pathname}${u.search}`;
    cagrilar.push(yol + (o?.headers?.Authorization ? " [auth]" : ""));
    const j = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s });
    if (u.pathname.endsWith("/debug_token"))
      return j({ data: { app_id: "2642842662842425", is_valid: true, scopes: senaryo.scopes ?? ["whatsapp_business_management", "whatsapp_business_messaging"], granular_scopes: senaryo.hedefsiz ? [{ scope: "whatsapp_business_management" }] : [{ scope: "whatsapp_business_management", target_ids: ["555000111"] }] } });
    if (u.pathname.endsWith("/555000111/phone_numbers")) {
      if (senaryo.biz === "yok" && u.searchParams.get("fields")!.includes("is_on_biz_app")) return j({ error: { message: "unknown field" } }, 400);
      return j({ data: [{ id: "777000222", display_phone_number: "+90 850 000 00 00", verified_name: "Ahmet Ekinci Akademi", ...(senaryo.biz === "yok" ? {} : { is_on_biz_app: senaryo.biz }) }] });
    }
    if (u.pathname.endsWith("/subscribed_apps")) return j({ success: true });
    if (u.pathname.endsWith("/smb_app_data")) {
      const t = JSON.parse(o.body!).sync_type;
      if (senaryo.gecmisHata) return j({ error: { message: "This API is only available to WhatsApp Business App phone numbers" } }, 400);
      return j({ request_id: `r-${t}` });
    }
    return j({ error: { message: "beklenmeyen " + yol } }, 404);
  });
});

describe("whatsappSistemAnahtariylaBagla", () => {
  it("uygulamadaki numara: abone eder, iki aktarımı ister, kaydeder", async () => {
    senaryo = { biz: true };
    const { whatsappSistemAnahtariylaBagla } = await import("@/app/kontrol-9f4x2k/(protected)/whatsapp/actions");
    const r = await whatsappSistemAnahtariylaBagla();
    expect(r).toEqual({ numara: "+90 850 000 00 00", uygulamaylaBirlikte: true, uyarilar: [] });
    expect(cagrilar.some((c) => c.startsWith("GET /v26.0/debug_token") && !c.includes("[auth]"))).toBe(true);
    expect(cagrilar.filter((c) => c.includes("smb_app_data"))).toHaveLength(2);
    expect(yazilan[0]).toMatchObject({ waba_id: "555000111", telefon_numara_id: "777000222", uygulamayla_birlikte: true });
  });

  it("alan tanınmazsa yeniden sorar; aktarım reddedilirse uyarı verir, yine kaydeder", async () => {
    senaryo = { biz: "yok", gecmisHata: true };
    const { whatsappSistemAnahtariylaBagla } = await import("@/app/kontrol-9f4x2k/(protected)/whatsapp/actions");
    const r = await whatsappSistemAnahtariylaBagla();
    expect(r.uygulamaylaBirlikte).toBe(false);
    expect(r.uyarilar).toHaveLength(2);
    expect(yazilan).toHaveLength(1);
  });

  it("is_on_biz_app false olsa da aktarımı dener", async () => {
    senaryo = { biz: false };
    const { whatsappSistemAnahtariylaBagla } = await import("@/app/kontrol-9f4x2k/(protected)/whatsapp/actions");
    const r = await whatsappSistemAnahtariylaBagla();
    expect(r.uygulamaylaBirlikte).toBe(true);
  });

  it("izin eksikse durur", async () => {
    senaryo = { biz: true, scopes: ["whatsapp_business_management"] };
    const { whatsappSistemAnahtariylaBagla } = await import("@/app/kontrol-9f4x2k/(protected)/whatsapp/actions");
    const r = await whatsappSistemAnahtariylaBagla();
    expect(r.error).toContain("whatsapp_business_messaging");
    expect(cagrilar.some((c) => c.includes("subscribed_apps"))).toBe(false);
  });

  it("kapsamda hesap yoksa elle girilen kimlikle bağlar; o da yoksa ne yapılacağını söyler", async () => {
    senaryo = { biz: true, hedefsiz: true };
    const { whatsappSistemAnahtariylaBagla } = await import("@/app/kontrol-9f4x2k/(protected)/whatsapp/actions");
    const yok = await whatsappSistemAnahtariylaBagla();
    expect(yok.error).toContain("Kod");
    expect(cagrilar.some((c) => c.includes("subscribed_apps"))).toBe(false);

    const r = await whatsappSistemAnahtariylaBagla({ wabaId: " 555 000 111 " });
    expect(r).toMatchObject({ numara: "+90 850 000 00 00", uygulamaylaBirlikte: true });
    expect(yazilan.at(-1)).toMatchObject({ waba_id: "555000111" });

    expect((await whatsappSistemAnahtariylaBagla({ wabaId: "abc" })).error).toContain("rakam");
  });
});
