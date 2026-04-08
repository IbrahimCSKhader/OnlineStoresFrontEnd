import { jwtDecode } from "jwt-decode";

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
  const directUser = data?.user || data?.data?.user || data?.owner || data?.data?.owner;
  if (directUser) {
    return directUser;
  }

  const decodedToken = decodeJwtToken(token);
  const id = pickFirstValue(
    data?.storeCustomerId,
    data?.data?.storeCustomerId,
    data?.id,
    data?.data?.id,
    pickClaim(decodedToken, idKeys),
  );
  const email = pickFirstValue(data?.email, data?.data?.email, pickClaim(decodedToken, emailKeys));
  const firstName = pickFirstValue(
    data?.firstName,
    data?.data?.firstName,
    pickClaim(decodedToken, firstNameKeys),
  );
  const lastName = pickFirstValue(
    data?.lastName,
    data?.data?.lastName,
    pickClaim(decodedToken, lastNameKeys),
  );
  const storeId = pickFirstValue(
    data?.storeId,
    data?.data?.storeId,
    pickClaim(decodedToken, storeIdKeys),
  );
  const accountType = pickFirstValue(
    data?.accountType,
    data?.data?.accountType,
    pickClaim(decodedToken, accountTypeKeys),
  );

  if (!id && !email && !firstName && !lastName && !storeId && !accountType) {
    return null;
  }

  return {
    id: id ? String(id) : "",
    email: email ? String(email) : "",
    firstName: firstName ? String(firstName) : "",
    lastName: lastName ? String(lastName) : "",
    fullName: `${firstName || ""} ${lastName || ""}`.trim(),
    storeCustomerId: id ? String(id) : "",
    storeId: storeId ? String(storeId) : "",
    accountType: accountType ? String(accountType) : "",
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
