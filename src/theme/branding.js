const imagePaletteCache = new Map();

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeHex(color) {
  if (!color) return "#000000";

  const value = String(color).trim();

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .slice(1)
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`.toUpperCase();
  }

  return "#000000";
}

export function hexToRgb(color) {
  const hex = normalizeHex(color).slice(1);

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;

  switch (max) {
    case nr:
      hue = (ng - nb) / delta + (ng < nb ? 6 : 0);
      break;
    case ng:
      hue = (nb - nr) / delta + 2;
      break;
    default:
      hue = (nr - ng) / delta + 4;
  }

  return {
    h: hue / 6,
    s: saturation,
    l: lightness,
  };
}

function hueToRgb(p, q, t) {
  let current = t;

  if (current < 0) current += 1;
  if (current > 1) current -= 1;
  if (current < 1 / 6) return p + (q - p) * 6 * current;
  if (current < 1 / 2) return q;
  if (current < 2 / 3) return p + (q - p) * (2 / 3 - current) * 6;
  return p;
}

export function hslToHex({ h, s, l }) {
  if (s === 0) {
    const value = l * 255;
    return rgbToHex({ r: value, g: value, b: value });
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return rgbToHex({
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  });
}

export function mixColors(first, second, weight = 0.5) {
  const amount = clamp(weight, 0, 1);
  const a = hexToRgb(first);
  const b = hexToRgb(second);

  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

export function lighten(color, amount = 0.2) {
  return mixColors(color, "#FFFFFF", amount);
}

export function darken(color, amount = 0.2) {
  return mixColors(color, "#000000", amount);
}

export function saturate(color, amount = 0.15) {
  const hsl = rgbToHsl(hexToRgb(color));
  return hslToHex({
    ...hsl,
    s: clamp(hsl.s + amount, 0, 1),
  });
}

export function desaturate(color, amount = 0.15) {
  const hsl = rgbToHsl(hexToRgb(color));
  return hslToHex({
    ...hsl,
    s: clamp(hsl.s - amount, 0, 1),
  });
}

function channelToLinear(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color) {
  const { r, g, b } = hexToRgb(color);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function pickTextColor(background, darkText = "#101418", lightText = "#FFFFFF") {
  return relativeLuminance(background) > 0.52 ? darkText : lightText;
}

export function withAlpha(color, alphaValue) {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alphaValue, 0, 1)})`;
}

export function colorFromString(value) {
  const source = String(value || "store-brand");
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = source.charCodeAt(index) + ((hash << 5) - hash);
  }

  return hslToHex({
    h: ((hash % 360) + 360) % 360 / 360,
    s: 0.56,
    l: 0.48,
  });
}

function shouldSkipPixel({ r, g, b, alpha }) {
  if (alpha < 160) return true;

  const { s, l } = rgbToHsl({ r, g, b });
  return l < 0.04 || l > 0.97 || (s < 0.05 && l > 0.9);
}

function quantizeChannel(value) {
  return Math.round(value / 24) * 24;
}

function scoreDominant(entry) {
  return entry.count * (1 + entry.saturation * 1.2);
}

function scoreVibrant(entry) {
  const lightnessBias = 1 - Math.abs(entry.lightness - 0.52);
  return entry.count * (0.6 + entry.saturation * 2.2 + lightnessBias);
}

function scoreMuted(entry) {
  return entry.count * (1.2 - entry.saturation + entry.lightness * 0.2);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}

export async function extractImagePalette(src) {
  if (!src || typeof window === "undefined") {
    return null;
  }

  if (imagePaletteCache.has(src)) {
    return imagePaletteCache.get(src);
  }

  const request = loadImage(src)
    .then((image) => {
      const canvas = document.createElement("canvas");
      const size = 36;
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        return null;
      }

      context.drawImage(image, 0, 0, size, size);

      let imageData;

      try {
        imageData = context.getImageData(0, 0, size, size);
      } catch {
        return null;
      }

      const buckets = new Map();

      for (let index = 0; index < imageData.data.length; index += 16) {
        const pixel = {
          r: imageData.data[index],
          g: imageData.data[index + 1],
          b: imageData.data[index + 2],
          alpha: imageData.data[index + 3],
        };

        if (shouldSkipPixel(pixel)) {
          continue;
        }

        const quantized = {
          r: quantizeChannel(pixel.r),
          g: quantizeChannel(pixel.g),
          b: quantizeChannel(pixel.b),
        };
        const key = `${quantized.r}-${quantized.g}-${quantized.b}`;
        const hsl = rgbToHsl(quantized);
        const current = buckets.get(key) ?? {
          color: rgbToHex(quantized),
          count: 0,
          saturation: hsl.s,
          lightness: hsl.l,
        };

        current.count += 1;
        buckets.set(key, current);
      }

      const entries = [...buckets.values()];

      if (!entries.length) {
        return null;
      }

      const dominant = [...entries].sort((a, b) => scoreDominant(b) - scoreDominant(a))[0];
      const vibrant = [...entries].sort((a, b) => scoreVibrant(b) - scoreVibrant(a))[0];
      const muted = [...entries].sort((a, b) => scoreMuted(b) - scoreMuted(a))[0];

      return {
        dominant: dominant.color,
        vibrant: vibrant.color,
        muted: muted.color,
      };
    })
    .catch(() => null);

  imagePaletteCache.set(src, request);
  return request;
}

export async function deriveStoreBranding({
  storeName,
  storeSlug,
  coverImage,
  logoImage,
}) {
  const seed = colorFromString(storeSlug || storeName || coverImage || logoImage);
  const [coverPalette, logoPalette] = await Promise.all([
    extractImagePalette(coverImage),
    extractImagePalette(logoImage),
  ]);

  const primarySeed = coverPalette?.dominant || seed;
  const accentSeed = logoPalette?.vibrant || coverPalette?.vibrant || saturate(seed, 0.18);
  const supportSeed =
    coverPalette?.muted ||
    logoPalette?.muted ||
    desaturate(lighten(seed, 0.12), 0.12);

  return {
    seed,
    primarySeed,
    accentSeed,
    supportSeed,
    coverPalette,
    logoPalette,
  };
}
