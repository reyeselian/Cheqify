import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  // secure = true solo si usas 465 o si lo fuerzas por variable
  secure:
    String(process.env.SMTP_SECURE || "false") === "true" || port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from =
    process.env.MAIL_FROM || 'Cheqify <cheqify.notificaciones@gmail.com>';

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

export default transporter;
