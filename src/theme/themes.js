import { alpha, createTheme } from "@mui/material/styles";
import { themeCatalog, tokens } from "./tokens.js";
import {
  lighten,
  pickTextColor,
  withAlpha,
} from "./branding.js";

export const THEME_VARIANTS = /** @type {const} */ (Object.keys(themeCatalog));

function buildMuiShadows(mode) {
  const shadowColor =
    mode === "dark"
      ? "rgba(0, 0, 0, 0.18)"
      : "rgba(15, 23, 42, 0.06)";

  return [
    "none",
    `0 1px 2px ${shadowColor}`,
    `0 2px 6px ${shadowColor}`,
    `0 3px 8px ${shadowColor}`,
    `0 4px 10px ${shadowColor}`,
    `0 5px 12px ${shadowColor}`,
    `0 6px 14px ${shadowColor}`,
    `0 7px 16px ${shadowColor}`,
    `0 8px 18px ${shadowColor}`,
    `0 9px 20px ${shadowColor}`,
    `0 10px 22px ${shadowColor}`,
    `0 11px 24px ${shadowColor}`,
    `0 12px 26px ${shadowColor}`,
    `0 13px 28px ${shadowColor}`,
    `0 14px 30px ${shadowColor}`,
    `0 15px 32px ${shadowColor}`,
    `0 16px 34px ${shadowColor}`,
    `0 17px 36px ${shadowColor}`,
    `0 18px 38px ${shadowColor}`,
    `0 19px 40px ${shadowColor}`,
    `0 20px 42px ${shadowColor}`,
    `0 21px 44px ${shadowColor}`,
    `0 22px 46px ${shadowColor}`,
    `0 23px 48px ${shadowColor}`,
    `0 24px 50px ${shadowColor}`,
  ];
}

function attachUtilityPalette(palette, isDark) {
  const inverseSurface = isDark ? palette.primary : palette.textPrimary;

  return {
    ...palette,
    buttonText: pickTextColor(palette.primary, "#111827", "#FFFFFF"),
    accentText: pickTextColor(palette.accent, "#111827", "#FFFFFF"),
    focusRing: withAlpha(palette.primary, isDark ? 0.26 : 0.16),
    pageGlowA: "transparent",
    pageGlowB: "transparent",
    navBackground: palette.surface,
    accentSoft: withAlpha(palette.accent, isDark ? 0.16 : 0.1),
    surfaceOverlay: palette.surface,
    surfaceInverse: inverseSurface,
    surfaceInverseHover: isDark
      ? lighten(inverseSurface, 0.04)
      : lighten(inverseSurface, 0.08),
    surfaceInverseText: pickTextColor(
      inverseSurface,
      isDark ? palette.background : "#111827",
      "#FFFFFF",
    ),
    surfacePanelSpotlight: withAlpha(palette.primary, isDark ? 0.08 : 0.03),
    gradientPanel: palette.surface,
    gradientSoftIcon: withAlpha(palette.primary, isDark ? 0.14 : 0.08),
    heroSheen: "transparent",
  };
}

function resolveBrandedPalette(preset, branding = null) {
  const base = preset.palette;
  const isDark = preset.mode === "dark";
  void branding;

  return attachUtilityPalette({ ...base }, isDark);
}

