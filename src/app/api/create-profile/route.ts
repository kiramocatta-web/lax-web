import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const body = await req.json();

  const { userId, email, phone } = body;

  const { error } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    email,
    phone,
    role: "member",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}