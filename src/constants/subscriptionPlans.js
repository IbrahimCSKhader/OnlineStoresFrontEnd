export const SUBSCRIPTION_PLANS = [
  {
    key: "free",
    label: "Free",
    nameAr: "الباقة المجانية",
    priceLabel: "مجاني",
    details: [
      "حتى 20 منتج",
      "حتى 2 صورة لكل منتج",
      "بدون Offers",
      "بدون Coupons",
      "بدون Analytics",
    ],
  },
  {
    key: "standard",
    label: "Standard",
    nameAr: "الباقة القياسية",
    priceLabel: "40 شيكل / شهر",
    details: [
      "حتى 100 منتج",
      "حتى 5 صور لكل منتج",
      "Offers",
      "Coupons",
      "Basic Analytics",
    ],
  },
  {
    key: "pro",
    label: "Pro",
    nameAr: "الباقة الاحترافية",
    priceLabel: "70 شيكل / شهر",
    details: [
      "منتجات غير محدودة",
      "صور غير محدودة",
      "Offers",
      "Coupons",
      "Analytics",
      "Advanced Offers",
      "Custom Domain",
    ],
  },
];

export function getSubscriptionPlanByKey(planKey) {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.key === String(planKey || "").toLowerCase(),
    ) || SUBSCRIPTION_PLANS[0]
  );
}
