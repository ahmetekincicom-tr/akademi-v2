import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTalepler } from "@/lib/destek";
import { TalepGorunumu } from "@/components/destek/TalepGorunumu";

export default async function AdminDestekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/giris");

  const talepler = await getTalepler();

  return <TalepGorunumu talepler={talepler} benimId={user.id} rol="admin" />;
}
