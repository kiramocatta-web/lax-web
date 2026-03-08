import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function toMinutes(value: string) {
  const [hh, mm] = value.split(":");
  return Number(hh) * 60 + Number(mm);
}

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

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("is_admin,role")
      .eq("id", user.id)
      .single();

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    const isAdmin =
      Boolean(adminProfile?.is_admin) ||
      String(adminProfile?.role ?? "").toLowerCase() === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const blockDate = String(body?.block_date ?? "").trim();
    const isFullDay = Boolean(body?.is_full_day);
    const startTimeRaw = body?.start_time == null ? null : String(body.start_time).trim();
    const endTimeRaw = body?.end_time == null ? null : String(body.end_time).trim();
    const reason =
      body?.reason == null || String(body.reason).trim() === ""
        ? null
        : String(body.reason).trim();

    if (!isValidDate(blockDate)) {
      return NextResponse.json({ error: "Invalid block_date" }, { status: 400 });
    }

    let startTime: string | null = null;
    let endTime: string | null = null;

    if (!isFullDay) {
      if (!startTimeRaw || !endTimeRaw) {
        return NextResponse.json(
          { error: "Timed blocks require start_time and end_time" },
          { status: 400 }
        );
      }

      if (!isValidTime(startTimeRaw) || !isValidTime(endTimeRaw)) {
        return NextResponse.json({ error: "Invalid time format" }, { status: 400 });
      }

      startTime = startTimeRaw.length === 5 ? `${startTimeRaw}:00` : startTimeRaw;
      endTime = endTimeRaw.length === 5 ? `${endTimeRaw}:00` : endTimeRaw;

      if (toMinutes(startTime) >= toMinutes(endTime)) {
        return NextResponse.json(
          { error: "start_time must be earlier than end_time" },
          { status: 400 }
        );
      }
    }

    if (isFullDay) {
      const { data: existingFullDay } = await supabase
        .from("booking_blocks")
        .select("id")
        .eq("block_date", blockDate)
        .eq("is_full_day", true)
        .limit(1);

      if ((existingFullDay ?? []).length > 0) {
        return NextResponse.json(
          { error: "A full-day block already exists for this date" },
          { status: 409 }
        );
      }
    } else {
      const { data: existingBlocks, error: existingError } = await supabase
        .from("booking_blocks")
        .select("id,is_full_day,start_time,end_time")
        .eq("block_date", blockDate);

      if (existingError) {
        return NextResponse.json({ error: existingError.message }, { status: 500 });
      }

      for (const block of existingBlocks ?? []) {
        if (block.is_full_day) {
          return NextResponse.json(
            { error: "This date already has a full-day block" },
            { status: 409 }
          );
        }

        const existingStart = String(block.start_time ?? "");
        const existingEnd = String(block.end_time ?? "");

        if (!existingStart || !existingEnd || !startTime || !endTime) continue;

        const overlaps =
          toMinutes(existingStart) < toMinutes(endTime) &&
          toMinutes(existingEnd) > toMinutes(startTime);

        if (overlaps) {
          return NextResponse.json(
            { error: "This timed block overlaps an existing block" },
            { status: 409 }
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("booking_blocks")
      .insert({
        block_date: blockDate,
        is_full_day: isFullDay,
        start_time: isFullDay ? null : startTime,
        end_time: isFullDay ? null : endTime,
        reason,
        created_by: user.id,
      })
      .select("id,block_date,is_full_day,start_time,end_time,reason,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, block: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create booking block" },
      { status: 500 }
    );
  }
}