import { describe, it, expect } from "vitest";
import { medyanIlkYanit } from "@/lib/destek-sure";

const OGR = "ogrenci";
const talep = (acilis: string, mesajlar: [string, string, boolean?][]) => ({
  user_id: OGR,
  created_at: acilis,
  support_messages: mesajlar.map(([gonderen_id, created_at, ic_not]) => ({ gonderen_id, created_at, ic_not: Boolean(ic_not) })),
});

describe("medyanIlkYanit", () => {
  it("3'ten az örnekte null (uydurma tahmin yok)", () => {
    expect(medyanIlkYanit([])).toBeNull();
    expect(medyanIlkYanit([talep("2026-09-01T10:00:00Z", [["admin", "2026-09-01T11:00:00Z"]])])).toBeNull();
  });

  it("ilk ekip yanıtını alır; iç notu ve öğrencinin kendi mesajını saymaz", () => {
    const t = [
      talep("2026-09-01T10:00:00Z", [
        [OGR, "2026-09-01T10:00:00Z"],
        ["admin", "2026-09-01T10:10:00Z", true], // iç not: sayılmaz
        ["admin", "2026-09-01T10:30:00Z"],
      ]),
      talep("2026-09-02T10:00:00Z", [["admin", "2026-09-02T11:00:00Z"]]),
      talep("2026-09-03T10:00:00Z", [["admin", "2026-09-03T12:00:00Z"]]),
      talep("2026-09-04T10:00:00Z", [[OGR, "2026-09-04T10:00:00Z"]]), // yanıtsız: örnek değil
    ];
    expect(medyanIlkYanit(t)).toBe(60);
  });

  it("çift sayıda örnekte ortadaki ikisinin ortalaması", () => {
    const t = [10, 20, 30, 40].map((dk, i) =>
      talep(`2026-09-0${i + 1}T10:00:00Z`, [["admin", new Date(Date.parse(`2026-09-0${i + 1}T10:00:00Z`) + dk * 60000).toISOString()]]),
    );
    expect(medyanIlkYanit(t)).toBe(25);
  });
});
