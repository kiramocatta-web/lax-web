// app/api/affiliate/signup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeCode(input: unknown) {
  return clean(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const token = clean(body?.token);
    const email = clean(body?.email).toLowerCase();
    const password = clean(body?.password);
    const phone = clean(body?.phone);
    const desiredCode = normalizeCode(body?.desired_code);
    const acceptedAgreement = body?.accepted_affiliate_agreement === true;

    if (!token) {
      return NextResponse.json({ error: "Invalid invite." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!desiredCode || desiredCode.length < 3) {
      return NextResponse.json(
        { error: "Affiliate code must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (desiredCode.length > 20) {
      return NextResponse.json(
        { error: "Affiliate code is too long (max 20)." },
        { status: 400 }
      );
    }

    if (!acceptedAgreement) {
      return NextResponse.json(
        { error: "You must agree to the affiliate agreement." },
        { status: 400 }
      );
    }

    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("affiliate_invites")
      .select("id,is_used,expires_at,email")
      .eq("id", token)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Invalid invite." }, { status: 404 });
    }

    if (invite.is_used) {
      return NextResponse.json(
        { error: "Invite already used." },
        { status: 410 }
      );
    }

    if (
      invite.expires_at &&
      new Date(invite.expires_at).getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Invite expired." }, { status: 410 });
    }

    if (
      invite.email &&
      invite.email.toLowerCase() !== email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "This invite is for a different email." },
        { status: 403 }
      );
    }

    const { data: existingAffiliate } = await supabaseAdmin
      .from("affiliates")
      .select("user_id")
      .eq("code", desiredCode)
      .maybeSingle();

    if (existingAffiliate) {
      return NextResponse.json(
        { error: "That code is taken. Try another." },
        { status: 409 }
      );
    }

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createErr || !created?.user) {
      return NextResponse.json(
        { error: createErr?.message || "Failed to create user." },
        { status: 500 }
      );
    }

    const userId = created.user.id;
    const acceptedAt = new Date().toISOString();
    const agreementVersion = "2026-03-08";

    const { error: profileUpsertError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        role: "affiliate",
        phone: phone || null,
      });

    if (profileUpsertError) {
      return NextResponse.json(
        { error: profileUpsertError.message },
        { status: 500 }
      );
    }

    const { error: affiliateInsertError } = await supabaseAdmin
      .from("affiliates")
      .insert({
        user_id: userId,
        code: desiredCode,
        used_count: 0,
        credit_cents: 0,
        visits_count: 0,
        is_active: true,
        agreement_accepted_at: acceptedAt,
        agreement_version: agreementVersion,
      });

    if (affiliateInsertError) {
      return NextResponse.json(
        { error: affiliateInsertError.message },
        { status: 500 }
      );
    }

    const { error: inviteUpdateError } = await supabaseAdmin
      .from("affiliate_invites")
      .update({
        is_used: true,
        used_at: acceptedAt,
        used_by: userId,
      })
      .eq("id", token);

    if (inviteUpdateError) {
      return NextResponse.json(
        { error: inviteUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}