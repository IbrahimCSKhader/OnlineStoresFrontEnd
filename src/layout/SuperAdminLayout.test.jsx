import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import superAdminDashboardApi from "../API/superAdminDashboard.api.js";
import useAuth from "../hooks/auth/useAuth.js";
import SuperAdminLayout from "./SuperAdminLayout.jsx";

vi.mock("../API/superAdminDashboard.api.js", () => ({ default: { verifyPrivateAccess: vi.fn() } }));
vi.mock("../hooks/auth/useAuth.js", () => ({ default: vi.fn() }));
vi.mock("../hooks/auth/useLogout.js", () => ({ default: () => ({ mutate: vi.fn() }) }));

function LoginDestination() {
  const { state } = useLocation();
  return <p>Private login for {state?.redirectTo}</p>;
}

function openDashboard(role) {
  useAuth.mockReturnValue({
    isPlatformAuthenticated: Boolean(role),
    platformRole: role,
    platformToken: "test-token",
    platformUser: { id: "test-user", firstName: "Test" },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/dashboard/stores"]}>
        <Routes>
          <Route path="/secretelogin" element={<LoginDestination />} />
          <Route path="/dashboard" element={<SuperAdminLayout />}>
            <Route path="stores" element={<p>Protected store data</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  superAdminDashboardApi.verifyPrivateAccess.mockReset();
});

it.each([undefined, "StoreOwner"])("sends a visitor with role %s to private login", async (role) => {
  openDashboard(role);
  expect(await screen.findByText("Private login for /dashboard/stores")).toBeVisible();
  expect(screen.queryByText("Protected store data")).not.toBeInTheDocument();
  expect(superAdminDashboardApi.verifyPrivateAccess).not.toHaveBeenCalled();
});

it("keeps the dashboard closed for a SuperAdmin rejected by the server", async () => {
  const rejection = Object.assign(new Error("Forbidden"), { response: { status: 403 } });
  superAdminDashboardApi.verifyPrivateAccess.mockRejectedValue(rejection);
  openDashboard("SuperAdmin");
  expect(await screen.findByRole("alert")).toHaveTextContent("الدخول مخصص لحساب الإدارة المعتمد");
  expect(screen.queryByText("Protected store data")).not.toBeInTheDocument();
});

it("opens management sections after the server verifies the account", async () => {
  superAdminDashboardApi.verifyPrivateAccess.mockResolvedValue(true);
  openDashboard("SuperAdmin");
  expect(await screen.findByText("Protected store data")).toBeVisible();
  expect(superAdminDashboardApi.verifyPrivateAccess).toHaveBeenCalledWith("test-token", expect.any(AbortSignal));
  expect(screen.getByRole("link", { name: "الباقات" })).toHaveAttribute("href", "/dashboard/plans");
});
