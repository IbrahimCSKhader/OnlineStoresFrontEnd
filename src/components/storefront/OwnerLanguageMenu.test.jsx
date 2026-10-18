import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import OwnerLanguageMenu from "./OwnerLanguageMenu.jsx";
import { OwnerLanguageContext } from "../../hooks/storefront/OwnerLanguageContext.js";
import { getStorefrontLanguage } from "../../i18n/storefrontLanguages.js";
afterEach(cleanup);
it("has no language button for customers or unscoped visitors",()=>{
  render(<OwnerLanguageMenu />);
  expect(screen.queryByRole("button")).toBeNull();
});
it("allows an enabled store owner to select a language",()=>{
  const setLanguage=vi.fn();
  render(<OwnerLanguageContext.Provider value={{...getStorefrontLanguage("I"),language:"I",enabled:true,setLanguage}}><OwnerLanguageMenu /></OwnerLanguageContext.Provider>);
  fireEvent.click(screen.getByRole("button",{name:"שפה"}));
  fireEvent.click(screen.getByRole("menuitem",{name:"English"}));
  expect(setLanguage).toHaveBeenCalledWith("E");
});
