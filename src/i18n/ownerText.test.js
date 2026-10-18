import { expect, it } from "vitest";
import translations from "./ownerTranslations.json";
import { translateOwnerText } from "./ownerText.js";
it("provides nonempty English and Hebrew owner copy",()=>{
  for(const [source,row] of Object.entries(translations)) for(const language of ["E","I"]) {
    expect(row[language],source).toBeTruthy();
    expect(row[language],source).not.toMatch(/[\u0600-\u06ff]/);
  }
});
it("preserves merchant-authored names and Arabic source text",()=>{
  expect(translateOwnerText("I","alkarmel")).toBe("alkarmel");
  expect(translateOwnerText("A","الطلبات")).toBe("الطلبات");
});
