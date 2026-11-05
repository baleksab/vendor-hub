import {
  Card,
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

const cobalt: MantineColorsTuple = [
  "#eef4ff",
  "#d9e6ff",
  "#b3ccff",
  "#8cb0fb",
  "#6291f5",
  "#4a7df0",
  "#2f6feb",
  "#2559c4",
  "#1c449a",
  "#132f6e",
];

const gray: MantineColorsTuple = [
  "#fafafa",
  "#f3f3f3",
  "#e5e5e5",
  "#d4d4d4",
  "#a3a3a3",
  "#8a8a8a",
  "#6b6b6b",
  "#4d4d4d",
  "#2b2b2b",
  "#111111",
];

const dark: MantineColorsTuple = [
  "#d4d4d4",
  "#b8b8b8",
  "#8a8a8a",
  "#6b6b6b",
  "#3a3a3a",
  "#2b2b2b",
  "#222222",
  "#1a1a1a",
  "#141414",
  "#0e0e0e",
];

export const theme = createTheme({
  primaryColor: "cobalt",
  primaryShade: 6,
  colors: { cobalt, gray, dark },
  black: "#111111",
  fontFamily: "'Inter Variable', Inter, -apple-system, system-ui, sans-serif",
  fontFamilyMonospace: "ui-monospace, 'JetBrains Mono', monospace",
  defaultRadius: "md",
  radius: { lg: "12px" },
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "1.75rem", lineHeight: "1.2" },
      h2: { fontSize: "1.375rem", lineHeight: "1.2" },
      h3: { fontSize: "1.125rem", lineHeight: "1.2" },
    },
  },
  components: {
    Card: Card.extend({
      defaultProps: {
        radius: "lg",
        padding: "md",
        withBorder: true,
        bg: "light-dark(var(--mantine-color-white), var(--mantine-color-dark-6))",
      },
    }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: { "--mantine-color-body": "#fafafa" },
  dark: {},
});
