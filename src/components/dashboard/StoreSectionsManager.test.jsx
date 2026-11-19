import { render,screen,fireEvent,waitFor } from "@testing-library/react";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { expect,it,vi } from "vitest";
import StoreSectionsManager from "./StoreSectionsManager.jsx";
import api from "../../API/axiosInstance.js";
vi.mock("../../API/axiosInstance.js",()=>({default:{get:vi.fn(async()=>({showCover:true,showFeaturedProducts:true,premiumEnabled:true,offers:{},offersHeading:{}})),put:vi.fn(async()=>({})),post:vi.fn(async()=>({url:"/wwwroot/uploads/stores/s/categories/one.png"}))}}));
vi.mock("../../hooks/offers/useOffers.js",()=>({default:()=>({data:[{id:"o",type:1,name:"Office"}]})}));
it("uploads images and saves store-specific visibility and translations",async()=>{
 const view=render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><StoreSectionsManager storeId="s"/></QueryClientProvider>);
 fireEvent.click(await screen.findByLabelText("إظهار مختارات المتجر"));
 fireEvent.change(screen.getByLabelText("عنوان العرض — الإنجليزية"),{target:{value:"Premium Office"}});
 fireEvent.change(view.container.querySelector('input[type="file"]'),{target:{files:[new File(["photo"],"one.png",{type:"image/png"})]}});
 await waitFor(()=>expect(api.post).toHaveBeenCalled());
 await screen.findByRole("button",{name:"الرئيسية"});
 fireEvent.click(screen.getByRole("button",{name:"حفظ إعدادات الأقسام"}));
 await waitFor(()=>expect(api.put).toHaveBeenCalledWith("/api/Store/s/sections-settings",expect.objectContaining({showFeaturedProducts:false,offers:{o:expect.objectContaining({title:{E:"Premium Office"},images:["/wwwroot/uploads/stores/s/categories/one.png"]})}})));
});
