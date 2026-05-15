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
          The tools & FAQs
        </h1>

        <p className="mt-4 text-base leading-7 text-white/70 sm:text-lg">
          Explore the recovery tools, what they can support and the
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

      </section>

      {/* FAQ */}
        <section className="mt-20 px-1 pb-20 sm:px-0 sm:pb-24">
          <div className="mx-auto max-w-5xl px-1 sm:px-0">
            <p className="text-sm uppercase tracking-[0.3em] text-white/45">
              Commonly Asked Questions
            </p>

            <h2 className="mt-3 text-3xl font-light">
              Everything you need to know before you arrive.
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
              We’ve tried to make LAX as simple, comfortable, and easy as possible.
              Here are the answers to the questions we get asked the most.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl space-y-4">
            {[
              {
                q: "Do I just show up and walk in?",
                a: "If you’ve made a booking — yes. Walk straight through and make yourself at home. There is no reception desk. Please note all entrants are monitored to ensure valid bookings have been made before arrival.",
              },
              {
                q: "What do I need to bring?",
                a: "Towels and complimentary water are provided, and the shower is stocked with amenities. Just bring yourself — and anything that helps you relax, whether that’s your phone, headphones, a book, or your post-training mindset.",
              },
              {
                q: "What do I do when I arrive?",
                a: "Place your belongings in the cubicles, turn on the sauna, remove the spa cover if you plan to use it, grab a towel and water from around the corner, connect the music, and settle into your recovery session.",
              },
              {
                q: "Where do I park?",
                a: "Street parking is available, along with three driveway parks available for customers.",
              },
              {
                q: "Can I leave feedback?",
                a: "Absolutely. You can leave anonymous feedback or include your email if you'd like a response. Whether it’s positive, constructive, or somewhere in between — we genuinely value it and use it to continue improving LAX.",
              },
              {
                q: "Can I come with friends?",
                a: "Yes. You’re welcome to book with friends, training partners, or teammates. Just ensure everyone attending is included in the booking numbers.",
              },
              {
                q: "Is the space private?",
                a: "LAX is designed to feel calm, comfortable, and low-pressure. Depending on bookings, you may share the space with other members or guests during your session.",
              },
              {
                q: "Can beginners use the recovery tools?",
                a: "Definitely. You do not need to be an elite athlete to use LAX. Everything is beginner-friendly, and you’re encouraged to go at your own pace.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8"
              >
                <h3 className="text-lg font-medium text-white sm:text-xl">
                  {item.q}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
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
          <a className="hover:text-white" href="/everything-else">
            Vision &amp; Story
          </a>  
        </div>
      </footer>
    </main>

        );        
}