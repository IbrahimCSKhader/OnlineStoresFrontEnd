const themeConfigs = {
  default: {
    defaultVariant: "light",
    availableVariants: ["light", "dark"],
  },
  pink: {
    defaultVariant: "pink",
    availableVariants: ["pink", "pink-dark"],
  },
  black: {
    defaultVariant: "black",
    availableVariants: ["black", "black-light"],
  },
  green: {
    defaultVariant: "nature",
    availableVariants: ["nature", "nature-dark"],
  },
  blue: {
    defaultVariant: "blue",
    availableVariants: ["blue", "blue-dark"],
  },
  brown: {
    defaultVariant: "brown",
    availableVariants: ["brown", "brown-dark"],
  },
  purple: {
    defaultVariant: "purple",
    availableVariants: ["purple", "purple-dark"],
  },
  gold: {
    defaultVariant: "gold",
    availableVariants: ["gold", "gold-dark"],
  },
  deepGreen: {
    defaultVariant: "deep-green",
    availableVariants: ["deep-green", "deep-green-dark"],
  },
  red: {
    defaultVariant: "red",
    availableVariants: ["red", "red-dark"],
  },
};

const legacyThemeBySlug = {
  "demo-brown-market": "n",
  "demo-deep-green-shop": "e",
  "demo-gold-gallery": "y",
  "demo-purple-boutique": "v",
  "demo-red-corner": "r",
  eman: "v",
  isra_essence: "y",
  nutellalab: "n",
};

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function resolveTemplate(store) {
  const template = normalize(store?.themeTemplate ?? store?.ThemeTemplate);
  const slug = normalize(store?.slug ?? store?.Slug);

  // Compatibility for the currently deployed API, which returns D for these
  // stores even though their persisted template codes are newer.
  return template === "d" && legacyThemeBySlug[slug]
    ? legacyThemeBySlug[slug]
    : template;
}

export function resolveStoreThemeConfig(store) {
  switch (resolveTemplate(store)) {
    case "p":
    case "pink":
      return themeConfigs.pink;
    case "b":
    case "black":
      return themeConfigs.black;
    case "g":
    case "f":
    case "forest":
    case "green":
      return themeConfigs.green;
    case "u":
    case "blue":
    case "azure":
      return themeConfigs.blue;
    case "n":
    case "brown":
      return themeConfigs.brown;
    case "v":
    case "purple":
      return themeConfigs.purple;
    case "y":
    case "gold":
    case "yellow":
      return themeConfigs.gold;
    case "e":
    case "deep-green":
    case "dark-green":
      return themeConfigs.deepGreen;
    case "r":
    case "red":
      return themeConfigs.red;
    case "dark":
    case "darl":
      return {
        ...themeConfigs.default,
        defaultVariant: "dark",
      };
    default:
      return themeConfigs.default;
  }
}
