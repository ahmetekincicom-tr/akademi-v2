import type { IconName } from "@/components/Icon";

export type NavItem = { label: string; href: string; icon: IconName };

/**
 * Sitenin tek menüsü.
 *
 * Daha önce her sayfa kendi listesini veriyordu: ana sayfa bölüm çapalarına
 * (#egitimler), eğitim detayı başka bir listeye bakıyordu. Aynı başlık farklı
 * sayfalarda farklı yere gidiyordu ve hangi sayfada olduğun menüden
 * anlaşılmıyordu. Artık liste burada, her sayfa aynısını basıyor.
 */
export const siteNav: NavItem[] = [
  { label: "Ana Sayfa", href: "/", icon: "home" },
  { label: "Hakkımızda", href: "/hakkimizda", icon: "user" },
  { label: "Eğitimler", href: "/egitimler", icon: "book" },
  { label: "Referanslar", href: "/referanslar", icon: "sparkle" },
  { label: "Yorumlar", href: "/yorumlar", icon: "message" },
];
