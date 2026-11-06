import { Anchor, Group } from "@mantine/core";
import type { ElementType, ReactNode } from "react";

const CHEVRON_SIZE = 16;

const LinkAnchor: ElementType = Anchor;

type Props = {
  to: string;
  linkComponent: ElementType;
  children: ReactNode;
};

export function BackLink({ to, linkComponent, children }: Props) {
  return (
    <LinkAnchor component={linkComponent} to={to} size="sm" w="fit-content">
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
        {children}
      </Group>
    </LinkAnchor>
  );
}
