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

const faqs = [
  {
    q: "Do I need a booking?",
    a: "Yes, bookings are mandatory so your visit is smooth and ready when you arrive. The QR code at the space will be phased out due to the new website.",
  },
  {
    q: "What should I bring?",
    a: "We have amenities on site, including complimentary waters, towels, Aesop, and more, so just bring yourself.",
  },
  {
    q: "Can beginners use the recovery tools?",
    a: "Yes, the space is designed to feel approachable for both first timers and regulars.",
  },
  {
    q: "Is there parking?",
    a: "Yes, there are 3 spots in the driveway, plus street parking available.",
  },
  {
    q: "Do I just walk in?",
    a: "Yes. It is a self-managed space where you come and go as you please within your booking time.",
  },
  {
    q: "Do I have to turn anything on or off?",
    a: "Yes, please turn on the infrared sauna when you arrive. The rest is on and ready to go when you walk in.",
  },
  {
    q: "Can I leave anonymous feedback?",
    a: "Yes, all feedback is encouraged and welcomed so we can keep improving the experience.",
  },
  {
    q: "What if something doesn't work?",
    a: "Send us a message on Instagram, email, or through the contact page and we will get it sorted as soon as possible.",
  },
];

export default function EverythingElsePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        {/* HERO */}
          <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">
            More about the space, the tools, and the vision behind Lax.
          </h1>
          <p className="mt-4 text-base leading-7 text-white/70 sm:text-lg">
            Explore the recovery tools, what they can support, who we are, and
            the answers to the questions people ask most.
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
          <p className="mt-4 max-w-3xl text-white/75 leading-7">
            Lax was built to make quality recovery feel accessible, welcoming,
            and part of everyday life. Whether you are an athlete, a
            weekend warrior, or simply needing to switch off and reset, the goal
            is simple: create a space that helps people feel better and come
            back stronger. Our passion is community, outreach and connection,
            and we cannot wait to build a legacy.

          
          </p>
        </section>

        {/* TEAM */}
        <section className="mt-20">
          <h2 className="text-3xl font-light">The Team</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-2xl font-medium">Coming Soon</h3>
              <p className="mt-3 text-white/70">Coming Soon</p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h3 className="text-2xl font-medium">Coming Soon</h3>
              <p className="mt-3 text-white/70">Coming Soon</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="text-3xl font-light">FAQs</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="font-medium">{item.q}</h3>
                <p className="mt-2 text-white/70">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* FOOTER */}
      <footer className="sticky bottom-0 z-10 border-t border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4 flex flex-wrap justify-center text-center gap-x-6 gap-y-2 text-sm text-white/70">
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