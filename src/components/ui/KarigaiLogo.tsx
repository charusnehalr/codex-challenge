type KarigaiLogoProps = {
  size?: number;
  color?: string;
  mark?: boolean;
  tagline?: boolean;
};

export function KarigaiLogo({
  size = 22,
  color = "#1F1B16",
  mark = true,
  tagline = false,
}: KarigaiLogoProps) {
  const markSize = size * 1.28;
  const wordmarkSize = size * 1.45;

  return (
    <div className="inline-flex items-center gap-2 text-ink" style={{ color }}>
      {mark ? (
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          <path d="M7 4 V24" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M7 14 C 14 14, 18 9, 21 4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7 14 C 14 14, 18 19, 21 24"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="22.5" cy="4" r="1.4" fill={color} />
        </svg>
      ) : null}
      <span className="inline-flex flex-col leading-none">
        <span
          style={{
            fontFamily: "Instrument Serif, serif",
            fontStyle: "italic",
            fontSize: wordmarkSize,
          }}
        >
          karigai
        </span>
        {tagline ? (
          <span
            className="font-mono uppercase"
            style={{ fontSize: 9, letterSpacing: "0.18em", opacity: 0.55 }}
          >
            wellness, attuned
          </span>
        ) : null}
      </span>
    </div>
  );
}
