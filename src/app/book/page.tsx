import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function BookPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/book/single");
  }

  redirect("/book/members");
}