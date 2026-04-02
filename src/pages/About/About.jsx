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
    title: "اشتراك مجاني لمدة شهر",
    description:
      "نوفر اشتراكًا مجانيًا لمدة شهر كامل للاختبار حتى تتعرف على المنصة وتبدأ بثقة.",
  },
  {
    icon: <ManageAccountsRoundedIcon fontSize="small" />,
    title: "إدارة حديثة للبيع والشراء",
    description:
      "نوفر آلية حديثة لإدارة عملية البيع والشراء ومتابعة المنتجات والطلبات والعملاء بشكل واضح وسهل.",
  },
  {
    icon: <SupportAgentRoundedIcon fontSize="small" />,
    title: "دعم فني 24/7",
    description:
      "نوفر دعمًا فنيًا على مدار الساعة طوال أيام الأسبوع لمساعدتك في أي وقت تحتاج فيه للدعم.",
  },
];

export default function About() {
  return (
    <Box className="page-about">
      <Paper className="page-about__hero" elevation={0}>
        <Stack spacing={1.25}>
          <Typography variant="overline" className="page-about__eyebrow">
            عن المنصة
          </Typography>
          <Typography variant="h2" component="h1" className="page-about__title">
            منصة عملية لإدارة البيع والشراء بسهولة
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            className="page-about__lead"
          >
            نساعد أصحاب المتاجر على إدارة منتجاتهم وطلباتهم وعملائهم بطريقة واضحة
            وعملية، مع اشتراك مجاني لمدة شهر للاختبار قبل البدء.
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
            طورت بواسطة المهندس إبراهيم أبو هنية
          </Typography>
          <Typography variant="body1" color="text.secondary">
            تم تطوير المنصة لتقديم حل حديث يساعد المتاجر على إدارة البيع والشراء
            بشكل أسهل وأكثر تنظيمًا.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            الهدف منها أن تمنح صاحب المتجر أدوات واضحة للعمل اليومي، مع تجربة سهلة
            للعميل ودعم فني مستمر 24/7.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
