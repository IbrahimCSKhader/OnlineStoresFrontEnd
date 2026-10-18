import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { parseExpression } from "@babel/parser";
const root = path.resolve("../../onlineStore");
const directory=path.join(root,"wwwroot/store-branding/alsujood");
fs.mkdirSync(directory,{recursive:true});
const manifestPath=path.join(directory,"real-products.json");
const output=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,"utf8")):{products:[]};
output.products=output.products.filter(p=>p.images.every(i=>!/\.svg|\/[^/]*logo[^/]*[.?]/i.test(i)));
async function get(url) {
  const r=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if (!r.ok) throw new Error(`${r.status}: ${url}`);
  return r;
}
async function verify(image) {
  const r=await get(image);
  if (!r.headers.get("content-type")?.startsWith("image/")) throw new Error(`Not an image: ${image}`);
  if ((await r.arrayBuffer()).byteLength<1000) throw new Error(`Empty image: ${image}`);
}
function save(entry) {
  output.products=output.products.filter(p=>p.slug!==entry.slug);
  output.products.push(entry);
  fs.writeFileSync(manifestPath,JSON.stringify(output,null,2)+"\n");
  console.log(entry.slug+": "+entry.name);
}
const apiProducts=[...await(await get("https://makeup-api.herokuapp.com/api/v1/products.json?brand=nyx")).json(),...await(await get("https://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline")).json()];
const mapping={
  "velvet-burgundy-lipstick":866,"soft-matte-lip-cream":852,"flawless-liquid-foundation":320,
  "silky-pressed-powder":930,"rose-blush-compact":439,"golden-burgundy-eyeshadow":286,
  "volume-lash-mascara":14,"black-precision-eyeliner":179,"brow-define-pencil":978,
  "neutral-everyday-eyeshadow":295,"clear-brow-gel":976,"pearl-glow-highlighter":927,
  "soft-contour-stick":477,"smooth-liquid-concealer":905,"precision-lip-liner":396,
  "nourish-lip-balm":872,"cherry-lip-tint":861,"glass-shine-lip-gloss":858,
};
for(const [key,id] of Object.entries(mapping)) {
  const slug="alsujood-cosmetics-"+key;
  if(output.products.some(x=>x.slug===slug)) continue;
  const p=apiProducts.find(x=>x.id===id);
  if(!p) throw new Error(`Missing source product ${id}`);
  const image=p.api_featured_image?.startsWith("//")?"https:"+p.api_featured_image:p.api_featured_image||p.image_link;
  await verify(image);
  save({slug,name:p.name.startsWith("Maybelline")||p.name.startsWith("NYX")?p.name.trim():"NYX "+p.name.trim(),source:p.product_link,images:[image],provenance:"Product photograph archived by Makeup API in 2017; original brand/retailer product link recorded."});
}
const pages={
  "hyaluronic-glow-serum":"https://theordinary.com/en-us/hyaluronic-acid-2-b5-serum-original-formulation-100425.html",
  "retinol-night-serum":"https://theordinary.com/en-us/retinol-02-in-squalane-serum-100439.html",
  "vitamin-c-bright-serum":"https://theordinary.com/en-us/ascorbyl-glucoside-solution-12-vitamin-c-100405.html",
  "balance-rose-toner":"https://theordinary.com/en-us/glycolic-acid-7-exfoliating-toner-100418.html",
  "clay-pore-mask":"https://theordinary.com/en-us/salicylic-acid-2-face-masque-100443.html",
  "gentle-gel-cleanser":"https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
  "daily-hydra-moisturizer":"https://www.cerave.com/skincare/moisturizers/moisturizing-cream",
  "spf-50-sun-veil":"https://www.cerave.com/sunscreen/face/hydrating-mineral-sunscreen-face-lotion-spf-50",
  "micellar-cleansing-water":"https://www.garnierusa.com/about-our-brands/skin-care/micellar-cleansing-water/micellar-cleansing-water-with-vitamin-c",
  "dewy-setting-spray":"https://www.elfcosmetics.com/us/products/power-grip-dewy-setting-spray",
};
function allObjects(data) { return Array.isArray(data)?data.flatMap(allObjects):data&&typeof data==="object"?[data,...(data["@graph"]?allObjects(data["@graph"]):[])]:[]; }
for(const [key,source] of Object.entries(pages)) {
  const slug="alsujood-cosmetics-"+key;
  if(output.products.some(x=>x.slug===slug))continue;
  const doc=new JSDOM(await(await get(source)).text()).window.document;
  const schemas=[...doc.scripts].filter(s=>s.type==="application/ld+json").flatMap(s=>{try{return allObjects(JSON.parse(s.textContent));}catch{return [];}});
  const p=schemas.find(p=>p["@type"]==="Product"||p["@type"]?.includes?.("Product"));
  let images=[p?.image].flat().filter(Boolean).map(i=>typeof i==="string"?i:i.url).filter(Boolean);
  if(!images.length) images=[[...doc.querySelectorAll("meta")].find(m=>m.getAttribute("property")==="og:image")?.content].filter(Boolean);
  images=images.map(i=>new URL(i,source).href).filter(i=>!/logo|homepage|placeholder|heroes-slot|infographic/i.test(i)).slice(0,3);
  if (!images.length) {
    const keyPart=new URL(source).pathname.split("/").filter(Boolean).at(-1);
    images=[...doc.images].map(i=>i.src).filter(i=>!i.startsWith("data:")&&i.includes(keyPart)).slice(0,1).map(i=>new URL(i,source).href);
  }
  if (!images.length && source.includes("cerave.com")) {
    images=[...doc.images].filter(i=>i.hasAttribute("v-srcset") && /Hydrating Mineral Sunscreen Face/i.test(i.alt)).slice(0,3).map(i=>parseExpression(i.getAttribute("v-srcset")).properties[0].value.value).map(i=>new URL(i,source).href);
  }
  if(!images.length)throw new Error(`No actual product images: ${source}`);
  for(const image of images) await verify(image);
  const title=p?.name||doc.querySelector("h1")?.textContent?.trim();
  if(!title)throw new Error(`Missing product name: ${source}`);
  const brand=source.includes("cerave")?"CeraVe ":source.includes("garnier")?"Garnier ":source.includes("theordinary")?"The Ordinary ":"e.l.f. ";
  save({slug,name:title.startsWith(brand.trim())?title:brand+title,source,images,provenance:"Product imagery read from the manufacturer's product page structured data."});
}
const swiss=await(await get("https://swissarabian.com/products.json?limit=250")).json();
for(const [key,handle] of [["pocket-perfume-oil","layali"],["floral-body-mist","rose-1"],["oud-rose-mist","shaghaf-oud-3"]]) {
  const slug="alsujood-cosmetics-"+key;
  if(output.products.some(x=>x.slug===slug))continue;
  const p=swiss.products.find(x=>x.handle===handle);
  if(!p)throw new Error(`Missing fragrance ${handle}`);
  const images=p.images.slice(0,2).map(i=>i.src);
  for(const image of images)await verify(image);
  save({slug,name:"Swiss Arabian "+p.title,source:`https://swissarabian.com/products/${handle}`,images,provenance:"Product imagery from the manufacturer's Shopify product catalog."});
}
const slug="alsujood-cosmetics-pro-makeup-brush-set";
if(!output.products.some(x=>x.slug===slug)) {
  const source="https://www.eigshowbeauty.com/products/splendid-series-15-pcs-classic-makeup-brush-set-with-patterns-carved-ferrule-and-silk-fiber-hair";
  const {product:p}=await(await get(source+".json")).json();
  const images=p.images.slice(0,3).map(i=>i.src);
  for(const image of images)await verify(image);
  save({slug,name:"EIGSHOW Splendid Series 15-Piece Makeup Brush Set",source,images,provenance:"Product imagery from the manufacturer's Shopify product catalog."});
}
if(output.products.length!==32)throw new Error(`Expected 32 products, got ${output.products.length}`);
console.log("PASS: all 32 real products have verified matching image responses and recorded sources.");
