import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AppButton from "./buttons/AppButton.jsx";
import { getDeveloperSupportWhatsAppLink } from "../../utils/whatsapp.js";

export default function ContactDeveloperButton({
  label = "الدعم",
  variant = "text",
  appearance,
  fullWidth = false,
  onClick,
  className,
}) {
  return (
    <AppButton
      component="a"
      href={getDeveloperSupportWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      appearance={appearance}
      fullWidth={fullWidth}
      startIcon={<WhatsAppIcon fontSize="small" />}
      className={className}
      onClick={onClick}
    >
      {label}
    </AppButton>
  );
}
