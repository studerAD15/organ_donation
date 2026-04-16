import { v2 as cloudinary } from "cloudinary";
import config from "../config/env.js";

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}

export const uploadIdProof = async (fileBase64) => {
  if (!config.cloudinary.cloudName) return "";
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: "organ-donation/id-proofs",
    resource_type: "auto"
  });
  return result.secure_url;
};
