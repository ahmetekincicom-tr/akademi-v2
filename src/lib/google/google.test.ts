import { describe, it, expect } from "vitest";
import { gaClientId, gclidCoz } from "@/lib/google/gcl";
import { mpGovdesi } from "@/lib/google/mp";

describe("gaClientId (_ga çerezi)", () => {
  it("client_id'yi çıkarır", () => {
    expect(gaClientId("GA1.1.1234567890.1700000000")).toBe("1234567890.1700000000");
    expect(gaClientId("GA1.2.987654321.1699999999")).toBe("987654321.1699999999");
  });
  it("biçim tutmuyorsa null", () => {
    expect(gaClientId(null)).toBeNull();
    expect(gaClientId("")).toBeNull();
    expect(gaClientId("GA1.1.abc")).toBeNull();
    expect(gaClientId("cöp")).toBeNull();
  });
});

describe("gclidCoz (_gcl_aw çerezi)", () => {
  it("gclid'i çıkarır", () => {
    expect(gclidCoz("GCL.1700000000.CjwKCAjw_gclid_ornek123")).toBe("CjwKCAjw_gclid_ornek123");
  });
  it("biçim tutmuyorsa null", () => {
    expect(gclidCoz(null)).toBeNull();
    expect(gclidCoz("GCL.1700000000.")).toBeNull();
    expect(gclidCoz("başka")).toBeNull();
  });
});

describe("mpGovdesi (GA4 Measurement Protocol)", () => {
  const govde = mpGovdesi({
    clientId: "111.222",
    tutar: 4500,
    paymentId: "pay-123",
    kursAdi: "Meta Ads Eğitimi",
    gclid: "GCLID_ABC",
    izin: true,
    zamanMs: 1_700_000_000_000,
  }) as {
    client_id: string;
    timestamp_micros: number;
    consent: { ad_user_data: string; ad_personalization: string };
    events: { name: string; params: Record<string, unknown> }[];
  };

  it("client_id ve purchase olayı doğru", () => {
    expect(govde.client_id).toBe("111.222");
    expect(govde.events[0].name).toBe("purchase");
    expect(govde.events[0].params.value).toBe(4500);
    expect(govde.events[0].params.currency).toBe("TRY");
    // transaction_id = ödeme kimliği → GA4 dedup
    expect(govde.events[0].params.transaction_id).toBe("pay-123");
    expect(govde.events[0].params.gclid).toBe("GCLID_ABC");
  });

  it("timestamp_micros ms×1000", () => {
    expect(govde.timestamp_micros).toBe(1_700_000_000_000 * 1000);
  });

  it("izin consent'e yansıyor", () => {
    expect(govde.consent.ad_user_data).toBe("GRANTED");
    const redli = mpGovdesi({
      clientId: "1.2", tutar: 1, paymentId: "p", kursAdi: "x", gclid: null, izin: false,
    }) as { consent: { ad_user_data: string }; events: { params: Record<string, unknown> }[] };
    expect(redli.consent.ad_user_data).toBe("DENIED");
    // gclid yoksa parametreye eklenmiyor
    expect("gclid" in redli.events[0].params).toBe(false);
  });
});
