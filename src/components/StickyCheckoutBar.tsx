"use client";

type Props = {
  title?: string;
  summaryLeft: string;     // e.g. "Wed 27 Feb • 7:15pm"
  summaryRight: string;    // e.g. "90 mins • 2 people"
  totalLabel: string;      // e.g. "$40.00 AUD"
  disabled?: boolean;
  loading?: boolean;
  buttonText: string;      // e.g. "Pay & Confirm"
  onClick: () => void;
};

export default function StickyCheckoutBar({
  title = "Review",
  summaryLeft,
  summaryRight,
  totalLabel,
  disabled,
  loading,
  buttonText,
  onClick,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* soft fade so content above looks clean */}
      <div className="h-10 bg-gradient-to-t from-emerald-950 to-transparent" />

      <div className="bg-emerald-950/95 backdrop-blur border-t border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-white/60">{title}</div>
            <div className="text-sm font-semibold">{summaryLeft}</div>
            <div className="text-xs text-white/70">{summaryRight}</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-white/60">Total</div>
            <div className="text-sm font-semibold">{totalLabel}</div>
          </div>

          <button
            disabled={disabled || loading}
            onClick={onClick}
            className={`ml-2 px-4 py-3 rounded-xl font-semibold whitespace-nowrap
              ${disabled || loading ? "bg-white/20 text-white/60 cursor-not-allowed" : "bg-white text-black hover:bg-white/90"}
            `}
          >
            {loading ? "Processing..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}