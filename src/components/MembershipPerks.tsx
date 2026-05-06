import Image from "next/image";

const perks = [
  {
    title: "Hydration Sip Included",
    description: "Access to hydration support during your recovery sessions.",
    accent: "text-pink-300",
  },
  {
    title: "Pause Flexibility",
    description: "Pause your membership when needed, because life and comp prep happen. *weekly membership only",
    accent: "text-blue-300",
  },
  {
    title: "Unlimited Access",
    description: "Recover as often as you need with unlimited weekly access.",
    accent: "text-amber-200",
  },
];

export default function MembershipPerks() {
  return (
    <section className="mx-auto mt-14 w-full max-w-6xl px-5">
      <div className="rounded-[2rem] border border-white/10 bg-[#1f1410]/80 px-5 py-8 shadow-2xl backdrop-blur md:px-8 md:py-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
            Member Perks
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Built for athletes who need affordability & recovery on their schedule.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/55 md:text-base">
            More access, more flexibility, and more support inside your recovery routine.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {perks.map((perk) => (
            <div
              key={perk.title}
              className="group rounded-[1.7rem] border border-white/10 bg-[#2a1d18] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-[#30211b]"
            >

              <h3 className={`text-xl font-bold ${perk.accent}`}>
                {perk.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/60">
                {perk.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}