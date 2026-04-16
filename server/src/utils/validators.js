import AppError from "./appError.js";

const MOCK_REVOKED_LICENSES = new Set(["HSP-VOID-0001", "TEMP-REJECT-01"]);

export const validateHospitalLicense = (licenseNumber) => {
  const regex = /^[A-Z0-9-]{6,20}$/i;
  if (!regex.test(licenseNumber)) {
    throw new AppError("Invalid hospital license number format", 400);
  }
};

export const validateHospitalRegistry = (licenseNumber) => {
  validateHospitalLicense(licenseNumber);
  if (MOCK_REVOKED_LICENSES.has(String(licenseNumber).toUpperCase())) {
    return { status: "rejected", reason: "License found in revoked registry" };
  }

  if (/^HSP-|^MED-|^LIC-/i.test(licenseNumber)) {
    return { status: "validated", reason: "License matched registry pattern" };
  }

  return { status: "pending", reason: "Needs manual registry verification" };
};
