import { ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

const ICON_SIZE = 20;
const BOX_SIZE = 40;

export type FeatureIconName = "store" | "bolt" | "blocks" | "globe";

const paths: Record<FeatureIconName, ReactNode> = {
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9h18v0a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  blocks: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M17.5 14v7M14 17.5h7" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>
  ),
};

export function FeatureIcon({ name }: { name: FeatureIconName }) {
  return (
    <ThemeIcon variant="light" size={BOX_SIZE} radius="md" aria-hidden>
      <svg
        width={ICON_SIZE}
        height={ICON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </svg>
    </ThemeIcon>
  );
}
