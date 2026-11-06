import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.layer.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { cssVariablesResolver, theme } from "@vendor-hub/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

import UserAdministrator from "./UserAdministrator";
import { createStandaloneQueryClient } from "./api/queryClient";
import "./index.css";

const queryClient = createStandaloneQueryClient();

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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="admin/*"
              element={
                <UserAdministrator
                  locale="en"
                  apiBaseUrl={window.location.origin}
                  onUnauthorized={handleUnauthorized}
                />
              }
            />
            <Route path="*" element={null} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
);
