import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Box from "@mui/material/Box";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import LoadingState from "./components/common/loaders/LoadingState.jsx";
import AppThemeProvider from "./theme/AppThemeProvider.jsx";
import router from "./routes.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <RouterProvider
          router={router}
          fallbackElement={
            <Box className="storefront-page">
              <LoadingState label="جارٍ تجهيز الصفحة..." />
            </Box>
          }
        />
      </AppThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
