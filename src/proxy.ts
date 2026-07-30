import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "node:crypto";

const COOKIE_NAME = "admin_auth";

function expectedCookieValue(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/giris") {
    return NextResponse.next();
  }

  const expected = expectedCookieValue();
  const actual = request.cookies.get(COOKIE_NAME)?.value;

  if (expected && actual === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/giris", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
