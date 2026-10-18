const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net";
const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || API_BASE_URL;

export function resolveAssetUrl(path) {
  if (!path) return "";

  try {
    return new URL(path, ASSET_BASE_URL).toString();
  } catch {
    return path;
  }
}

export function resolveStoreCoverUrl(store) {
  if (!store) return "";

  const coverPath =
    store.coverImageUrl ||
    (store.id ? `/wwwroot/uploads/stores/${store.id}/branding/CoverPage.jpeg` : "");

  return resolveAssetUrl(coverPath);
}
