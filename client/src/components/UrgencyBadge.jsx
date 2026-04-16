import { StatusBadge } from "./ui/index";

/**
 * UrgencyBadge — displays urgency level with color-coded badge
 * Uses the centralized StatusBadge with animated pulse for critical
 * @param {{ urgency: "critical" | "urgent" | "normal" }} props
 */
const UrgencyBadge = ({ urgency }) => <StatusBadge status={urgency} />;

export default UrgencyBadge;
