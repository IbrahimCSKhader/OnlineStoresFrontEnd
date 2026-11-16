import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Navbar from "./Navbar.jsx";
import { getStorefrontLanguage } from "../../i18n/storefrontLanguages.js";

const state = vi.hoisted(() => ({ compact: true, owner: false, switching: true, setLanguage: vi.fn(), setVariant: vi.fn() }));
vi.mock("@mui/material/useMediaQuery", () => ({ default: () => state.compact }));
vi.mock("../../theme/AppThemeProvider.jsx", () => ({ useAppThemeVariant: () => ({ variant: "light", availableVariants: ["light", "dark"], setVariant: state.setVariant }) }));
vi.mock("../../hooks/auth/useAuth.js", () => ({ default: () => ({ isAuthenticated: state.owner, isPlatformAuthenticated: state.owner, platformRole: state.owner ? "StoreOwner" : "", platformUser: state.owner ? { id: "owner" } : null }) }));
vi.mock("../../hooks/cart/useCart.js", () => ({ default: () => ({ data: null }) }));
vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/auth/useLogout.js", () => ({ default: () => ({ mutate: vi.fn() }) }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "store", slug: "demo", name: "متجر باسم طويل", logoUrl: "/logo.png" } }) }));
vi.mock("../../hooks/stores/useOwnerStore.js", () => ({ default: () => ({ ownerStore: { id: "store", slug: "demo", name: "متجر باسم طويل", logoUrl: "/logo.png" } }) }));
vi.mock("../../hooks/stores/useOwnerStorePreview.js", () => ({ default: () => ({ isOwnerPreview: false, buildStorePreviewPath: path => path }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: false, useLocalGuestCart: true }) }));
vi.mock("../../hooks/useDocumentBranding.js", () => ({ default: () => {} }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ ...getStorefrontLanguage("A"), language: "A", canSwitchLanguage: state.switching && !state.owner, t: text => text, setLanguage: state.setLanguage }) }));
vi.mock("../../hooks/storefront/useOwnerLanguage.js", () => ({ default: () => ({ ...getStorefrontLanguage("A"), language: "A", enabled: state.owner, t: text => text, setLanguage: state.setLanguage }) }));
afterEach(cleanup);
beforeEach(() => { state.compact = true; state.owner = false; state.switching = true; vi.clearAllMocks(); });
const show = path => render(<MemoryRouter initialEntries={[path]}><Navbar /></MemoryRouter>);

it.each(["/", "/market/demo", "/owner"])("moves preferences into the compact menu on %s", path => {
  state.owner = path === "/owner";
  show(path);
  const header = screen.getByRole("banner");
  expect(within(header).queryByRole("button", { name: "الثيمات" })).toBeNull();
  expect(within(header).queryByRole("button", { name: "اللغة" })).toBeNull();
  expect(header.querySelector("img")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "فتح القائمة" }));
  const drawer = document.getElementById("store-navigation-drawer");
  expect(within(drawer).getByRole("button", { name: "الثيمات" })).toBeVisible();
  fireEvent.click(within(drawer).getByRole("button", { name: "اللغة" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "English" }));
  expect(state.setLanguage).toHaveBeenCalledWith("E");
  fireEvent.click(within(drawer).getByRole("button", { name: "الثيمات" }));
  fireEvent.click(screen.getByRole("button", { name: "ليلي" }));
  expect(state.setVariant).toHaveBeenCalledWith("dark");
});
it("keeps desktop preferences in the header", () => {
  state.compact = false;
  show("/market/demo");
  const header = screen.getByRole("banner");
  expect(within(header).getByRole("button", { name: "الثيمات" })).toBeVisible();
  expect(within(header).getByRole("button", { name: "اللغة" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "فتح القائمة" })).toBeNull();
});
it("does not add a language selector to a store with switching disabled", () => {
  state.switching = false;
  show("/market/demo");
  fireEvent.click(screen.getByRole("button", { name: "فتح القائمة" }));
  expect(screen.queryByRole("button", { name: "اللغة" })).toBeNull();
  expect(screen.getByRole("button", { name: "الثيمات" })).toBeVisible();
});
