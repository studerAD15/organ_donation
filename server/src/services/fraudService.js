export const scoreRequestFraudRisk = ({ units, urgency, createdTodayCount = 0, previousCriticalCount = 0, duplicateContact = false }) => {
  let score = 0;
  const flags = [];

  if (units >= 5) {
    score += 20;
    flags.push("high_units");
  }

  if (urgency === "critical") {
    score += 15;
    if (previousCriticalCount >= 3) {
      score += 10;
      flags.push("critical_spike");
    }
  }

  if (createdTodayCount >= 2) {
    score += 20;
    flags.push("high_frequency_requests");
  }

  if (duplicateContact) {
    score += 15;
    flags.push("shared_contact_usage");
  }

  if (score >= 40) {
    flags.push("review_required");
  }

  return { score, flags };
};
