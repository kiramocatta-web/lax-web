"use client";

export default function TopNav({
  rightHref,
  rightLabel,
}: {
  rightHref?: string;
  rightLabel?: string;
}) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur">
      <div className="max-w-xl mx-auto px-6 py-3 flex items-center justify-between">
        

        {rightHref && rightLabel ? (
          <a
            href={rightHref}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl"
          >
            {rightLabel}
          </a>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}