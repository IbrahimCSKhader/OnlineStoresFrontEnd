function asString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

export function serializeAuthFlowUser(user = null) {
  if (!user || typeof user !== "object") {
    return null;
  }

  return {
    id: asString(firstDefined(user.id, user.userId, user.sub)),
    email: asString(user.email),
    firstName: asString(firstDefined(user.firstName, user.givenName)),
    lastName: asString(firstDefined(user.lastName, user.familyName, user.surname)),
    role: asString(firstDefined(user.role, user.roles, user.accountType)),
    accountType: asString(user.accountType),
    storeId: asString(firstDefined(user.storeId, user.StoreId, user.store?.id)),
    storeCustomerId: asString(
      firstDefined(
        user.storeCustomerId,
        user.customerStoreId,
        user.CustomerStoreId,
      ),
    ),
  };
}

export function serializeAuthFlowStore(store = null) {
  if (!store || typeof store !== "object") {
    return null;
  }

  return {
    id: asString(firstDefined(store.id, store.storeId, store.StoreId)),
    name: asString(firstDefined(store.name, store.storeName, store.StoreName)),
    slug: asString(firstDefined(store.slug, store.storeSlug)),
    ownerId: asString(firstDefined(store.ownerId, store.owner?.id)),
    ownerEmail: asString(firstDefined(store.ownerEmail, store.owner?.email)),
  };
}

export function serializeAuthFlowError(error) {
  return {
    code: asString(error?.code),
    name: asString(error?.name),
    message: asString(error?.message),
    status: Number(error?.response?.status || 0),
    statusText: asString(error?.response?.statusText),
    apiMessage: asString(
      firstDefined(
        error?.response?.data?.message,
        error?.response?.data?.title,
        error?.response?.data?.error,
      ),
    ),
    responseData: error?.response?.data ?? null,
  };
}

export function logAuthFlow(event, details = {}) {
  console.log(`[AuthFlow] ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
