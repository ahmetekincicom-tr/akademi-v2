import "server-only";

import { redirect } from "next/navigation";
import { FIRSATLAR_ACIK } from "@/lib/bolumler";
import { yoneticiMi } from "@/lib/panel-kapsam";

/**
 * /panel/firsatlar erişimi. Bölüm kapalıyken (menüde "Çok yakında")
 * öğrenci genel bakışa döner; yönetici ise önizleme için girebilir.
 * Dönen değer: önizleme mi (yalnız yönetici görüyor).
 */
export async function firsatErisimi(): Promise<{ onizleme: boolean }> {
  if (FIRSATLAR_ACIK) return { onizleme: false };
  if (await yoneticiMi()) return { onizleme: true };
  redirect("/panel");
}
