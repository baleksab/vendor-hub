import { Group } from "@mantine/core";
import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from "react";

const CHEVRON_SIZE = 16;

const LINK_STYLE: CSSProperties = {
  color: "var(--mantine-color-anchor)",
  fontSize: "var(--mantine-font-size-sm)",
  textDecoration: "none",
  width: "fit-content",
};

type LinkProps = {
  to: string;
  style?: CSSProperties;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
};

type Props = {
  to: string;
  label: string;
  linkComponent: ComponentType<LinkProps>;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function BackLink({ to, label, linkComponent: Link, onClick }: Props) {
  return (
    <Link to={to} style={LINK_STYLE} onClick={onClick}>
      <Group gap={4} wrap="nowrap">
        <svg
          width={CHEVRON_SIZE}
          height={CHEVRON_SIZE}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {label}
      </Group>
    </Link>
  );
}
