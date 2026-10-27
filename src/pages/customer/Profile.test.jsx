import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import Profile from "./Profile.jsx";
import axiosInstance from "../../API/axiosInstance.js";

const state = vi.hoisted(() => ({ signedIn: true, data: { id: "customer", storeId: "store", firstName: "Old", lastName: "Name", email: "test@example.com", phone: "0591234567", address: "Old street", city: "City" } }));
vi.mock("../../hooks/stores/useStoreBySlug.js", () => ({ default: () => ({ data: { id: "store", slug: "demo" } }) }));
vi.mock("../../hooks/auth/useStorefrontSession.js", () => ({ default: () => ({ hasScopedStorefrontSession: state.signedIn }) }));
vi.mock("../../hooks/auth/useCustomerProfile.js", () => ({ default: () => ({ data: state.data }), customerProfileKey: (s, c) => ["customer-profile", s, c], customerProfileUrl: s => `/api/store-customer-auth/store/${s}/profile` }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: text => text, language: "A" }) }));
vi.mock("../../API/axiosInstance.js", () => ({ default: { put: vi.fn() } }));
beforeEach(() => { state.signedIn = true; axiosInstance.put.mockReset().mockResolvedValue({ data: state.data }); });
function show() { render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Profile /></MemoryRouter></QueryClientProvider>); }

it("lets a customer update contact details but keeps email read-only", async () => {
  show();
  expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toHaveAttribute("readonly");
  fireEvent.change(screen.getByRole("textbox", { name: /عنوان التوصيل/ }), { target: { value: "New address" } });
  fireEvent.click(screen.getByRole("button", { name: "حفظ المعلومات" }));
  await waitFor(() => expect(axiosInstance.put).toHaveBeenCalledWith("/api/store-customer-auth/store/store/profile", expect.objectContaining({ address: "New address" })));
  await screen.findByText("تم تحديث معلوماتك بنجاح");
  expect(axiosInstance.put.mock.calls[0][1].email).toBeUndefined();
});

it("shows the store login link for visitors without exposing profile data", () => {
  state.signedIn = false; show();
  expect(screen.getByRole("link", { name: "تسجيل الدخول" })).toHaveAttribute("href", "/market/demo/login");
  expect(screen.queryByDisplayValue("test@example.com")).not.toBeInTheDocument();
});
