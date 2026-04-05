import Chip from "@mui/material/Chip";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { getSubscriptionPlanByKey } from "../../constants/subscriptionPlans.js";

export default function PlanBadge({ planKey }) {
  const plan = getSubscriptionPlanByKey(planKey);

  return (
    <Chip
      icon={<WorkspacePremiumRoundedIcon fontSize="small" />}
      label={`الخطة الحالية: ${plan.label}`}
      color="primary"
      variant="outlined"
      className="owner-plan-badge"
    />
  );
}
