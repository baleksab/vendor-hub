import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.layer.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Widget from "./Widget";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element");
}

createRoot(container).render(
  <StrictMode>
    <ColorSchemeScript />
    <MantineProvider>
      <Widget />
    </MantineProvider>
  </StrictMode>,
);
