import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import "./About.css";

const values = [
  {
    icon: <ShoppingBagRoundedIcon fontSize="small" />,
    title: "تجربة بيع مريحة",
    description: "نركز على جعل التصفح والشراء والإدارة أكثر وضوحًا وسهولة من أول زيارة.",
  },
  {
    icon: <GridViewRoundedIcon fontSize="small" />,
    title: "تنظيم يحترم الوقت",
    description: "البطاقات، المسافات، وترتيب المحتوى كلها مصممة لتساعدك على الوصول بسرعة.",
  },
  {
    icon: <AutoAwesomeRoundedIcon fontSize="small" />,
    title: "لمسة حديثة",
    description: "واجهة هادئة بخط عربي واضح وألوان ناعمة تعطي المتجر حضورًا أقرب للعلامات الكبيرة.",
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
            نبني تجربة تسوق عربية أنيقة وواضحة
          </Typography>
          <Typography variant="body1" color="text.secondary" className="page-about__lead">
            هدفنا أن تبدو المتاجر مرتبة منذ اللحظة الأولى، وأن تبقى إدارتها سهلة حتى
            مع زيادة المنتجات والطلبات والعروض.
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
        <Typography variant="h5" className="page-about__story-title">
          فلسفة التصميم عندنا
        </Typography>
        <Typography variant="body1" color="text.secondary">
          نؤمن أن المتجر الجيد لا يحتاج ضجيجًا بصريًا كي يبدو احترافيًا. لذلك نعتمد
          على بطاقات واضحة، صور أكبر، مساحات تنفس مريحة، وخطوط عربية حديثة تجعل كل
          صفحة تبدو مرتبة وسهلة القراءة.
        </Typography>
      </Paper>
    </Box>
  );
}