export function buildThemeProfile(variant = "light", branding = null) {
  const preset = themeCatalog[variant] ?? themeCatalog.light;
  const palette = resolveBrandedPalette(preset, branding);
  const isDark = preset.mode === "dark";

  const cssVars = {
    "--primary": palette.primary,
    "--secondary": palette.secondary,
    "--accent": palette.accent,
    "--status-success": palette.success,
    "--status-warning": palette.warning,
    "--status-error": palette.error,
    "--background": palette.background,
    "--surface": palette.surface,
    "--surface-muted": palette.surfaceAlt,
    "--surface-alt": palette.surfaceAlt,
    "--surface-elevated": palette.surfaceElevated,
    "--surface-contrast": palette.surfaceContrast,
    "--surface-overlay": palette.surfaceOverlay,
    "--text-primary": palette.textPrimary,
    "--text-secondary": palette.textSecondary,
    "--text-muted": palette.textMuted,
    "--border-subtle": withAlpha(palette.border, isDark ? 0.88 : 0.72),
    "--border-strong": palette.borderStrong,
    "--button-text": palette.buttonText,
    "--accent-text": palette.accentText,
    "--interactive-hover": palette.hover,
    "--interactive-active": palette.active,
    "--focus-ring": palette.focusRing,
    "--shadow-soft": preset.shadows.soft,
    "--shadow-medium": preset.shadows.medium,
    "--shadow-strong": preset.shadows.strong,
    "--page-glow-a": palette.pageGlowA,
    "--page-glow-b": palette.pageGlowB,
    "--nav-background": palette.navBackground,
    "--accent-soft": palette.accentSoft,
    "--surface-inverse": palette.surfaceInverse,
    "--surface-inverse-hover": palette.surfaceInverseHover,
    "--surface-inverse-text": palette.surfaceInverseText,
    "--surface-panel-spotlight": palette.surfacePanelSpotlight,
    "--gradient-panel": palette.gradientPanel,
    "--gradient-soft-icon": palette.gradientSoftIcon,
    "--hero-sheen": palette.heroSheen,
    "--gradient-page": preset.gradients.page,
    "--gradient-hero": preset.gradients.hero,
    "--gradient-accent": preset.gradients.accent,
    "--font-body": tokens.fontFamily,
    "--font-heading": tokens.fontFamilyHeading,
    "--max-width": `${tokens.layout.maxWidth}px`,
    "--grid-columns": String(tokens.layout.gridColumns),
    "--page-inset": tokens.layout.pageInset,
    "--space-1": `${tokens.spacingScale[1]}px`,
    "--space-2": `${tokens.spacingScale[2]}px`,
    "--space-3": `${tokens.spacingScale[3]}px`,
    "--space-4": `${tokens.spacingScale[4]}px`,
    "--space-5": `${tokens.spacingScale[5]}px`,
    "--space-6": `${tokens.spacingScale[6]}px`,
    "--space-7": `${tokens.spacingScale[7]}px`,
    "--space-8": `${tokens.spacingScale[8]}px`,
    "--space-9": `${tokens.spacingScale[9]}px`,
    "--space-10": `${tokens.spacingScale[10]}px`,
    "--space-11": `${tokens.spacingScale[11]}px`,
    "--space-12": `${tokens.spacingScale[12]}px`,
    "--section-padding": tokens.layout.sectionPadding,
    "--section-padding-compact": tokens.layout.sectionPaddingCompact,
    "--hero-padding": tokens.layout.heroPadding,
    "--card-padding": tokens.layout.cardPadding,
    "--panel-padding": tokens.layout.panelPadding,
    "--radius-sm": `${tokens.radii.sm}px`,
    "--radius-md": `${tokens.radii.md}px`,
    "--radius-lg": `${tokens.radii.lg}px`,
    "--radius-xl": `${tokens.radii.xl}px`,
    "--radius-xxl": `${tokens.radii.xxl}px`,
    "--transition-fast": `${tokens.motion.durationFast} ${tokens.motion.easing}`,
    "--transition-base": `${tokens.motion.durationBase} ${tokens.motion.easing}`,
    "--transition-slow": `${tokens.motion.durationSlow} ${tokens.motion.easing}`,
  };

  return {
    ...preset,
    palette,
    cssVars,
  };
}

const sharedTypography = {
  fontFamily: tokens.fontFamily,
  h1: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 800,
    fontSize: tokens.typography.sizes.h1,
    lineHeight: tokens.typography.lineHeights.tight,
    letterSpacing: tokens.typography.letterSpacing.h1,
  },
  h2: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 780,
    fontSize: tokens.typography.sizes.h2,
    lineHeight: tokens.typography.lineHeights.heading,
    letterSpacing: tokens.typography.letterSpacing.h2,
  },
  h3: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 760,
    fontSize: tokens.typography.sizes.h3,
    lineHeight: tokens.typography.lineHeights.heading,
    letterSpacing: tokens.typography.letterSpacing.h3,
  },
  h4: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 740,
    fontSize: tokens.typography.sizes.h4,
    lineHeight: tokens.typography.lineHeights.heading,
    letterSpacing: tokens.typography.letterSpacing.h4,
  },
  h5: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 700,
    fontSize: "1.125rem",
    lineHeight: 1.34,
    letterSpacing: 0,
  },
  h6: {
    fontFamily: tokens.fontFamilyHeading,
    fontWeight: 700,
    fontSize: "1rem",
    lineHeight: 1.4,
    letterSpacing: 0,
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.6,
  },
  subtitle2: {
    fontSize: tokens.typography.sizes.bodySm,
    fontWeight: 600,
    lineHeight: 1.6,
  },
  body1: {
    fontSize: tokens.typography.sizes.body,
    lineHeight: tokens.typography.lineHeights.body,
  },
  body2: {
    fontSize: tokens.typography.sizes.bodySm,
    lineHeight: 1.68,
  },
  button: {
    textTransform: "none",
    fontSize: "0.9375rem",
    fontWeight: 700,
    letterSpacing: 0,
  },
  caption: {
    fontSize: tokens.typography.sizes.caption,
    lineHeight: 1.6,
  },
  overline: {
    fontSize: tokens.typography.sizes.overline,
    fontWeight: 700,
    lineHeight: 1.6,
    letterSpacing: tokens.typography.letterSpacing.overline,
  },
};

