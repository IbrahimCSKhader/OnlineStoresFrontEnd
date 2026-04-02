import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import "./NotFound.css";

export default function NotFound() {
  return (
    <Box className="page-not-found">
      <Paper className="page-not-found__panel" elevation={0}>
        <Box className="page-not-found__icon" aria-hidden>
          <SearchOffRoundedIcon />
        </Box>

        <Stack spacing={1.1}>
          <Typography variant="overline" className="page-not-found__eyebrow">
            الصفحة غير متاحة
          </Typography>
          <Typography variant="h2" component="h1" className="page-not-found__title">
            404
          </Typography>
          <Typography variant="body1" color="text.secondary" className="page-not-found__lead">
            يبدو أن الرابط الذي وصلت إليه غير موجود أو تم نقله. تستطيع العودة بسهولة
            إلى السوق ومتابعة التصفح من هناك.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Button component={RouterLink} to="/market" variant="contained">
            الذهاب إلى السوق
          </Button>
          <Button component={RouterLink} to="/" variant="outlined">
            العودة إلى الرئيسية
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
