export function isInquiryCartItem(item, store) {
  return item?.isPriceOnRequest === true ||
    (String(store?.themeTemplate || "").toUpperCase() === "K" && Number(item?.unitPrice) === 0);
}

export function hasInquiryCartItems(items, store) {
  return (items || []).some((item) => isInquiryCartItem(item, store));
}
