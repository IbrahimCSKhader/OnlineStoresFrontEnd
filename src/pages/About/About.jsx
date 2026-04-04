import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import "./About.css";

const values = [
  {
    icon: <AccessTimeRoundedIcon fontSize="small" />,
    title: "سرعة",
    description: "إدارة أسرع للمتجر.",
  },
  {
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
    title: "تنظيم",
    description: "متابعة المنتجات والطلبات بوضوح.",
  },
  {
    icon: <SupportAgentRoundedIcon fontSize="small" />,
    title: "دعم",
    description: "مساعدة عند الحاجة.",
  },
];

export default function About() {
  return (
    <Box className="page-about">
      <Paper className="page-about__hero" elevation={0}>
        <Stack spacing={1.25}>
          <Typography variant="overline" className="page-about__eyebrow">
            من نحن
          </Typography>
          <Typography variant="h2" component="h1" className="page-about__title">
            من نحن
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            className="page-about__lead"
          >
            صفحة تعريف مختصرة.
          </Typography>
        </Stack>
      </Paper>

      <Box className="page-about__grid">
        {values.map((item) => (
          <Paper key={item.title} className="page-about__card" elevation={0}>
            <Box className="page-about__icon" aria-hidden>
              {item.icon}
            </Box>
            <Typography variant="h6" className="page-about__card-title">
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper className="page-about__story" elevation={0}>
        <Box
          component="img"
          src="/ibrahimGraduation.jpeg"
          alt="المهندس إبراهيم أبو هنية"
          className="page-about__founder-image"
        />

        <Stack spacing={1.1} className="page-about__story-copy">
          <Typography variant="h5" className="page-about__story-title">
            نبذة
          </Typography>
          <Typography variant="body1" color="text.secondary">
            إدارة المتجر والطلبات والعملاء من مكان واحد.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
