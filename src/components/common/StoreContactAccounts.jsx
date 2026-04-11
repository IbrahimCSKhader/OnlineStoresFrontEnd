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
    color: "#ff4d8d",
    accent: "rgba(255, 77, 141, 0.16)",
    cardBackground:
      "linear-gradient(135deg, rgba(255, 77, 141, 0.18) 0%, rgba(255, 177, 208, 0.12) 100%)",
    cardBorder: "rgba(255, 77, 141, 0.28)",
    cardText: "#7c133d",
    cardMuted: "rgba(124, 19, 61, 0.72)",
  },
  TikTok: {
    icon: <MusicVideoRoundedIcon fontSize="small" />,
    color: "#ffffff",
    accent: "rgba(37, 244, 238, 0.16)",
    cardBackground:
      "linear-gradient(135deg, rgba(12, 12, 14, 0.98) 0%, rgba(24, 24, 28, 0.98) 100%)",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    cardText: "#ffffff",
    cardMuted: "rgba(255, 255, 255, 0.74)",
  },
  Facebook: {
    icon: <FacebookRoundedIcon fontSize="small" />,
    color: "#ffffff",
    accent: "rgba(24, 119, 242, 0.18)",
    cardBackground:
      "linear-gradient(135deg, rgba(24, 119, 242, 0.96) 0%, rgba(18, 91, 185, 0.98) 100%)",
    cardBorder: "rgba(24, 119, 242, 0.28)",
    cardText: "#ffffff",
    cardMuted: "rgba(255, 255, 255, 0.8)",
  },
  Snapchat: {
    icon: <CameraAltRoundedIcon fontSize="small" />,
    color: "#111111",
    accent: "rgba(255, 220, 77, 0.22)",
    cardBackground:
      "linear-gradient(135deg, rgba(255, 247, 184, 0.98) 0%, rgba(255, 236, 131, 0.96) 100%)",
    cardBorder: "rgba(176, 145, 0, 0.22)",
    cardText: "#2f2200",
    cardMuted: "rgba(47, 34, 0, 0.72)",
  },
  WhatsApp: {
    icon: <WhatsAppIcon fontSize="small" />,
    color: "#ffffff",
    accent: "rgba(37, 211, 102, 0.2)",
    cardBackground:
      "linear-gradient(135deg, rgba(37, 211, 102, 0.96) 0%, rgba(22, 163, 74, 0.98) 100%)",
    cardBorder: "rgba(37, 211, 102, 0.26)",
    cardText: "#ffffff",
    cardMuted: "rgba(255, 255, 255, 0.82)",
  },
};

function getPlatformVisual(platform) {
  return (
    PLATFORM_VISUALS[platform] || {
      icon: <OpenInNewRoundedIcon fontSize="small" />,
      color: "#334155",
      accent: "rgba(148, 163, 184, 0.14)",
      cardBackground:
        "linear-gradient(180deg, rgba(248, 249, 251, 0.98) 0%, rgba(242, 244, 247, 0.96) 100%)",
      cardBorder: "rgba(148, 163, 184, 0.2)",
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
                  boxShadow: "0 14px 28px rgba(22, 30, 38, 0.08)",
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
