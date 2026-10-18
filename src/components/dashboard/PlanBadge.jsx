import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import Chip from "@mui/material/Chip";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { getSubscriptionPlanByKey } from "../../constants/subscriptionPlans.js";

export default function PlanBadge({ planKey }) {
  const { t } = useOwnerLanguage();
  const plan = getSubscriptionPlanByKey(planKey);

  return (
    <Chip
      icon={<WorkspacePremiumRoundedIcon fontSize="small" />}
      label={`${t("الخطة الحالية:")} ${t(plan.label)}`}
      color="primary"
      variant="outlined"
      className="owner-plan-badge"
    />
  );
}
