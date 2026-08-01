import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guvenliYol } from "@/lib/guvenli-url";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Dogrulanmadan kullanilirsa acik yonlendirmeye donusur.
  const next = guvenliYol(searchParams.get("next"), "/panel");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/giris?hata=1`);
}
