import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CheckoutForm from "./CheckoutForm.jsx";

vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({
  default: () => ({ t: (text) => text }),
}));
afterEach(cleanup);
const props = { step: 0, form: {}, onChange: vi.fn(), onNext: vi.fn(), onBack: vi.fn(), onSubmit: vi.fn() };
const locations = [{ id: "one", name: "Hebron", cost: 15.5 }, { id: "two", name: "Jerusalem", cost: 0 }];

describe("checkout delivery selection", () => {
  it.each([0, 1])("hides coupons from checkout step %s when disabled", (step) => {
    render(<CheckoutForm {...props} step={step} couponsEnabled={false} form={{ couponCode: "OLD" }} />);
    expect(screen.queryByText(/كود الخصم/)).not.toBeInTheDocument();
    expect(screen.queryByText("OLD")).not.toBeInTheDocument();
  });

  it("keeps coupons available by default for other stores", () => {
    render(<CheckoutForm {...props} />);
    expect(screen.getByLabelText("كود الخصم (اختياري)")).toBeInTheDocument();
  });
  it("does not request a selection when the store has no locations", () => {
    render(<CheckoutForm {...props} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التالي" })).toBeEnabled();
  });
  it("requires an explicit selection, even with a single available location", () => {
    render(<CheckoutForm {...props} deliveryLocations={[locations[0]]} />);
    expect(screen.getByRole("button", { name: "التالي" })).toBeDisabled();
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: /Hebron/ }));
    expect(props.onChange).toHaveBeenCalledWith("deliveryLocationId", "one");
  });
  it("accepts free delivery and shows the selection during review", () => {
    render(<CheckoutForm {...props} step={1} form={{ deliveryLocationId: "two" }} deliveryLocations={locations} />);
    expect(screen.getByText(/Jerusalem/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الطلب" })).toBeEnabled();
  });
  it("rejects a removed location instead of silently using free delivery", () => {
    render(<CheckoutForm {...props} form={{ deliveryLocationId: "removed" }} deliveryLocations={locations} />);
    expect(screen.getByRole("button", { name: "التالي" })).toBeDisabled();
  });
});
