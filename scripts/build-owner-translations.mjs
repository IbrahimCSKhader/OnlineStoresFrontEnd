import fs from "node:fs";
import { storefrontTextRows } from "../src/i18n/storefrontText.js";
const phrases = JSON.parse(fs.readFileSync("artifacts/owner-phrases.json","utf8"));
const output = JSON.parse(fs.readFileSync("src/i18n/ownerTranslations.json","utf8"));
const existing = new Map(storefrontTextRows.map(([a,e,i])=>[a,{E:e,I:i}]));
for (const source of phrases) if (existing.has(source)) output[source] = existing.get(source);
for (const [code,target] of [["E","en"],["I","he"]]) {
  const pending=phrases.filter(x=>!output[x]?.[code]);
  for (let start=0; start<pending.length; start+=12) {
    const batch=pending.slice(start,start+12);
    const response=await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=${target}&dt=t&q=${encodeURIComponent(batch.join("\n"))}`);
    if (!response.ok) throw new Error(`Translation response ${response.status}`);
    const data=await response.json();
    const lines=data[0].map(x=>x[0]).join("").trim().split(/\n/);
    if (lines.length!==batch.length) throw new Error(`Translation segment count mismatch at ${start}`);
    batch.forEach((source,index)=> { output[source] ||= {}; output[source][code]=lines[index].trim(); });
    fs.writeFileSync("src/i18n/ownerTranslations.json",JSON.stringify(output,null,2)+"\n");
  }
}
const overrides = {
  "قسم": ["section","מחלקה"], "بناء العروض السريعة": ["Manage quick promotions","ניהול מבצעים מהירים"],
  "يوجد طلبات تحتاج متابعة أو تأكيد": ["Orders need follow-up or confirmation","הזמנות דורשות מעקב או אישור"],
  "طلبات تحتاج متابعة أو تأكيد": ["Orders needing follow-up or confirmation","הזמנות הדורשות מעקב או אישור"],
  "الطلبات": ["Orders","הזמנות"], "الطلب": ["Order","הזמנה"], "حالة الطلب": ["Order status","סטטוס ההזמנה"],
  "تفاصيل الطلب": ["Order details","פרטי ההזמנה"], "رقم الطلب": ["Order number","מספר הזמנה"],
  "المنتجات": ["Products","מוצרים"], "المخزون": ["Inventory","מלאי"], "الفئات": ["Categories","קטגוריות"],
  "الأقسام": ["Sections","מחלקות"], "القسائم": ["Coupons","קופונים"], "العملاء": ["Customers","לקוחות"],
  "المراجعات": ["Reviews","ביקורות"], "الاشتراك": ["Subscription","מנוי"], "قيد التجهيز": ["Processing","בטיפול"],
  "قيد الانتظار": ["Pending","ממתינה"], "تم التأكيد": ["Confirmed","אושרה"], "تم الشحن": ["Shipped","נשלחה"],
  "تم التسليم": ["Delivered","נמסרה"], "ملغي": ["Cancelled","בוטלה"], "مسترجع": ["Returned","הוחזרה"],
  "قطعة": ["items","פריטים"], "عنصر": ["items","פריטים"], "الكمية:": ["Quantity:","כמות:"], "سعر الوحدة:": ["Unit price:","מחיר יחידה:"],
};
for(const [source,[E,I]] of Object.entries(overrides)) output[source]={E,I};
fs.writeFileSync("src/i18n/ownerTranslations.json",JSON.stringify(output,null,2)+"\n");
console.log(`Saved ${Object.keys(output).length} offline owner translations.`);
