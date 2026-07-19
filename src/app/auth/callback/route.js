import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after an email-confirmation or magic-link click,
// with a `code` query param that gets exchanged for a real session.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/home`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_failed`);
}
