import { NextResponse } from "next/server";
import { getCurrentProfile } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !profile.active) {
      return NextResponse.json({ data: null, error: { code: "UNAUTHENTICATED", message: "Sign in required." } }, { status: 401 });
    }
    return NextResponse.json({ data: profile, error: null });
  } catch (error) {
    return NextResponse.json({ data: null, error: { code: "PROFILE_READ_FAILED", message: error.message } }, { status: 500 });
  }
}
