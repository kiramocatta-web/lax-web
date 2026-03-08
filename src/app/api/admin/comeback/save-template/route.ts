import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      Boolean(adminProfile?.is_admin) ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const templateBody = String(body?.body ?? "").trim();

    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        category: "comeback",
        name,
        subject,
        body: templateBody,
        created_by: user.id,
      })
      .select("id,name,subject,body,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, template: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to save template" },
      { status: 500 }
    );
  }
}