import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

type MemberRow = {
  id: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  membership_plan: string | null;
  membership_status: string | null;
  membership_expires_at: string | null;
  stripe_current_period_end: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function planLabel(plan: string | null) {
  if (plan === "weekly") return "$20 p/w Unlimited";
  if (plan === "pass7") return "7-Day Pass";
  return "—";
}

export default async function AdminMembersPage() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminProfile, error: adminErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (adminErr || !adminProfile?.is_admin) {
    redirect("/profile");
  }

  const todayISO = new Date().toISOString();

  const { data: members, error } = await supabase
    .from("profiles")
    .select(
      "id,email,phone,role,membership_plan,membership_status,membership_expires_at,stripe_current_period_end"
    )
    .neq("role", "affiliate")
    .or(
      [
        "membership_status.eq.active",
        "membership_status.eq.trialing",
        `membership_expires_at.gt.${todayISO}`,
      ].join(",")
    )
    .order("email", { ascending: true });

  if (error) {
    return (
      <div className="min-h-screen bg-emerald-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-semibold">Active Members</h1>
          <div className="mt-6 text-red-300">{error.message}</div>
        </div>
      </div>
    );
  }

  const rows = (members ?? []) as MemberRow[];

  return (
    <div className="min-h-screen bg-emerald-950 text-white">

      <div className="max-w-6xl mx-auto px-6 py-10 pb-24">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">Active Members</h1>
          <div className="text-sm text-white/70">
            Total: <span className="text-white font-semibold">{rows.length}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-white/80">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Plan</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Expiry / Next Payment</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-white/60">
                    No active members found.
                  </td>
                </tr>
              ) : (
                rows.map((member) => {
                  const dateToShow =
                    member.membership_plan === "weekly"
                      ? member.stripe_current_period_end
                      : member.membership_expires_at;

                  return (
                    <tr
                      key={member.id}
                      className="border-t border-white/10 text-white/85"
                    >
                      <td className="px-4 py-3">{member.email ?? "—"}</td>
                      <td className="px-4 py-3">{member.phone ?? "—"}</td>
                      <td className="px-4 py-3">{planLabel(member.membership_plan)}</td>
                      <td className="px-4 py-3">{member.membership_status ?? "—"}</td>
                      <td className="px-4 py-3">{fmtDate(dateToShow)}</td>
                      <td className="px-4 py-3">{member.role ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}