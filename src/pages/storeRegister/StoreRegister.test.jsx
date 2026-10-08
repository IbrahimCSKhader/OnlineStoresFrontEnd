import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import storeApi from "../../API/store.api.js";
import StoreRegister from "./StoreRegister.jsx";

vi.mock("../../API/store.api.js", () => ({
  default: { recordRegistrationVisit: vi.fn() },
}));

function renderPage() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <StoreRegister />
      </MemoryRouter>
    </StrictMode>,
  );
}

describe("StoreRegister page visits", () => {
  beforeEach(() => {
    storeApi.recordRegistrationVisit.mockReset();
    storeApi.recordRegistrationVisit.mockResolvedValue({ status: 204 });
  });

  it("records one visit in StrictMode and counts a new page entry", async () => {
    const firstPage = renderPage();
    await waitFor(() => expect(storeApi.recordRegistrationVisit).toHaveBeenCalledTimes(1));
    firstPage.unmount();
    renderPage();
    await waitFor(() => expect(storeApi.recordRegistrationVisit).toHaveBeenCalledTimes(2));
  });

  it("keeps tracking failures silent without blocking the form", async () => {
    storeApi.recordRegistrationVisit.mockRejectedValue(new Error("Tracking unavailable"));
    renderPage();
    await waitFor(() => expect(storeApi.recordRegistrationVisit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(0);
  });
});
