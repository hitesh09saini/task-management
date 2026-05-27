// Email scaffold. Sends only when SMTP env vars are configured;
// otherwise logs to console and returns null. No hard dependency on
// SMTP being set up — safe to call from anywhere.

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }
  const nodemailer = (await import("nodemailer")).default;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return null;
  const tx = await getTransporter();
  if (!tx) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email skipped — no SMTP] to=${to} subject=${subject}`);
    }
    return null;
  }
  try {
    return await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (e) {
    console.error("sendEmail failed:", e);
    return null;
  }
}

export function notificationEmail({ subject, message, link }) {
  const base = process.env.APP_BASE_URL || "";
  const href = link ? `${base}${link}` : null;
  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="color:#2563EB;margin:0 0 12px;">Smart PMS</h2>
      <p style="font-size:14px;line-height:1.5;">${message}</p>
      ${href ? `<p style="margin-top:16px;"><a href="${href}" style="background:#2563EB;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">Open in Smart PMS</a></p>` : ""}
    </div>`;
  return { subject, html, text: message };
}
