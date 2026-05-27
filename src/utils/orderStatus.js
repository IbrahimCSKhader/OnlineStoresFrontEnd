export const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: 5,
  RETURNED: 6,
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "معلق",
  [ORDER_STATUS.CONFIRMED]: "تم التأكيد",
  [ORDER_STATUS.PREPARING]: "قيد التجهيز",
  [ORDER_STATUS.SHIPPED]: "تم الشحن",
  [ORDER_STATUS.DELIVERED]: "تم التسليم",
  [ORDER_STATUS.CANCELLED]: "ملغي",
  [ORDER_STATUS.RETURNED]: "مسترجع",
};

export const ORDER_STATUS_OPTIONS = [
  { value: ORDER_STATUS.PENDING, label: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING] },
  { value: ORDER_STATUS.CONFIRMED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CONFIRMED] },
  { value: ORDER_STATUS.CANCELLED, label: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED] },
];

export function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[Number(status)] || "غير محدد";
}

export function getOrderStatusTone(status) {
  const normalizedStatus = Number(status);

  if (normalizedStatus === ORDER_STATUS.DELIVERED) {
    return "success";
  }

  if (
    normalizedStatus === ORDER_STATUS.CANCELLED ||
    normalizedStatus === ORDER_STATUS.RETURNED
  ) {
    return "error";
  }

  if (normalizedStatus >= ORDER_STATUS.CONFIRMED) {
    return "primary";
  }

  return "default";
}

export function resolveOrderStatusValue(payload = {}) {
  const candidates = [
    payload?.status,
    payload?.orderStatus,
    payload?.Status,
    payload?.OrderStatus,
  ];

  for (const value of candidates) {
    const normalizedValue = Number(value);

    if (Number.isFinite(normalizedValue)) {
      return normalizedValue;
    }
  }

  return null;
}

export function buildOrderStatusPayload(status, extra = {}) {
  const normalizedStatus = Number(status);

  if (!Number.isFinite(normalizedStatus)) {
    return { ...extra };
  }

  return {
    ...extra,
    status: normalizedStatus,
    orderStatus: normalizedStatus,
  };
}

export function normalizeOrderStatusPayload(payload = {}) {
  const normalizedStatus = resolveOrderStatusValue(payload);

  if (!Number.isFinite(normalizedStatus)) {
    return { ...payload };
  }

  return buildOrderStatusPayload(normalizedStatus, payload);
}
