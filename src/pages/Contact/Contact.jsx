import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import "./Contact.css";

const channels = [
  {
    icon: <ChatBubbleOutlineRoundedIcon fontSize="small" />,
    title: "استفسار",
    description: "للأسئلة العامة.",
  },
  {
    icon: <HandshakeRoundedIcon fontSize="small" />,
    title: "تعاون",
    description: "للتعاون والشراكات.",
  },
  {
    icon: <LightbulbRoundedIcon fontSize="small" />,
    title: "اقتراح",
    description: "للملاحظات والتطوير.",
  },
];

export default function Contact() {
  return (
    <Box className="page-contact">
      <Paper className="page-contact__hero" elevation={0}>
        <Stack spacing={1.2}>
          <Typography variant="overline" className="page-contact__eyebrow">
            تواصل
          </Typography>
          <Typography variant="h2" component="h1" className="page-contact__title">
            تواصل معنا
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" className="page-contact__actions">
          <Button component={RouterLink} to="/market" variant="contained">
            استعرض المتاجر
          </Button>
          <Button component={RouterLink} to="/about" variant="outlined">
            من نحن
          </Button>
        </Stack>
      </Paper>

      <Box className="page-contact__grid">
        {channels.map((item) => (
          <Paper key={item.title} className="page-contact__card" elevation={0}>
            <Box className="page-contact__icon" aria-hidden>
              {item.icon}
            </Box>
            <Typography variant="h6" className="page-contact__card-title">
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
