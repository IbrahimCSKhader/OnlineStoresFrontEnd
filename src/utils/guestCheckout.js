export function buildGuestOrderItems(items) {
  return items.flatMap((item) => {
    if (!item.bundleOfferId) return [{ productId: item.productId, variantId: item.variantId || undefined, quantity: item.quantity }];
    const bundleGroupId = crypto.randomUUID();
    return (item.bundleComponents || []).map((component) => ({
      productId: component.productId, variantId: component.variantId || undefined,
      quantity: Number(component.requiredQuantity || component.bundleItemQuantity || 1) * item.quantity,
      bundleOfferId: item.bundleOfferId, bundleGroupId, bundleQuantity: item.quantity,
      bundleItemQuantity: Number(component.requiredQuantity || component.bundleItemQuantity || 1),
    }));
  });
}
