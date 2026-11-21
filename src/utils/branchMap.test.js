import { expect, it } from "vitest";
import { branchMap } from "./branchMap.js";
it("preserves the Al Ram business search and map center",()=>{
 const mapUrl="https://www.google.com/maps/search/Nidal%20Jubeh/@31.8534,35.2385,17z?hl=en";
 const map=branchMap({mapUrl,address:"Al Ram"});
 expect(map.href).toBe(mapUrl);
 const embed=new URL(map.embed);
 expect(embed.searchParams.get("q")).toBe("Nidal Jubeh");
 expect(embed.searchParams.get("ll")).toBe("31.8534,35.2385");
});
it("falls back to the address for unsafe links and malformed search text",()=>{
 for(const mapUrl of ["javascript:alert(1)","https://evil.example/maps","https://www.google.com/maps/search/%ZZ"]){
  const map=branchMap({mapUrl,address:"Ramallah"});
  expect(new URL(map.embed).searchParams.get("q")).toBe("Ramallah");
  expect(new URL(map.href).hostname).toBe("www.google.com");
 }
});
