import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

export default function AdminContactAccounts({
  accounts = [],
  emptyLabel = "لا توجد حسابات تواصل بعد.",
}) {
  if (!accounts.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {accounts.map((account, index) => {
        const key = account?.id || `${account?.platform || "contact"}-${index}`;
        const label = account?.label || account?.platform || "حساب تواصل";
        const username = account?.username ? `@${account.username}` : "";

        return (
          <Stack
            key={key}
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            sx={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              px: 1.5,
              py: 1.25,
              background:
                "color-mix(in srgb, var(--surface-muted) 74%, var(--surface-elevated))",
            }}
          >
            <Stack spacing={0.2}>
              <Typography variant="subtitle2">{label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {[account?.platform, username].filter(Boolean).join(" • ")}
              </Typography>
            </Stack>

            {account?.url ? (
              <Link
                href={account.url}
                target="_blank"
                rel="noreferrer"
                underline="none"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  fontWeight: 700,
                }}
              >
                فتح
                <OpenInNewRoundedIcon fontSize="inherit" />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
