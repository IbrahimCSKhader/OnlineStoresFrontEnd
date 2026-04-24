import { normalizeWhatsAppIdentifier } from "./storeContacts.js";

export const DEVELOPER_SUPPORT_NUMBER = "972515087853";
export const DEVELOPER_SUPPORT_DEFAULT_MESSAGE =
  "مرحبًا، أحتاج مساعدة بخصوص المتجر";

export function buildWhatsAppLink(phoneNumber, message) {
  const normalizedPhone = normalizeWhatsAppIdentifier(phoneNumber);

  if (!normalizedPhone) {
    return "";
  }

  const baseUrl = `https://wa.me/${normalizedPhone}`;
  const trimmedMessage = String(message || "").trim();

  if (!trimmedMessage) {
    return baseUrl;
  }

  return `${baseUrl}?text=${encodeURIComponent(trimmedMessage)}`;
}

export function getDeveloperSupportWhatsAppLink() {
  return buildWhatsAppLink(
    DEVELOPER_SUPPORT_NUMBER,
    DEVELOPER_SUPPORT_DEFAULT_MESSAGE,
  );
}
