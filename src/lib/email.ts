import nodemailer from "nodemailer";

const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER;
const pass = process.env.BREVO_SMTP_PASS;
const from = process.env.BREVO_FROM || "no-reply@example.com";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!user || !pass) {
    throw new Error("Brevo SMTP credentials missing");
  }
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendVerificationEmail(options: {
  to: string;
  code: string;
  minutes: number;
}) {
  const { to, code, minutes } = options;
  const subject = "Verify your email";
  const text = `Your verification code is ${code}. It expires in ${minutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">Verify your email</h2>
      <p>Use this code to finish your registration:</p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</div>
      <p style="margin-top: 12px;">This code expires in ${minutes} minutes.</p>
    </div>
  `;

  const mailer = getTransporter();
  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
