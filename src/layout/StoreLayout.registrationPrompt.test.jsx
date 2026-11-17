import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import useStorefrontSession from "../hooks/auth/useStorefrontSession.js";
import useStoreBySlug from "../hooks/stores/useStoreBySlug.js";
import StoreLayout from "./StoreLayout.jsx";

vi.mock("../hooks/auth/useStorefrontSession.js", () => ({ default: vi.fn() }));
vi.mock("../hooks/stores/useStoreBySlug.js", () => ({ default: vi.fn() }));
vi.mock("../hooks/storefront/useStorefrontLanguage.js", () => ({
  default: () => ({ t: (text) => text, dir: "rtl", locale: "ar" }),
}));
vi.mock("../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false }) }));
vi.mock("../hooks/useStoreInstallManifest.js", () => ({ default: () => {} }));
vi.mock("../theme/useStoreBranding.js", () => ({ default: () => {} }));
vi.mock("../components/layout/Header/Header.jsx", () => ({
  default: ({ appNavbar }) => appNavbar ? <nav aria-label="App Navbar" /> : <header />,
}));
vi.mock("../components/layout/StoreFooter.jsx", () => ({ default: () => null }));

function openStore(path = "/market/first", enabled = true, themeTemplate) {
  useStoreBySlug.mockImplementation((slug) => ({
    data: { id: slug, slug, themeTemplate, enableCustomerRegistrationPrompt: enabled },
  }));
  return render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/market/:slug/*" element={<StoreLayout />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useStorefrontSession.mockReturnValue({ hasScopedStorefrontSession: false });
});

it.each([
  ["/market/sallabasket/products", "F", true],
  ["/market/another-store/products", "F", false],
  ["/market/jubeh-office-furniture", "O", true],
])("selects the storefront navigation for %s", (path, themeTemplate, appNavbar) => {
  openStore(path, false, themeTemplate);
  if (appNavbar) {
    expect(screen.getByRole("navigation", { name: "App Navbar" })).toBeVisible();
    expect(screen.queryByRole("banner")).toBeNull();
  } else {
    expect(screen.getByRole("banner")).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "App Navbar" })).toBeNull();
  }
});

it("shows Google signup once per store for a guest", async () => {
  const visit = openStore("/market/first/products");
  expect(screen.getByRole("dialog", { name: "سجل حسابك بضغطة زر للاستفادة من الميزات" })).toBeVisible();
  expect(screen.getByRole("button", { name: "التسجيل باستخدام Google" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "ليس الآن" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  visit.unmount();

  const revisit = openStore();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  revisit.unmount();

  openStore("/market/second");
  expect(screen.getByRole("dialog")).toBeVisible();
});

it("skips disabled stores, customers signed into this store, and registration pages", () => {
  const disabled = openStore("/market/first", false);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  disabled.unmount();

  useStorefrontSession.mockReturnValue({ hasScopedStorefrontSession: true });
  const signedIn = openStore();
  expect(useStorefrontSession).toHaveBeenCalledWith("first", "first");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  signedIn.unmount();
  useStorefrontSession.mockReturnValue({ hasScopedStorefrontSession: false });

  const registering = openStore("/market/first/register");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  registering.unmount();

  openStore();
  expect(screen.getByRole("dialog")).toBeVisible();
});
