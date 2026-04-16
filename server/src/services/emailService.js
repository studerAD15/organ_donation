import nodemailer from "nodemailer";
import config from "../config/env.js";

let transporter = null;
if (config.smtp.host && config.smtp.user && config.smtp.pass) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: { user: config.smtp.user, pass: config.smtp.pass }
  });
}

export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter || !to) return;
  await transporter.sendMail({ from: config.smtp.user, to, subject, html });
};
