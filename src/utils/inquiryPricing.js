export function isInquiryCartItem(item, store) {
  return item?.isPriceOnRequest === true ||
    (["K", "A"].includes(String(store?.themeTemplate || "").toUpperCase()) && Number(item?.unitPrice) === 0);
}

export function hasInquiryCartItems(items, store) {
  return (items || []).some((item) => isInquiryCartItem(item, store));
}
