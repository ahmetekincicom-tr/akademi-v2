import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Zamanlanmış görevler için Supabase istemcisi.
 *
 * Oturum yok: görevi tetikleyen bir kullanıcı değil, zamanlayıcı. RLS
 * politikaları "kendi satırın" üzerine kurulu olduğu için normal istemci
 * hiçbir şey göremez; servis anahtarı RLS'i atlıyor.
 *
 * Bu anahtar yalnızca sunucuda, yalnızca bu dosyada kullanılıyor. Tarayıcıya
 * sızarsa tüm veritabanı okunur ve yazılır — "server-only" içe aktarımı
 * yanlışlıkla bir istemci bileşenine bağlanmasını derleme anında engelliyor.
 */
export function gorevIstemcisi() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anahtar) return null;

  return createClient(url, anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
