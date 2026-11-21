import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect, vi } from "vitest";
import StoreLocations from "./StoreLocations.jsx";
const state = vi.hoisted(()=>({ store: null }));
vi.mock("../../hooks/stores/useStoreBySlug.js",()=>({default:()=>({data:state.store})}));
vi.mock("../../hooks/storefront/useStorefrontLanguage.js",()=>({default:()=>({t:x=>x,language:"A"})}));
vi.mock("../../hooks/stores/useOwnerStorePreview.js",()=>({default:()=>({buildStorePreviewPath:x=>x})}));
vi.mock("../../theme/useStoreBranding.js",()=>({default:()=>{}}));
function open() { render(<MemoryRouter initialEntries={["/market/shop/locations"]}><Routes><Route path="/market/:slug/locations" element={<StoreLocations/>}/><Route path="/market/:slug" element={<p>Store home</p>}/></Routes></MemoryRouter>); }
it("hides direct access when locations are disabled by default",()=>{
 state.store={id:"1",slug:"shop",name:"Shop"}; open();
 expect(screen.getByText("Store home")).toBeInTheDocument();
});
it("shows enabled branches with safe map, phone and WhatsApp links",()=>{
 state.store={id:"1",slug:"shop",name:"Shop",appearance:{sections:{showLocations:true,locations:[{name:"Ramallah",address:"رام الله الشرفة",phone:"0568067006",whatsApp:"972528601833"}]}}}; open();
 expect(screen.getByRole("heading",{name:"Ramallah"})).toBeInTheDocument();
 expect(screen.getByRole("link",{name:/خرائط Google/})).toHaveAttribute("href","https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("رام الله الشرفة"));
 expect(screen.getByRole("link",{name:/واتساب/})).toHaveAttribute("href","https://wa.me/972528601833");
 expect(screen.getByRole("link",{name:/هاتف/})).toHaveAttribute("href","tel:0568067006");
});

it("embeds supplied coordinates and preserves the exact Google Maps link",()=>{
 const mapUrl="https://www.google.com/maps?q=31.9013979,35.206875&z=17&hl=en";
 state.store={id:"1",slug:"shop",name:"Shop",appearance:{sections:{showLocations:true,locations:[{name:"Ramallah",address:"Ramallah",mapUrl}]}}}; open();
 expect(screen.getByRole("link",{name:/خرائط Google/})).toHaveAttribute("href",mapUrl);
 const frame=screen.getByTitle("خريطة Ramallah");
 expect(new URL(frame.src).searchParams.get("q")).toBe("31.9013979,35.206875");
 expect(new URL(frame.src).searchParams.get("output")).toBe("embed");
});
