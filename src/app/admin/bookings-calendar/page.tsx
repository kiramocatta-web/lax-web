import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import BookingsCalendarClient from "@/components/BookingsCalendarClient";

type ProfileRow = {
  role: string | null;
  is_admin: boolean | null;
};

export default async function BookingsCalendarPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .single<ProfileRow>();

  const isAdmin = profile?.is_admin === true || profile?.role === "admin";

  if (!isAdmin) {
    redirect("/profile");
  }

  return <BookingsCalendarClient />;
}