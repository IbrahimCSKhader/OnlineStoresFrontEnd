import { expect, it } from "vitest";
import { exclusive, localized, availabilityText } from "./offerPresentation.js";
it("uses all three languages and the actual offer duration",()=>{
 expect(localized(exclusive,"A")).toBe("حصريًا هذا الأسبوع");
 expect(localized(exclusive,"E")).toBe("Exclusive this week");
 expect(localized(exclusive,"I")).toBe("בלעדי השבוע");
 expect(availabilityText("A",24)).toBe("متاح لمدة 24 ساعة فقط");
 expect(availabilityText("E",48)).toBe("Available for 48 hours only.");
 expect(availabilityText("I",24)).toBe("זמין ל-24 שעות בלבד.");
 expect(localized({A:"عنوان"},"I","fallback")).toBe("عنوان");
});
