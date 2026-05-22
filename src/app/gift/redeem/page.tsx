export default function GiftRedeemPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = String(searchParams.token ?? "").trim();
  const claimHref = `/gift/claim?token=${token}`;

  return (
    <main className="min-h-screen bg-emerald-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">
          Gifted Recovery
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          You’ve been gifted recovery.
        </h1>

        <p className="mt-4 text-white/70">
          Create an account or log in first, then come back to this claim link
          to redeem your package.
        </p>

        <div className="mt-8 grid gap-3">
          <a
            href="/signup"
            className="rounded-2xl bg-white px-5 py-4 font-semibold text-black"
          >
            Create account
          </a>

          <a
            href="/login"
            className="rounded-2xl border border-white/15 px-5 py-4 font-semibold text-white"
          >
            Log in
          </a>

          <a
            href={claimHref}
            className="text-sm text-white/60 underline underline-offset-4"
          >
            I’m logged in — claim my gift
          </a>
        </div>
      </div>
    </main>
  );
}