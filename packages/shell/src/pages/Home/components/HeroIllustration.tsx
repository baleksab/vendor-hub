const surface = {
  fill: "var(--mantine-color-body)",
  stroke: "var(--mantine-color-default-border)",
};
const muted = { fill: "var(--mantine-color-default-border)" };
const subtle = { fill: "var(--mantine-color-default-hover)" };
const accent = { fill: "var(--mantine-primary-color-filled)" };
const accentSoft = { fill: "var(--mantine-primary-color-light)" };
const star = { fill: "var(--mantine-color-yellow-7)" };

const CARD_WIDTH = 140;
const CARD_HEIGHT = 124;
const CARD_Y = 176;
const cardXs = [16, 170, 324];
const STAR_COUNT = 5;
const STAR_RADIUS = 5;
const STAR_STEP = 13;
const STAR_POINTS = 10;

function starPoints(cx: number, cy: number) {
  return Array.from({ length: STAR_POINTS }, (_, index) => {
    const radius = index % 2 === 0 ? STAR_RADIUS : STAR_RADIUS / 2.4;
    const angle = (Math.PI / 5) * index - Math.PI / 2;

    return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 480 320" role="presentation" aria-hidden width="100%">
      <defs>
        <linearGradient id="hero-brand-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--mantine-color-brand-5)" }} />
          <stop offset="1" style={{ stopColor: "var(--mantine-color-brand-8)" }} />
        </linearGradient>
        <clipPath id="hero-window">
          <rect x="4" y="4" width="472" height="312" rx="12" />
        </clipPath>
      </defs>

      <rect x="4" y="4" width="472" height="312" rx="12" style={surface} strokeWidth="1.5" />

      <g clipPath="url(#hero-window)">
        <rect x="4" y="4" width="472" height="40" style={subtle} opacity="0.5" />
      </g>
      <path d="M4 44h472" style={{ stroke: surface.stroke }} strokeWidth="1.5" />

      <rect x="18" y="12" width="24" height="24" rx="7" fill="url(#hero-brand-mark)" />
      <text
        x="30"
        y="29"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fontFamily="inherit"
        fill="#fff"
      >
        V
      </text>
      <rect
        x="50"
        y="19"
        width="58"
        height="10"
        rx="5"
        style={{ fill: "var(--mantine-color-text)" }}
        opacity="0.85"
      />

      <rect x="126" y="13" width="50" height="22" rx="6" style={accentSoft} />
      <rect x="136" y="21" width="30" height="6" rx="3" style={accent} />
      <rect x="186" y="21" width="36" height="6" rx="3" style={muted} />
      <rect x="236" y="21" width="30" height="6" rx="3" style={muted} />

      <circle cx="404" cy="24" r="10" style={subtle} />
      <rect x="434" y="14" width="30" height="20" rx="10" style={subtle} />

      <rect
        x="16"
        y="60"
        width="116"
        height="12"
        rx="6"
        style={{ fill: "var(--mantine-color-text)" }}
        opacity="0.85"
      />
      <rect x="16" y="80" width="190" height="6" rx="3" style={muted} />

      <rect x="16" y="98" width="448" height="62" rx="8" style={surface} strokeWidth="1.5" />
      {[
        { x: 28, width: 132 },
        { x: 172, width: 100 },
        { x: 284, width: 100 },
      ].map(({ x, width }) => (
        <g key={x}>
          <rect x={x} y="108" width="40" height="4" rx="2" style={muted} />
          <rect x={x} y="118" width={width} height="28" rx="6" style={surface} strokeWidth="1.5" />
          <rect x={x + 10} y="129" width={width - 50} height="6" rx="3" style={subtle} />
        </g>
      ))}
      <rect x="398" y="118" width="54" height="28" rx="6" style={accent} />
      <rect x="412" y="129" width="26" height="6" rx="3" fill="#fff" opacity="0.85" />

      {cardXs.map((x, index) => (
        <g key={x}>
          <rect
            x={x}
            y={CARD_Y}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            rx="8"
            style={surface}
            strokeWidth="1.5"
          />
          <rect
            x={x + 14}
            y={CARD_Y + 14}
            width={72 + index * 10}
            height="9"
            rx="4.5"
            style={{ fill: "var(--mantine-color-text)" }}
            opacity="0.8"
          />

          {Array.from({ length: STAR_COUNT }, (_, starIndex) => (
            <polygon
              key={starIndex}
              points={starPoints(x + 19 + starIndex * STAR_STEP, CARD_Y + 38)}
              style={starIndex < 4 - (index % 2) ? star : muted}
            />
          ))}
          <rect x={x + 88} y={CARD_Y + 35} width="34" height="6" rx="3" style={subtle} />

          <rect x={x + 14} y={CARD_Y + 56} width="112" height="6" rx="3" style={muted} />
          <rect x={x + 14} y={CARD_Y + 68} width="96" height="6" rx="3" style={muted} />
          <rect x={x + 14} y={CARD_Y + 80} width="64" height="6" rx="3" style={muted} />

          <rect x={x + 14} y={CARD_Y + 98} width="38" height="14" rx="7" style={accentSoft} />
          <rect x={x + 58} y={CARD_Y + 98} width="30" height="14" rx="7" style={accentSoft} />
          <rect
            x={x + 94}
            y={CARD_Y + 98}
            width="22"
            height="14"
            rx="7"
            style={surface}
            strokeWidth="1.5"
          />
        </g>
      ))}
    </svg>
  );
}
