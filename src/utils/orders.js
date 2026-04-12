import { normalizeEntityResponse, normalizeListResponse } from "./collections.js";

function firstString(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

function firstNumber(...values) {
  for (const value of values) {
    const amount = Number(value);

    if (Number.isFinite(amount)) {
      return amount;
    }
  }

  return 0;
}

export function extractOrderItems(order) {
  const entity = normalizeEntityResponse(order) ?? order ?? {};

  return normalizeListResponse(
    entity?.items ||
      entity?.orderItems ||
      entity?.details ||
      entity?.orderDetails ||
      entity?.products,
  );
}

export function normalizeOrderItem(item, index = 0) {
  const product = item?.product || {};
  const variant = item?.variant || {};
  const quantity = firstNumber(item?.quantity, item?.qty, item?.count, 1);
  const unitPrice = firstNumber(
    item?.unitPrice,
    item?.price,
    item?.productPrice,
    product?.finalPrice,
    product?.price,
  );
  const totalPrice = firstNumber(
    item?.totalPrice,
    item?.lineTotal,
    item?.subtotal,
    item?.totalAmount,
    quantity * unitPrice,
  );

  return {
    ...item,
    id: firstString(item?.id, item?.orderItemId, item?.productId, `item-${index + 1}`),
    productId: firstString(item?.productId, product?.id),
    productName: firstString(item?.productName, item?.name, product?.name, `منتج ${index + 1}`),
    variantId: firstString(item?.variantId, variant?.id),
    variantName: firstString(item?.variantName, variant?.name),
    quantity,
    unitPrice,
    totalPrice,
  };
}

export function normalizeOrderDetails(data) {
  const entity = normalizeEntityResponse(data) ?? data ?? {};
  const items = extractOrderItems(entity).map((item, index) =>
    normalizeOrderItem(item, index),
  );
  const fallbackSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotal = firstNumber(
    entity?.subtotal,
    entity?.subTotal,
    entity?.originalTotal,
    entity?.itemsTotal,
    fallbackSubtotal,
  );
  const totalAmount = firstNumber(
    entity?.finalTotal,
    entity?.grandTotal,
    entity?.totalAmount,
    entity?.total,
    entity?.payableAmount,
    Math.max(subtotal, 0),
  );
  const discount = firstNumber(
    entity?.discount,
    entity?.discountAmount,
    entity?.couponDiscount,
    entity?.totalDiscount,
    Math.max(subtotal - totalAmount, 0),
  );

  return {
    ...entity,
    id: firstString(entity?.id, entity?.orderId),
    orderNumber: firstString(entity?.orderNumber, entity?.number, entity?.code, entity?.id, "-"),
    storeCustomerId: firstString(
      entity?.storeCustomerId,
      entity?.storeCustomerID,
      entity?.customerId,
      entity?.customer?.id,
      entity?.storeCustomer?.id,
    ),
    customerName: firstString(
      entity?.customerName,
      entity?.customer?.fullName,
      entity?.customer?.name,
      entity?.storeCustomerFullName,
      entity?.storeCustomer?.fullName,
      entity?.storeCustomer?.name,
    ),
    deliveryAddress: firstString(
      entity?.deliveryAddress,
      entity?.address,
      entity?.shippingAddress,
    ),
    deliveryCity: firstString(entity?.deliveryCity, entity?.city, entity?.shippingCity),
    deliveryPhone: firstString(entity?.deliveryPhone, entity?.phone, entity?.customerPhone),
    customerNotes: firstString(entity?.customerNotes, entity?.notes, entity?.orderNotes),
    couponCode: firstString(
      entity?.couponCode,
      entity?.coupon?.code,
      entity?.coupon,
      entity?.promoCode,
    ),
    items,
    itemsCount:
      firstNumber(entity?.itemsCount, entity?.totalItems) ||
      items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    discount,
    totalAmount: totalAmount || Math.max(subtotal - discount, 0),
    finalTotal: totalAmount || Math.max(subtotal - discount, 0),
    status: firstNumber(entity?.status, entity?.orderStatus, entity?.OrderStatus),
    statusText: firstString(entity?.statusText, entity?.statusLabel, entity?.orderStatusText),
    createdAt: firstString(entity?.createdAt, entity?.createdOn),
  };
}
