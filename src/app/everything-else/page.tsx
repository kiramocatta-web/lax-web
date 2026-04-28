import Image from "next/image";

const tools = [
  {
    title: "Infrared Sauna",
    image: "/infra-sauna.jpg",
    alt: "Infrared sauna at Lax",
    text: "Relax in our infrared sauna, where deep penetrating heat helps increase circulation, ease muscle tension, and support faster recovery. The gentle warmth promotes detoxifying sweat, stress relief, and improved relaxation, leaving you feeling refreshed and recharged.",
  },
  {
    title: "Ice Bath",
    image: "/ice-bath.JPG",
    alt: "Ice bath at Lax",
    text: "Step into the ice bath to rapidly cool the body, helping reduce inflammation, speed up muscle recovery, and boost circulation after training. The cold exposure also stimulates the nervous system, leaving you feeling energised, focused, and mentally refreshed.",
  },
  {
    title: "Magnesium Hot Plunge",
    image: "/mag_hot_tub.JPG",
    alt: "Magnesium hot plunge at Lax",
    text: "Sink into the magnesium hot plunge, where warm water infused with magnesium helps relax muscles, ease tension, and support recovery. The soothing heat promotes circulation, deep relaxation, and nervous system reset, leaving your body feeling calm, loose, and restored.",
  },
  {
    title: "Compression Boots",
    image: "/norm-boots.png",
    alt: "Compression boots at Lax",
    text: "Slip into our compression boots to boost circulation and help flush out metabolic waste from tired muscles. The rhythmic compression supports faster recovery, reduced soreness, and lighter, refreshed legs—perfect after training or long days on your feet.",
  },
];

export default function EverythingElsePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        {/* HERO */}
        <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">
          The tools, the vision & the owner's story.
        </h1>

        <p className="mt-4 text-base leading-7 text-white/70 sm:text-lg">
          Explore the recovery tools, what they can support, who we are, and the
          answers to the questions people ask most.
        </p>

        {/* TOOLS FLOW */}
        <section className="mt-14 space-y-6 sm:space-y-8">
          {tools.map((tool, index) => {
            const imageFirstDesktop = index % 2 === 0;

            return (
              <div
                key={tool.title}
                className="grid items-stretch gap-4 md:grid-cols-2 md:gap-6"
              >
                <div
                  className={`overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 ${
                    imageFirstDesktop ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <div className="relative aspect-[4/5] w-full sm:aspect-[5/4] md:aspect-[4/3]">
                    <Image
                      src={tool.image}
                      alt={tool.alt}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div
                  className={`flex items-center rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 ${
                    imageFirstDesktop ? "md:order-2" : "md:order-1"
                  }`}
                >
                  <div>
                    <h2 className="text-2xl font-medium sm:text-3xl">
                      {tool.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
                      {tool.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* VISION */}
        <section className="mt-20 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-3xl font-light">The Vision of Lax</h2>

          <div className="mt-5 max-w-4xl space-y-5 text-sm leading-7 text-white/75 sm:text-base">
            <p className="text-xl leading-8 text-white sm:text-2xl">
              LAX exists to redefine what it means to support an athlete.
            </p>

            <p>
              This is not just a recovery space, it’s a facility built to push,
              develop, and elevate. A place where athletes train with purpose,
              recover with intent, and build toward something greater than
              themselves.
            </p>

            <p>
              We are creating an environment where performance meets
              accessibility — where world-class recovery, structured programs,
              and high-level support are not a luxury, but a standard.
            </p>

            <p>
              But LAX goes beyond the physical. We exist to help athletes
              understand who they are, why they do what they do, and where
              they’re going.
            </p>

            <p>
              Through community, storytelling, and sponsorship, we aim to
              spotlight those who live with passion — the ones willing to show
              up, do the work, and inspire others to do the same.
            </p>

            <p>
              LAX was built as a stepping stone — a place where affordability
              and accessibility meet intention — so athletes and everyday
              individuals can invest in their future selves, today.
            </p>

            <p className="text-lg leading-8 text-white sm:text-xl">
              This is about more than recovery. This is about building a culture
              where people are pushed to be more, do more, and become more.
            </p>
          </div>
        </section>

        {/* OWNER */}
        <section className="mt-20">
          <h2 className="text-3xl font-light">Owner</h2>

          <div className="mt-8 grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
              <Image
                src="/Owner_of_lax.PNG"
                alt="Owner of Lax"
                fill
                className="object-cover"
              />
            </div>

            <div className="flex items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/45">
                  My Story
                </p>

                <div className="mt-5 space-y-4 text-sm leading-7 text-white/75 sm:text-base">
                  <p>
                    I was a semi-pro athlete with everything in front of me —
                    until a drunk driver hit me and broke my spine in three
                    places.
                  </p>

                  <p>
                    For a long time, I let that moment define me. I wore it as
                    my story. My excuse. My reason for losing direction.
                  </p>

                  <p>I became a victim of what happened to me.</p>

                  <p>
                    Until one day, I decided I wasn’t going to live like that
                    anymore.
                  </p>

                  <p>
                    LAX was created from that turning point — built to inspire,
                    to motivate, and to create a community that reminds people
                    of one thing:
                  </p>

                  <p className="text-lg leading-8 text-white sm:text-xl">
                    It’s never too late.
                    <br />
                    What’s happened to you doesn’t define you — only you do.
                  </p>

                  <p>
                    This is the new era of LAX.
                    <br />
                    And it’s only the beginning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* FOOTER */}
      <footer className="sticky bottom-0 z-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-2 px-6 py-4 text-center text-sm text-white/70">
          <a className="hover:text-white" href="/contact">
            Contact Us
          </a>
          <a className="hover:text-white" href="/privacy">
            Privacy Policy
          </a>
          <a className="hover:text-white" href="/disclaimer">
            Disclaimer
          </a>
          <a className="hover:text-white" href="/terms">
            Terms &amp; Conditions
          </a>
          <a className="hover:text-white" href="/cancellation">
            Cancellation Policy
          </a>
          <a className="hover:text-white" href="/health-waiver">
            Health Waiver
          </a>
        </div>
      </footer>
    </main>
  );
}