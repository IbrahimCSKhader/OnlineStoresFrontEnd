export const exclusive = { A: "حصريًا هذا الأسبوع", E: "Exclusive this week", I: "בלעדי השבוע" };
export function localized(values, language, fallback = "") { return values?.[language] || values?.A || values?.E || values?.I || fallback; }
export function availabilityText(language, hours) {
 const value = Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
 return language === "E" ? `Available for ${value} hours only.` : language === "I" ? `זמין ל-${value} שעות בלבד.` : `متاح لمدة ${value} ساعة فقط`;
}
