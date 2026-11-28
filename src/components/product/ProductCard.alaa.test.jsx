import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard.jsx";
vi.mock("../../hooks/offers/useOffers.js", () => ({ default: () => ({ data: [] }) }));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js", () => ({ default: () => ({ t: x => x }) }));
afterEach(cleanup);
const product = { id:"p", storeId:"s", name:"كتاب", categoryName:"الكتب", price:50, stockQuantity:3, trackInventory:true, isInStock:true };
it("adds one book from Alaa's compact plus button", async () => {
 const add = vi.fn().mockResolvedValue(true);
 render(<MemoryRouter><ProductCard product={product} storeSlug="alaa-rob" onAddToCart={add}/></MemoryRouter>);
 expect(screen.queryByRole("button", {name:"زيادة الكمية"})).toBeNull();
 fireEvent.click(screen.getByRole("button", {name:"أضف إلى السلة"}));
 await waitFor(() => expect(add).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({id:"p"}),1));
});
it("retains quantity controls for another store", () => {
 render(<MemoryRouter><ProductCard product={product} storeSlug="other" onAddToCart={vi.fn()}/></MemoryRouter>);
 expect(screen.getByRole("button", {name:"زيادة الكمية"})).toBeVisible();
});
