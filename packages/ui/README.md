# @vendor-hub/ui

Shared Mantine theme, design tokens and small common components for the shell and the remotes.

## Usage

```tsx
import { MantineProvider } from "@mantine/core";
import { cssVariablesResolver, theme, PageHeader } from "@vendor-hub/ui";
```

```css
@import "@vendor-hub/ui/tokens.css";
```

Components have no translations: every text comes in through props.

## Scripts

| Script      | What it does   |
| ----------- | -------------- |
| `typecheck` | `tsc --noEmit` |

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.
