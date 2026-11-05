import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

const clay: MantineColorsTuple = [
  "#fbf1ec",
  "#f4ddd2",
  "#ecc0ab",
  "#e4a183",
  "#dd8762",
  "#d97757",
  "#c96442",
  "#a94f33",
  "#873f29",
  "#66301f",
];

const gray: MantineColorsTuple = [
  "#f5f4ed",
  "#efede4",
  "#e8e6dc",
  "#dad8cc",
  "#c2c0b6",
  "#9c9a92",
  "#73726c",
  "#5e5d59",
  "#3d3d3a",
  "#141413",
];

const dark: MantineColorsTuple = [
  "#c2c0b6",
  "#b7b5a9",
  "#8a8880",
  "#6b6a64",
  "#4a4945",
  "#3a3935",
  "#30302e",
  "#262624",
  "#1f1e1d",
  "#191918",
];

const SERIF = 'ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, serif';

export const theme = createTheme({
  primaryColor: "clay",
  primaryShade: { light: 7, dark: 5 },
  colors: { clay, gray, dark },
  defaultRadius: "md",
  headings: { fontFamily: SERIF, fontWeight: "500" },
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: { "--mantine-color-body": "#faf9f5" },
  dark: {},
});
