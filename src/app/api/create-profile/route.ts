import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function normalizeEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined) {
  return String(phone ?? "").trim() || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const userId = String(body?.userId ?? "").trim();
    const email = normalizeEmail(body?.email);
    const phone = normalizePhone(body?.phone);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email,
        phone,
        role: "member",
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create profile" },
      { status: 500 }
    );
  }
}