export default function SpaBubblesPage() {
  return (
    <main className="min-h-screen bg-[#2a1f1a] text-[#ede9e2] flex flex-col items-center px-6 py-12">
      <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-center">
        Bubble Trouble
      </h1>

      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[#4a3a32] shadow-2xl">
        <video
          className="w-full h-auto"
          controls
          autoPlay
          loop
          playsInline
        >
          <source src="/videos/spabubbles.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </main>
  );
}
