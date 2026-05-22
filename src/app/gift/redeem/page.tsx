import { supabaseServer } from "@/lib/supabase/server";

export default async function GiftRedeemPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = String(searchParams.token ?? "").trim();
  const claimHref = `/gift/claim?token=${token}`;

  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);

  return (
    <main className="min-h-screen bg-emerald-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Gifted Recovery
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          You’ve been gifted recovery.
        </h1>

        {isLoggedIn ? (
          <p className="mt-4 text-white/70">
            You’re logged in. Claim your gifted recovery below.
          </p>
        ) : (
          <p className="mt-4 text-white/70">
            Create an account or log in first to redeem your package.
          </p>
        )}

        <div className="mt-8 grid gap-3">
          {isLoggedIn ? (
            <a
              href={claimHref}
              className="rounded-2xl bg-white px-5 py-4 font-semibold text-black"
            >
              Claim my gift
            </a>
          ) : (
            <>
              <a
                href={`/signup?returnTo=${encodeURIComponent(claimHref)}`}
                className="rounded-2xl bg-white px-5 py-4 font-semibold text-black"
              >
                Create account
              </a>

              <a
                href={`/login?returnTo=${encodeURIComponent(claimHref)}`}
                className="rounded-2xl border border-white/15 px-5 py-4 font-semibold text-white"
              >
                Log in
              </a>

              <a
                href={claimHref}
                className="text-sm text-white/60 underline underline-offset-4"
              >
                I’m already logged in — claim my gift
              </a>
            </>
          )}
        </div>
      </div>
    </main>
  );
}