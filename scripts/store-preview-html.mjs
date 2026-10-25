function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function absoluteHttpUrl(value, baseUrl) {
  if (!value) return "";
  try {
    const url = new URL(String(value), baseUrl);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function renderStorePreview(template, store, { frontendUrl, assetUrl }) {
  const name = String(store.name || store.slug);
  const description = String(store.description || name).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240);
  const image = absoluteHttpUrl(store.logoUrl, assetUrl) || absoluteHttpUrl(store.coverImageUrl, assetUrl);
  const canonical = new URL(`/market/${encodeURIComponent(store.slug)}`, frontendUrl).href;
  const languages = { A: ["ar", "ar_AR", "rtl"], E: ["en", "en_US", "ltr"], H: ["he", "he_IL", "rtl"] };
  const [language, locale, direction] = languages[store.language] || languages.A;
  const meta = (key, value, attribute = "property") => `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  const tags = [
    `<title>${escapeHtml(name)}</title>`,
    meta("description", description, "name"),
    meta("og:type", "website"), meta("og:title", name), meta("og:site_name", name),
    meta("og:description", description), meta("og:url", canonical), meta("og:locale", locale),
    meta("twitter:card", "summary" , "name"), meta("twitter:title", name, "name"),
    meta("twitter:description", description, "name"),
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
  ];
  if (image) tags.push(
    meta("og:image", image), meta("og:image:alt", name),
    meta("twitter:image", image, "name"),
    `<link rel="icon" href="${escapeHtml(image)}" />`,
    `<link rel="apple-touch-icon" href="${escapeHtml(image)}" />`,
  );
  // Replace the platform metadata in the built shell, preserving React's scripts and styles.
  return template
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:name|property)\s*=\s*["'](?:og:[^"']*|twitter:[^"']*|description)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel\s*=\s*["'](?:icon|shortcut icon|apple-touch-icon|canonical)["'][^>]*>/gi, "")
    .replace(/<html\b[^>]*>/i, `<html lang="${language}" dir="${direction}">`)
    .replace(/<head\b[^>]*>/i, match => `${match}\n${tags.join("\n")}\n`);
}
