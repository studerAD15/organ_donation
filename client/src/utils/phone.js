export const stripPhoneToDigits = (value = "") => value.replace(/\D/g, "");

export const normalizeIndianPhone = (value = "") => {
  const digits = stripPhoneToDigits(value);

  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (value.trim().startsWith("+")) return `+${digits}`;

  return `+${digits}`;
};
