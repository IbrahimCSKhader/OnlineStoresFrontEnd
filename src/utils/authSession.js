import { jwtDecode } from "jwt-decode";
import { isGuestRole, isStoreCustomerRole } from "./roles.js";

const roleKeys = [
  "role",
  "roles",
  "Role",
  "Roles",
  "userRole",
  "userRoles",
  "accountRole",
  "accountType",
  "account_type",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

const idKeys = [
  "store_customer_id",
  "storeCustomerId",
  "nameid",
  "nameidentifier",
  "sub",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

const emailKeys = [
  "email",
  "Email",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
];

const firstNameKeys = [
  "given_name",
  "givenName",
  "firstName",
  "FirstName",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
];

const lastNameKeys = [
  "family_name",
  "surname",
  "lastName",
  "LastName",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
];

const storeIdKeys = ["store_id", "storeId", "StoreId"];
const accountTypeKeys = ["account_type", "accountType", "AccountType"];
const storeCustomerIdKeys = [
  "store_customer_id",
  "storeCustomerId",
  "customerStoreId",
  "CustomerStoreId",
];

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const firstItem = value.find(Boolean);
      if (firstItem) return firstItem;
      continue;
    }

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

function decodeJwtToken(token) {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

function pickClaim(decodedToken, keys = []) {
  if (!decodedToken) return "";
  return pickFirstValue(...keys.map((key) => decodedToken?.[key]));
}

function resolveIdentitySource(data) {
  if (data && typeof data === "object") {
    return data?.user || data?.data?.user || data?.owner || data?.data?.owner || data;
  }

  return {};
}

function buildFullName(firstName, lastName, fallbackFullName) {
  const joined = [firstName, lastName]
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .join(" ")
    .trim();

  return joined || normalizeText(fallbackFullName);
}

function normalizeIdentity(source, decodedToken, fallback = {}) {
  const accountType = pickFirstValue(
    source?.accountType,
    source?.AccountType,
    fallback?.accountType,
    fallback?.data?.accountType,
    pickClaim(decodedToken, accountTypeKeys),
  );
  const storeId = pickFirstValue(
    source?.storeId,
    source?.StoreId,
    source?.store?.id,
    fallback?.storeId,
    fallback?.data?.storeId,
    pickClaim(decodedToken, storeIdKeys),
  );
  const storeCustomerId = pickFirstValue(
    source?.storeCustomerId,
    source?.customerStoreId,
    source?.CustomerStoreId,
    fallback?.storeCustomerId,
    fallback?.data?.storeCustomerId,
    pickClaim(decodedToken, storeCustomerIdKeys),
  );
  const id = pickFirstValue(
    source?.id,
    fallback?.id,
    fallback?.data?.id,
    storeCustomerId,
    pickClaim(decodedToken, idKeys),
  );
  const email = pickFirstValue(
    source?.email,
    source?.Email,
    fallback?.email,
    fallback?.data?.email,
    pickClaim(decodedToken, emailKeys),
  );
  const firstName = pickFirstValue(
    source?.firstName,
    source?.FirstName,
    source?.givenName,
    fallback?.firstName,
    fallback?.data?.firstName,
    pickClaim(decodedToken, firstNameKeys),
  );
  const lastName = pickFirstValue(
    source?.lastName,
    source?.LastName,
    source?.familyName,
    source?.surname,
    fallback?.lastName,
    fallback?.data?.lastName,
    pickClaim(decodedToken, lastNameKeys),
  );
  const fullName = buildFullName(
    firstName,
    lastName,
    pickFirstValue(
      source?.fullName,
      source?.name,
      fallback?.fullName,
      fallback?.name,
      decodedToken?.name,
    ),
  );

  if (!id && !email && !firstName && !lastName && !fullName && !storeId && !accountType) {
    return null;
  }

  return {
    ...(source && typeof source === "object" ? source : {}),
    id: normalizeText(id),
    email: normalizeText(email),
    firstName: normalizeText(firstName),
    lastName: normalizeText(lastName),
    fullName,
    storeCustomerId: normalizeText(storeCustomerId),
    storeId: normalizeText(storeId),
    accountType: normalizeText(accountType),
  };
}

function isStoreScopedIdentity(identity, fallbackRole = "") {
  if (!identity) {
    return false;
  }

  return (
    isStoreCustomerRole(identity.accountType) ||
    isGuestRole(identity.accountType) ||
    isStoreCustomerRole(fallbackRole) ||
    isGuestRole(fallbackRole) ||
    Boolean(identity.storeCustomerId) ||
    Boolean(identity.storeId)
  );
}

function coerceRoleValue(value) {
  if (Array.isArray(value)) {
    return coerceRoleValue(value.find(Boolean));
  }

  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    return String(
      value.name ||
        value.value ||
        value.role ||
        value.code ||
        value.displayName ||
        value.title ||
        "",
    );
  }

  return String(value);
}

export function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.data?.token ||
    data?.data?.accessToken ||
    ""
  );
}

export function extractUser(data, token = "") {
  const decodedToken = decodeJwtToken(token);
  const identitySource = resolveIdentitySource(data);
  const identity = normalizeIdentity(identitySource, decodedToken, data);

  if (!identity) {
    return null;
  }

  if (isStoreScopedIdentity(identity, identity.accountType)) {
    return {
      ...identity,
      storeCustomerId: normalizeText(identity.storeCustomerId || identity.id),
    };
  }

  return identity;
}

export function extractStorefrontCustomer(data, token = "") {
  const decodedToken = decodeJwtToken(token);
  const identity = normalizeIdentity(resolveIdentitySource(data), decodedToken, data);
  const fallbackRole = pickFirstValue(
    data?.role,
    data?.data?.role,
    data?.accountType,
    data?.data?.accountType,
    pickClaim(decodedToken, roleKeys),
  );

  if (!isStoreScopedIdentity(identity, fallbackRole)) {
    return null;
  }

  const storeCustomerId = normalizeText(identity?.storeCustomerId || identity?.id);

  return {
    ...identity,
    id: storeCustomerId || normalizeText(identity?.id),
    storeCustomerId,
    storeId: normalizeText(identity?.storeId),
    accountType: normalizeText(identity?.accountType || fallbackRole),
  };
}

export function extractRole(data, token, user) {
  const decodedToken = decodeJwtToken(token);
  const directCandidates = [
    data?.role,
    data?.roles,
    data?.data?.role,
    data?.data?.roles,
    user?.role,
    user?.roles,
    user?.userRole,
    user?.accountRole,
    user?.accountType,
    ...roleKeys.map((key) => decodedToken?.[key]),
  ];

  return coerceRoleValue(pickFirstValue(...directCandidates));
}
