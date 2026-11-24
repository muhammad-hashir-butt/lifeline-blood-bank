const nodemailer = require("nodemailer");

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  if (!transporter) {
    console.warn("SMTP not configured — email skipped:", { to, subject });
    return { skipped: true, reason: "SMTP not configured" };
  }

  if (!to) {
    return { skipped: true, reason: "No recipient email" };
  }

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  });

  return { skipped: false, messageId: info.messageId };
}

module.exports = { sendEmail };
