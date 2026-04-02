import { Navigate, Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useAuth from "../../hooks/auth/useAuth.js";
import { getRoleLabel, isSuperAdminRole } from "../../utils/roles.js";
import StoresManagement from "./StoresManagement.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const { isAuthenticated, role, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!isSuperAdminRole(role)) {
    return <Navigate to="/market" replace />;
  }

  const displayName = user?.fullName || user?.name || user?.email || "سوبر أدمن";

  return (
    <Box className="admin-dashboard">
      <Paper className="admin-dashboard__hero" elevation={0}>
        <Stack spacing={1.15}>
          <Typography variant="overline" className="admin-dashboard__eyebrow">
            {getRoleLabel(role)}
          </Typography>
          <Typography variant="h3" component="h1" className="admin-dashboard__title">
            أهلًا {displayName}، إدارة السوق كلها هنا
          </Typography>
          <Typography variant="body1" color="text.secondary" className="admin-dashboard__lead">
            راقب المتاجر، أضف متاجر جديدة، وابقَ قريبًا من الصورة العامة للسوق من
            لوحة مرتبة وسهلة القراءة.
          </Typography>

          <Stack direction="row" spacing={1} className="admin-dashboard__actions">
            <Button component={RouterLink} to="/market" variant="contained">
              استعرض السوق
            </Button>
            <Button component={RouterLink} to="/market" variant="outlined">
              افتح صفحة المتاجر
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" className="admin-dashboard__notes">
            <Chip label="إدارة مركزية" variant="outlined" />
            <Chip label="متابعة واضحة" variant="outlined" />
            <Chip label="واجهة أنيقة" variant="outlined" />
          </Stack>
        </Stack>

        <Box className="admin-dashboard__aside">
          <Box className="admin-dashboard__chip">
            <Typography variant="caption" color="text.secondary">
              مستوى الإشراف
            </Typography>
            <Typography variant="h6">تحكم كامل</Typography>
          </Box>
          <Box className="admin-dashboard__chip">
            <Typography variant="caption" color="text.secondary">
              ما تتابعه الآن
            </Typography>
            <Typography variant="h6">المتاجر والحضور العام</Typography>
          </Box>
          <Box className="admin-dashboard__chip">
            <Typography variant="caption" color="text.secondary">
              حالة المساحة
            </Typography>
            <Typography variant="h6">جاهزة للعمل</Typography>
          </Box>
        </Box>
      </Paper>

      <StoresManagement />
    </Box>
  );
}
