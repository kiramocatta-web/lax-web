import Image from "next/image";

export default function AthletixPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <Image
            src="/athletixlogo.png"
            alt="Athletix"
            width={340}
            height={120}
            className="h-auto"
            priority
          />
        </div>

        {/* Hero */}
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-10">
          <h1 className="text-center text-4xl font-light md:text-5xl">
            Performance Partner
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-center text-lg leading-8 text-white/75">
            At LAX, we only recommend businesses that we genuinely trust and
            personally use. Athletix has been a huge part of my own athletic
            journey, and it's somewhere I confidently recommend to anyone
            wanting to improve their performance.
          </p>
        </section>

        {/* Content */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">

          {/* Personal */}
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">

            <h2 className="text-3xl font-light">
              Why I Recommend Athletix
            </h2>

            <div className="mt-6 space-y-5 text-base leading-8 text-white/75">

              <p>
                When I first started taking sprinting seriously, I knew I needed
                an environment that would push me beyond what I thought was
                possible.
              </p>

              <p>
                For the past two years, Athletix has been exactly that.
              </p>

              <p>
                It's where I've become faster, stronger and more confident as an
                athlete. More importantly, it's a place where I've always felt
                supported. The coaches genuinely care, the athletes encourage
                one another, and everyone is working towards becoming better
                every single day.
              </p>

              <p>
                LAX exists to help people recover better. Athletix exists to
                help people perform better.
              </p>

              <p>
                Those two philosophies go hand in hand, which is why I'm proud
                to recommend Athletix to anyone looking for professional
                coaching, an incredible training environment and a community
                that genuinely wants to see you succeed.
              </p>

              <p className="pt-3 text-lg italic text-white">
                — Kira, Founder of LAX
              </p>

            </div>

          </section>

          {/* About */}
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">

            <h2 className="text-3xl font-light">
              About Athletix
            </h2>

            <div className="mt-6 space-y-5 text-base leading-8 text-white/75">

              <p>
                Athletix is a high-performance training facility dedicated to
                helping athletes and everyday people unlock their full
                potential.
              </p>

              <p>
                Through expert coaching, evidence-based programming and a
                supportive community, Athletix provides an environment where
                people can improve their speed, strength, power and overall
                athletic performance.
              </p>

              <p>
                Whether you're an elite athlete chasing national success, a team
                sport athlete wanting an edge, or someone simply looking to move
                better and become stronger, Athletix provides professional
                coaching in an encouraging environment that challenges everyone
                to improve.
              </p>

              <p>
                Their commitment to continual development and genuine care for
                every athlete is what makes them such a natural fit as one of
                LAX's Performance Partners.
              </p>

            </div>

          </section>

        </div>

        {/* CTA */}
        <section className="mt-16 rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/5 to-white/10 p-10 text-center">

          <h2 className="text-3xl font-light">
            Ready to Level Up?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
            If you're looking to become faster, stronger and a better athlete,
            I couldn't recommend Athletix more highly.
          </p>

          <a
            href="https://athletix.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-full border border-white/20 px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] transition hover:bg-white hover:text-black"
          >
            Visit Athletix
          </a>

        </section>

      </div>
    </main>
  );
}