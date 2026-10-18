import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { useResolvedOwnerLanguage as useOwnerLanguage } from "./useOwnerLanguage.js";
import useAuth from "../auth/useAuth.js";
import useOwnerStore from "../stores/useOwnerStore.js";

vi.mock("../auth/useAuth.js", () => ({ default: vi.fn() }));
vi.mock("../stores/useOwnerStore.js", () => ({ default: vi.fn() }));
const wrapper = route => function Wrapper({children}) { return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>; };
beforeEach(() => {
  localStorage.clear();
  useAuth.mockReturnValue({ isPlatformAuthenticated:true,platformRole:"StoreOwner",platformUser:{id:"owner1"} });
  useOwnerStore.mockReturnValue({ownerStore:{id:"store1",language:"I"}});
});
it("defaults to the store language on owner routes", () => {
  const {result}=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner/orders")});
  expect(result.current.language).toBe("I");
  expect(result.current.t("الطلبات")).toBe("הזמנות");
  expect(result.current.dir).toBe("rtl");
});
it("synchronizes a preference between owner views without changing the store language", async () => {
  const first=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner")});
  const second=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner/orders")});
  act(()=>first.result.current.setLanguage("E"));
  await waitFor(()=>expect(second.result.current.language).toBe("E"));
  expect(first.result.current.dir).toBe("ltr");
  expect(useOwnerStore().ownerStore.language).toBe("I");
  first.unmount();
  const restored=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner")});
  expect(restored.result.current.language).toBe("E");
});
it.each(["/market/shomanhome","/about"])("does not enable owner switching on %s", route => {
  const {result}=renderHook(useOwnerLanguage,{wrapper:wrapper(route)});
  expect(result.current.enabled).toBe(false);
  act(()=>result.current.setLanguage("E"));
  expect(localStorage.length).toBe(0);
});
it("does not allow customers to switch owner language", () => {
  useAuth.mockReturnValue({isPlatformAuthenticated:false,platformRole:"Customer"});
  const {result}=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner")});
  expect(result.current.enabled).toBe(false);
});
it("does not leak a preference to a different owner", () => {
  localStorage.setItem("mawja.owner.language:owner1:store1","E");
  useAuth.mockReturnValue({isPlatformAuthenticated:true,platformRole:"StoreOwner",platformUser:{id:"owner2"}});
  const {result}=renderHook(useOwnerLanguage,{wrapper:wrapper("/owner")});
  expect(result.current.language).toBe("I");
});
