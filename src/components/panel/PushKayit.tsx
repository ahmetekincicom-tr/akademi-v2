"use client";

import { useCallback, useEffect, useState } from "react";
import { cihazKaydet } from "@/app/panel/push-actions";
import { useNativeUygulama } from "@/lib/native";
import { Icon } from "@/components/Icon";

type Durum = "bilinmiyor" | "sorulacak" | "acik" | "kapali" | "hata";

/**
 * Push bildirim izni ve cihaz kaydı.
 *
 * İzin uygulama açılır açılmaz sorulmuyor. iOS izni bir kez soruyor; "izin
 * verme" denirse tek çıkış yolu sistem ayarları oluyor. Önce ne için
 * kullanılacağını anlatan bir kart gösteriyoruz, sistem penceresi ancak
 * öğrenci düğmeye basınca çıkıyor.
 *
 * Yalnızca native uygulamada çalışıyor — web tarafı bu turda değişmiyor.
 */
export function PushKayit() {
  const native = useNativeUygulama();
  const [durum, setDurum] = useState<Durum>("bilinmiyor");
  const [hataMetni, setHataMetni] = useState("");
  const [gizlendi, setGizlendi] = useState(false);

  const kaydet = useCallback(async () => {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Token doğrudan dönmüyor; kayıt olayıyla geliyor. Dinleyiciyi istekten
    // ÖNCE bağlamak gerekiyor, yoksa hızlı yanıtta olay kaçıyor.
    await PushNotifications.addListener("registration", (t) => {
      void cihazKaydet(t.value, "ios");
      setDurum("acik");
    });

    // Bu dinleyici olmadan kayıt hatası hiçbir yere düşmüyordu: iOS izin
    // penceresi göründüğü için her şey yolunda sanılıyor ama APNs kaydı
    // arka planda başarısız oluyor ve cihaz hiç kaydolmuyor. En sık sebebi
    // derlemede aps-environment entitlement'ının olmaması.
    await PushNotifications.addListener("registrationError", (e) => {
      setHataMetni(String(e.error ?? "Bilinmeyen hata"));
      setDurum("hata");
    });

    await PushNotifications.register();
  }, []);

  // Mevcut izin durumunu oku; zaten verilmişse sessizce kaydol.
  useEffect(() => {
    if (!native) return;
    let iptal = false;

    void (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const izin = await PushNotifications.checkPermissions();
        if (iptal) return;

        if (izin.receive === "granted") {
          setDurum("acik");
          await kaydet();
        } else if (izin.receive === "denied") {
          setDurum("kapali");
        } else {
          setDurum("sorulacak");
        }
      } catch {
        // Eklenti yoksa (eski derleme) kart hiç görünmesin.
        if (!iptal) setDurum("bilinmiyor");
      }
    })();

    return () => {
      iptal = true;
    };
  }, [native, kaydet]);

  const izinIste = async () => {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const izin = await PushNotifications.requestPermissions();
    if (izin.receive === "granted") {
      setDurum("acik");
      await kaydet();
    } else {
      setDurum("kapali");
    }
  };

  // Kayıt başarısızsa sessiz kalma: izin verildiği halde bildirim gelmemesinin
  // sebebi ekranda görünsün, yoksa "izin verdim ama gelmiyor" olarak kalıyor.
  if (native && durum === "hata") {
    return (
      <div className="rounded-2xl border border-danger/35 bg-[#FDF2F2] p-5">
        <div className="text-[15px] font-semibold text-ink">Bildirim kaydı tamamlanamadı</div>
        <div className="mt-1 text-[13.5px] leading-[1.55] text-[#5C6273]">
          İzin verildi ama cihaz Apple&apos;a kaydedilemedi, bu yüzden bildirim gelmeyecek.
        </div>
        <div className="mt-2 rounded-[8px] bg-white/70 p-2 font-mono text-[11.5px] break-words text-[#5C6273]">
          {hataMetni}
        </div>
      </div>
    );
  }

  if (!native || durum !== "sorulacak" || gizlendi) return null;

  return (
    <div className="rounded-2xl border border-brand/25 bg-brand/[0.06] p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span className="mt-[2px] flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-brand/15 text-brand">
          <Icon name="bell" size={19} />
        </span>
        <div className="min-w-0 sm:grow sm:basis-[240px]">
          <div className="text-[15.5px] font-semibold text-ink">Bildirimleri aç</div>
          <div className="mt-[3px] text-[13.5px] leading-[1.55] text-[#5C6273]">
            Yeni ders yayınlandığında, birebir eğitim tarihin yaklaştığında ve sorunun yanıtlandığında
            haberin olsun.
          </div>
        </div>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={() => setGizlendi(true)}
            className="h-10 rounded-[10px] border border-ink/13 bg-white px-4 text-[13.5px] font-semibold text-ink transition hover:border-ink"
          >
            Şimdi değil
          </button>
          <button
            type="button"
            onClick={izinIste}
            className="h-10 rounded-[10px] bg-brand px-4 text-[13.5px] font-semibold text-white transition hover:bg-ink"
          >
            Aç
          </button>
        </div>
      </div>
    </div>
  );
}
