import { Anchor, Group } from "@mantine/core";
import type { ReactNode } from "react";
import { Link } from "react-router";

const CHEVRON_SIZE = 16;

type Props = { to: string; children: ReactNode };

export function BackLink({ to, children }: Props) {
  return (
    <Anchor component={Link} to={to} size="sm" w="fit-content">
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
    </Anchor>
  );
}
