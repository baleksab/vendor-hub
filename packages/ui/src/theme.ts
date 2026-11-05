import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

const primer: MantineColorsTuple = [
  "#ddf4ff",
  "#b6e3ff",
  "#80ccff",
  "#54aeff",
  "#218bff",
  "#0969da",
  "#0550ae",
  "#033d8b",
  "#0a3069",
  "#002155",
];

const gray: MantineColorsTuple = [
  "#f6f8fa",
  "#eaeef2",
  "#d8dee4",
  "#d0d7de",
  "#afb8c1",
  "#8c959f",
  "#656d76",
  "#424a53",
  "#32383f",
  "#1f2328",
];

const dark: MantineColorsTuple = [
  "#e6edf3",
  "#c9d1d9",
  "#8b949e",
  "#6e7681",
  "#484f58",
  "#30363d",
  "#21262d",
  "#0d1117",
  "#161b22",
  "#010409",
];

export const theme = createTheme({
  primaryColor: "primer",
  primaryShade: 5,
  colors: { primer, gray, dark },
  black: "#1f2328",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSizes: { xs: "12px", sm: "13px", md: "14px", lg: "16px", xl: "20px" },
  lineHeights: { md: "1.5" },
  defaultRadius: "md",
  radius: { md: "6px", lg: "6px" },
  headings: {
    fontWeight: "600",
    sizes: {
      h1: { fontSize: "24px", lineHeight: "1.25" },
      h2: { fontSize: "20px", lineHeight: "1.25" },
      h3: { fontSize: "16px", lineHeight: "1.25" },
    },
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: { "--mantine-color-default-border": "#30363d" },
});
