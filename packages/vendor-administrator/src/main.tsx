import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.layer.css";
import { cssVariablesResolver, theme } from "@vendor-hub/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

import VendorAdministrator from "./VendorAdministrator";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root element");
}

const handleUnauthorized = () => {
  console.error("The dev token was rejected by the API");
};

createRoot(container).render(
  <StrictMode>
    <ColorSchemeScript />
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      <BrowserRouter>
        <Routes>
          <Route
            path="manage/*"
            element={
              <VendorAdministrator
                locale="en"
                apiBaseUrl={window.location.origin}
                onUnauthorized={handleUnauthorized}
              />
            }
          />
          <Route path="*" element={null} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
