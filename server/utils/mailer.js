const nodemailer = require('nodemailer');

// No real SMTP creds configured (SMTP_HOST/USER/PASS in .env)? Falls back to
// an auto-provisioned Ethereal test inbox so the feature works out of the
// box in a fresh clone/demo — sent mail is only visible via the preview URL
// logged to the console, not a real inbox. Add real SMTP env vars to send
// mail that actually lands in someone's inbox.
let transporterPromise = null;
let usingEthereal = false;

function buildTransporter() {
  if (process.env.SMTP_HOST) {
    return Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    );
  }

  usingEthereal = true;
  return nodemailer.createTestAccount().then((account) =>
    nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    })
  );
}

function getTransporter() {
  if (!transporterPromise) transporterPromise = buildTransporter();
  return transporterPromise;
}

async function sendMail({ to, subject, html }) {
  if (!to) return null;
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"TITAN Portal" <no-reply@titan-portal.local>',
      to,
      subject,
      html,
    });
    if (usingEthereal) {
      console.log(`[mailer] (Ethereal preview — no SMTP configured) ${subject} -> ${to}: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (err) {
    console.error('[mailer] Failed to send email:', err.message);
    return null;
  }
}

module.exports = { sendMail };
