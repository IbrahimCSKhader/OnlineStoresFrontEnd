import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import "./ThemeTemplateOption.css";

function ThemeSwatch({ title, colors }) {
  const [background, surface, accent] = colors;

  return (
    <Box className="theme-template-option__swatch" title={title}>
      <span
        className="theme-template-option__swatch-panel"
        style={{ backgroundColor: background }}
      >
        <span
          className="theme-template-option__swatch-card"
          style={{ backgroundColor: surface }}
        />
        <span
          className="theme-template-option__swatch-dot"
          style={{ backgroundColor: accent }}
        />
      </span>
      <Typography variant="caption" className="theme-template-option__swatch-label">
        {title}
      </Typography>
    </Box>
  );
}

export default function ThemeTemplateOption({ template }) {
  return (
    <Box className="theme-template-option">
      <Typography variant="body2" fontWeight={700} className="theme-template-option__label">
        {template.label}
      </Typography>
      <Box className="theme-template-option__swatches">
        <ThemeSwatch title="نهار" colors={template.preview.light} />
        <ThemeSwatch title="ليل" colors={template.preview.dark} />
      </Box>
    </Box>
  );
}
