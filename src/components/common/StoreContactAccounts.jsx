import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import MusicVideoRoundedIcon from "@mui/icons-material/MusicVideoRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import {
  buildStoreContactUrl,
  getStoreContactEntries,
} from "../../utils/storeContacts.js";

const PLATFORM_VISUALS = {
  Instagram: {
    icon: <InstagramIcon fontSize="small" />,
    color: "#d81b60",
    accent: "rgba(216, 27, 96, 0.16)",
    cardBackground:
      "linear-gradient(135deg, rgba(131, 58, 180, 0.2) 0%, rgba(253, 29, 29, 0.12) 52%, rgba(252, 176, 69, 0.16) 100%)",
    cardBorder: "rgba(216, 27, 96, 0.35)",
    cardText: "var(--text-primary)",
    cardMuted: "var(--text-secondary)",
  },
  TikTok: {
    icon: <MusicVideoRoundedIcon fontSize="small" />,
    color: "#ffffff",
    accent:
      "linear-gradient(135deg, rgba(37, 244, 238, 0.34), rgba(254, 44, 85, 0.34))",
    cardBackground:
      "linear-gradient(135deg, rgba(7, 7, 9, 1) 0%, rgba(14, 14, 18, 1) 100%)",
    cardBorder: "rgba(37, 244, 238, 0.34)",
    cardText: "#f9fafb",
    cardMuted: "rgba(236, 239, 241, 0.86)",
  },
  Facebook: {
    icon: <FacebookRoundedIcon fontSize="small" />,
    color: "#1877f2",
    accent: "rgba(24, 119, 242, 0.12)",
    cardBackground:
      "linear-gradient(135deg, rgba(24, 119, 242, 0.16), rgba(24, 119, 242, 0.06))",
    cardBorder: "rgba(24, 119, 242, 0.36)",
    cardText: "var(--text-primary)",
    cardMuted: "var(--text-secondary)",
  },
  Snapchat: {
    icon: <CameraAltRoundedIcon fontSize="small" />,
    color: "#d6b800",
    accent: "rgba(214, 184, 0, 0.14)",
    cardBackground:
      "linear-gradient(135deg, rgba(214, 184, 0, 0.2), rgba(214, 184, 0, 0.08))",
    cardBorder: "rgba(214, 184, 0, 0.34)",
    cardText: "var(--text-primary)",
    cardMuted: "var(--text-secondary)",
  },
  WhatsApp: {
    icon: <WhatsAppIcon fontSize="small" />,
    color: "#25d366",
    accent: "rgba(37, 211, 102, 0.14)",
    cardBackground:
      "linear-gradient(135deg, rgba(37, 211, 102, 0.2), rgba(37, 211, 102, 0.08))",
    cardBorder: "rgba(37, 211, 102, 0.34)",
    cardText: "var(--text-primary)",
    cardMuted: "var(--text-secondary)",
  },
};

function getPlatformVisual(platform) {
  return (
    PLATFORM_VISUALS[platform] || {
      icon: <OpenInNewRoundedIcon fontSize="small" />,
      color: "var(--text-secondary)",
      accent:
        "color-mix(in srgb, var(--surface-muted) 78%, var(--surface-elevated))",
      cardBackground:
        "linear-gradient(180deg, color-mix(in srgb, var(--surface) 88%, white) 0%, var(--surface) 100%)",
      cardBorder: "var(--border-subtle)",
      cardText: "var(--text-primary)",
      cardMuted: "var(--text-secondary)",
    }
  );
}

function getAccountLabel(account) {
  return String(account?.label || account?.platform || "حساب تواصل").trim();
}

function getAccountValue(account) {
  const displayValue = String(account?.displayValue || "").trim();

  if (displayValue) {
    return displayValue;
  }

  const username = String(account?.username || "").trim();
  return username ? `@${username}` : "";
}

export default function StoreContactAccounts({
  accounts,
  store,
  title = "حسابات التواصل",
  emptyLabel = "لا توجد حسابات تواصل بعد.",
  showTitle = true,
  layout = "cards",
  hideWhenEmpty = true,
  className = "",
}) {
  const resolvedAccounts = Array.isArray(accounts)
    ? accounts
    : getStoreContactEntries(store);

  if (!resolvedAccounts.length) {
    if (hideWhenEmpty) {
      return null;
    }

    return (
      <Typography variant="body2" color="text.secondary" className={className}>
        {emptyLabel}
      </Typography>
    );
  }

  const isCompact = layout === "compact";

  return (
    <Stack spacing={1.5} className={className}>
      {showTitle && title ? (
        <Typography variant="h5" component="h3">
          {title}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isCompact
            ? "repeat(auto-fit, minmax(180px, 1fr))"
            : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: isCompact ? 1 : 1.25,
        }}
      >
        {resolvedAccounts.map((account, index) => {
          const key =
            account?.id || `${account?.platform || "contact"}-${index}`;
          const label = getAccountLabel(account);
          const value = getAccountValue(account);
          const platformVisual = getPlatformVisual(account?.platform);
          const href =
            String(account?.url || "").trim() ||
            buildStoreContactUrl(account?.platform, account?.username);

          return (
            <Link
              key={key}
              component={href ? "a" : "div"}
              href={href || undefined}
              target={href ? "_blank" : undefined}
              rel={href ? "noreferrer noopener" : undefined}
              underline="none"
              sx={{
                display: "grid",
                gap: isCompact ? 0.75 : 1,
                alignContent: "start",
                border: `1px solid ${platformVisual.cardBorder}`,
                borderRadius: isCompact ? "16px" : "18px",
                padding: isCompact ? "12px 14px" : "18px",
                color: platformVisual.cardText,
                background: platformVisual.cardBackground,
                transition:
                  "transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)",
                boxShadow: "var(--shadow-xs)",
                "&:hover": {
                  transform: "translateY(-1px)",
                  borderColor: platformVisual.color,
                  boxShadow: "var(--shadow-sm)",
                },
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  aria-hidden
                  sx={{
                    width: isCompact ? 40 : 52,
                    height: isCompact ? 40 : 52,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: isCompact ? "14px" : "18px",
                    color: platformVisual.color,
                    background: platformVisual.accent,
                    flexShrink: 0,
                  }}
                >
                  {platformVisual.icon}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant={isCompact ? "subtitle2" : "h6"}
                    component="div"
                    sx={{
                      color: platformVisual.color,
                      lineHeight: 1.25,
                    }}
                  >
                    {label}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: "break-word",
                      color: platformVisual.cardMuted,
                    }}
                  >
                    {value || account?.platform}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }} />

                <Box
                  aria-hidden
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "999px",
                    color: platformVisual.color,
                    background:
                      "color-mix(in srgb, currentColor 10%, transparent)",
                    flexShrink: 0,
                  }}
                >
                  <OpenInNewRoundedIcon fontSize="inherit" />
                </Box>
              </Stack>
            </Link>
          );
        })}
      </Box>
    </Stack>
  );
}
