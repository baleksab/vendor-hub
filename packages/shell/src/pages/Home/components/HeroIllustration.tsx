const surface = {
  fill: "var(--mantine-color-body)",
  stroke: "var(--mantine-color-default-border)",
};
const muted = { fill: "var(--mantine-color-default-border)" };
const subtle = { fill: "var(--mantine-color-default-hover)" };
const accent = { fill: "var(--mantine-primary-color-filled)" };
const accentSoft = { fill: "var(--mantine-primary-color-light)" };

const CARD_WIDTH = 162;
const CARD_HEIGHT = 104;
const cards = [
  { x: 120, y: 64, highlighted: true },
  { x: 298, y: 64, highlighted: false },
  { x: 120, y: 184, highlighted: false },
  { x: 298, y: 184, highlighted: false },
];

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 320" role="presentation" aria-hidden width="100%" height="auto">
      <rect x="4" y="4" width="472" height="312" rx="12" style={surface} strokeWidth="1.5" />
      <path d="M4 44h472" style={{ stroke: surface.stroke }} strokeWidth="1.5" />
      {[26, 44, 62].map((cx) => (
        <circle key={cx} cx={cx} cy="24" r="5" style={muted} />
      ))}
      <rect x="150" y="16" width="180" height="16" rx="8" style={subtle} />

      <path d="M4 44h96v260a12 12 0 0 1-12 12H16a12 12 0 0 1-12-12z" style={subtle} />
      <rect x="20" y="64" width="64" height="10" rx="5" style={accentSoft} />
      <rect x="20" y="90" width="52" height="8" rx="4" style={muted} />
      <rect x="20" y="114" width="58" height="8" rx="4" style={muted} />
      <rect x="20" y="138" width="44" height="8" rx="4" style={muted} />

      {cards.map(({ x, y, highlighted }) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x}
            y={y}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            rx="8"
            style={surface}
            strokeWidth="1.5"
          />
          <circle cx={x + 26} cy={y + 28} r="12" style={highlighted ? accent : accentSoft} />
          <rect x={x + 46} y={y + 22} width="80" height="8" rx="4" style={muted} />
          <rect x={x + 16} y={y + 54} width="130" height="6" rx="3" style={subtle} />
          <rect x={x + 16} y={y + 68} width="100" height="6" rx="3" style={subtle} />
          <rect x={x + 16} y={y + 84} width="44" height="10" rx="5" style={accentSoft} />
        </g>
      ))}
    </svg>
  );
}
