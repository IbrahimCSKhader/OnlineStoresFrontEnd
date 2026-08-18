import { describe, expect, it } from "vitest";
import { normalizeOrderDetails } from "./orders.js";

describe("normalizeOrderDetails purchase points", () => {
  it("keeps order points and customer point balance from the API response", () => {
    const order = normalizeOrderDetails({
      id: "order-1",
      orderNumber: "ORD-1",
      pointsEarned: 40,
      customerPurchasePoints: 125,
      itemsCount: 8,
      totalAmount: 20,
    });

    expect(order.pointsEarned).toBe(40);
    expect(order.customerPurchasePoints).toBe(125);
  });
});
