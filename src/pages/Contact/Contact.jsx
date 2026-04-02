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
    title: "استفسارات المتاجر",
    description: "إذا كنت ترتب متجرًا جديدًا أو تريد تحسين تجربتك الحالية فنحن هنا لمساعدتك.",
  },
  {
    icon: <HandshakeRoundedIcon fontSize="small" />,
    title: "التعاون والشراكات",
    description: "نرحب بالأفكار التي تضيف قيمة للتجربة وتوسع حضور المتاجر بطريقة أنيقة.",
  },
  {
    icon: <LightbulbRoundedIcon fontSize="small" />,
    title: "اقتراحات التطوير",
    description: "كل ملاحظة واضحة تساعدنا على جعل التصفح والإدارة أكثر سلاسة وراحة.",
  },
];

export default function Contact() {
  return (
    <Box className="page-contact">
      <Paper className="page-contact__hero" elevation={0}>
        <Stack spacing={1.2}>
          <Typography variant="overline" className="page-contact__eyebrow">
            تواصل معنا
          </Typography>
          <Typography variant="h2" component="h1" className="page-contact__title">
            نحب الرسائل الواضحة والأفكار الجميلة
          </Typography>
          <Typography variant="body1" color="text.secondary" className="page-contact__lead">
            إذا كان لديك سؤال، فكرة، أو رغبة في تحسين تجربة المتجر، يسعدنا أن نسمع منك.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" className="page-contact__actions">
          <Button component={RouterLink} to="/market" variant="contained">
            استعرض المتاجر
          </Button>
          <Button component={RouterLink} to="/about" variant="outlined">
            تعرّف علينا أكثر
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
