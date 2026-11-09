import {
  ActionIcon,
  Badge,
  Button,
  Card,
  createTheme,
  type CSSVariablesResolver,
  Menu,
  NativeSelect,
  type MantineColorsTuple,
  Paper,
  Select,
  TextInput,
  Textarea,
  NumberInput,
  PasswordInput,
} from "@mantine/core";

const brand: MantineColorsTuple = [
  "#eef2ff",
  "#e0e7ff",
  "#c7d2fe",
  "#a5b4fc",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
];

const gray: MantineColorsTuple = [
  "#fafafa",
  "#f4f4f5",
  "#e4e4e7",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
  "#52525b",
  "#3f3f46",
  "#27272a",
  "#18181b",
];

const dark: MantineColorsTuple = [
  "#fafafa",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
  "#3f3f46",
  "#2a2a2e",
  "#1f1f23",
  "#0b0b0d",
  "#131316",
  "#050506",
];

const FONT_SANS =
  '"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  colors: { brand, gray, dark },
  black: "#18181b",
  fontFamily: FONT_SANS,
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSizes: { xs: "12px", sm: "14px", md: "15px", lg: "17px", xl: "20px" },
  lineHeights: { xs: "1.4", sm: "1.5", md: "1.6", lg: "1.6", xl: "1.5" },
  defaultRadius: "md",
  radius: { xs: "6px", sm: "8px", md: "10px", lg: "14px", xl: "20px" },
  shadows: {
    xs: "0 1px 2px rgba(24, 24, 27, 0.05)",
    sm: "0 1px 3px rgba(24, 24, 27, 0.06), 0 1px 2px rgba(24, 24, 27, 0.04)",
    md: "0 4px 12px rgba(24, 24, 27, 0.06), 0 2px 4px rgba(24, 24, 27, 0.04)",
    lg: "0 12px 28px rgba(24, 24, 27, 0.08), 0 4px 8px rgba(24, 24, 27, 0.04)",
    xl: "0 24px 48px rgba(24, 24, 27, 0.12)",
  },
  headings: {
    fontFamily: FONT_SANS,
    fontWeight: "650",
    sizes: {
      h1: { fontSize: "32px", lineHeight: "1.2" },
      h2: { fontSize: "24px", lineHeight: "1.25" },
      h3: { fontSize: "18px", lineHeight: "1.3" },
    },
  },
  components: {
    Button: Button.extend({
      defaultProps: { fw: 550 },
      styles: {
        root: { transition: "background-color 120ms, border-color 120ms, box-shadow 120ms" },
      },
    }),
    ActionIcon: ActionIcon.extend({ defaultProps: { radius: "md" } }),
    Card: Card.extend({
      defaultProps: { radius: "lg", shadow: "xs" },
    }),
    Paper: Paper.extend({ defaultProps: { radius: "lg" } }),
    Badge: Badge.extend({ defaultProps: { fw: 550 } }),
    Menu: Menu.extend({ defaultProps: { shadow: "lg", radius: "md" } }),
    TextInput: TextInput.extend({ defaultProps: { size: "md" } }),
    PasswordInput: PasswordInput.extend({ defaultProps: { size: "md" } }),
    Textarea: Textarea.extend({ defaultProps: { size: "md" } }),
    NumberInput: NumberInput.extend({ defaultProps: { size: "md" } }),
    NativeSelect: NativeSelect.extend({ defaultProps: { size: "md" } }),
    Select: Select.extend({ defaultProps: { size: "md" } }),
  },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--mantine-color-body": "#ffffff",
    "--mantine-color-default-border": "#e4e4e7",
    "--mantine-color-default-hover": "#f4f4f5",
    "--vh-surface-muted": "#fafafa",
    "--vh-hero-glow-a": "rgba(99, 102, 241, 0.16)",
    "--vh-hero-glow-b": "rgba(168, 85, 247, 0.12)",
    "--vh-header-bg": "rgba(255, 255, 255, 0.8)",
  },
  dark: {
    "--mantine-color-body": "#0b0b0d",
    "--mantine-color-default-border": "#2a2a2e",
    "--mantine-color-default-hover": "#1f1f23",
    "--vh-surface-muted": "#131316",
    "--vh-hero-glow-a": "rgba(99, 102, 241, 0.28)",
    "--vh-hero-glow-b": "rgba(168, 85, 247, 0.18)",
    "--vh-header-bg": "rgba(11, 11, 13, 0.8)",
  },
});
