import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import BookingsCalendarClient from "src/components/BookingsCalendarClient"

type ProfileRow = {
  id: string;
  is_admin: boolean | null;
  role: string | null;
};

export default async function AdminBookingsCalendarPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,is_admin,role")
    .eq("id", user.id)
    .single<ProfileRow>();

  const isAdmin =
    profile?.is_admin === true || profile?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    redirect("/profile");
  }

  return <BookingsCalendarClient />;
}