"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_auth";

export async function girisYap(formData: FormData) {
  const sifre = String(formData.get("sifre") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || sifre !== expected) {
    redirect(`/admin/giris?hata=1&next=${encodeURIComponent(next)}`);
  }

  const token = crypto.createHash("sha256").update(expected).digest("hex");
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}