export function createAppTheme(variant = "light", branding = null) {
  const profile =
    typeof variant === "object" && variant?.palette
      ? variant
      : buildThemeProfile(variant, branding);
  const { palette } = profile;
  const isDark = profile.mode === "dark";

  return createTheme({
    direction: "rtl",
    spacing: 4,
    breakpoints: {
      values: {
        xs: 0,
        sm: 640,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    shadows: buildMuiShadows(profile.mode),
    palette: {
      mode: profile.mode,
      primary: {
        main: palette.primary,
        contrastText: palette.buttonText,
      },
      secondary: {
        main: palette.secondary,
        contrastText: palette.textPrimary,
      },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary,
      },
      divider: palette.border,
      success: {
        main: palette.success,
      },
      warning: {
        main: palette.warning,
      },
      error: {
        main: palette.error,
      },
    },
    typography: sharedTypography,
    shape: {
      borderRadius: tokens.radii.lg,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: profile.mode,
          },
          html: {
            minHeight: "100%",
            backgroundColor: palette.background,
          },
          body: {
            minHeight: "100%",
            color: palette.textPrimary,
            backgroundColor: palette.background,
            backgroundImage: "none",
          },
          a: {
            color: "inherit",
            textDecoration: "none",
          },
          "::selection": {
            backgroundColor: withAlpha(palette.primary, isDark ? 0.34 : 0.18),
          },
          "::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: withAlpha(palette.primary, isDark ? 0.38 : 0.28),
            border: `2px solid ${withAlpha(palette.surfaceElevated, isDark ? 0.96 : 0.98)}`,
            borderRadius: 999,
          },
          "::-webkit-scrollbar-track": {
            backgroundColor: withAlpha(palette.primary, isDark ? 0.08 : 0.04),
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: "transparent",
        },
        styleOverrides: {
          root: {
            backgroundColor: "transparent",
            backgroundImage: "none",
            color: palette.textPrimary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: palette.surface,
            borderRadius: tokens.radii.lg,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 46,
            borderRadius: tokens.radii.sm,
            paddingInline: 18,
            boxShadow: "none",
            transition:
              "box-shadow var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)",
            "&:focus-visible": {
              boxShadow: `0 0 0 3px ${palette.focusRing}`,
            },
          },
          sizeSmall: {
            minHeight: 38,
            paddingInline: 14,
          },
          contained: {
            backgroundColor: palette.primary,
            color: palette.buttonText,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: lighten(palette.primary, isDark ? 0.06 : 0.04),
              boxShadow: "none",
            },
          },
          outlined: {
            borderColor: withAlpha(palette.borderStrong, isDark ? 0.72 : 0.58),
            backgroundColor: palette.surface,
            "&:hover": {
              borderColor: palette.borderStrong,
              backgroundColor: withAlpha(palette.primary, isDark ? 0.1 : 0.05),
            },
          },
          text: {
            color: palette.textPrimary,
            "&:hover": {
              backgroundColor: withAlpha(palette.primary, isDark ? 0.12 : 0.06),
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            height: 28,
            fontWeight: 600,
            borderColor: withAlpha(palette.borderStrong, isDark ? 0.5 : 0.38),
            backgroundColor: palette.surface,
          },
          filled: {
            backgroundColor: palette.accentSoft,
          },
          outlined: {
            backgroundColor: palette.surface,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radii.sm,
            transition:
              "background-color var(--transition-fast), border-color var(--transition-fast)",
            "&:hover": {
              backgroundColor: palette.hover,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 50,
            borderRadius: tokens.radii.md,
            backgroundColor: palette.surface,
            transition:
              "background-color var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)",
            "&:hover": {
              backgroundColor: palette.surface,
            },
            "&.Mui-focused": {
              backgroundColor: palette.surfaceElevated,
              boxShadow: `0 0 0 3px ${palette.focusRing}`,
            },
          },
          input: {
            paddingTop: 14,
            paddingBottom: 14,
            textAlign: "right",
            "&[type='password']": {
              direction: "ltr",
              textAlign: "left",
              fontFamily: '"Segoe UI", Tahoma, Arial, sans-serif',
              letterSpacing: "normal",
              fontVariantLigatures: "none",
              fontFeatureSettings: "normal",
              textRendering: "auto",
            },
          },
          notchedOutline: {
            borderColor: withAlpha(palette.border, isDark ? 0.86 : 0.72),
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: palette.textSecondary,
            fontWeight: 500,
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginInlineStart: 0,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            overflowX: "auto",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${withAlpha(palette.border, isDark ? 0.82 : 0.52)}`,
            paddingTop: 14,
            paddingBottom: 14,
          },
          head: {
            fontSize: tokens.typography.sizes.caption,
            fontWeight: 700,
            color: palette.textSecondary,
          },
          body: {
            fontSize: tokens.typography.sizes.body,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color var(--transition-fast)",
            "&.MuiTableRow-hover:hover": {
              backgroundColor: withAlpha(palette.primary, isDark ? 0.08 : 0.04),
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: withAlpha(palette.border, isDark ? 0.82 : 0.58),
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${withAlpha(palette.borderStrong, isDark ? 0.46 : 0.32)}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: palette.surface,
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: alpha("#000000", isDark ? 0.62 : 0.34),
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            "&.Mui-active": {
              color: palette.primary,
            },
            "&.Mui-completed": {
              color: palette.accent,
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: 4,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: 999,
            backgroundColor: palette.primary,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            fontWeight: 600,
            color: palette.textSecondary,
            "&.Mui-selected": {
              color: palette.textPrimary,
            },
          },
        },
      },
    },
  });
}
