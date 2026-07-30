"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function cikisYap() {
  const store = await cookies();
  store.delete("admin_auth");
  redirect("/admin/giris");
}
