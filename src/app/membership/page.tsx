// app/membership/page.tsx

import { redirect } from "next/navigation";

export default function MembershipRedirect() {
  redirect("/pricing-membership-and-packages");
}