const nodemailer = require('nodemailer');

// No real SMTP creds configured (SMTP_HOST/USER/PASS in .env)? Falls back to
// an auto-provisioned Ethereal test inbox so the feature works out of the
// box in a fresh clone/demo — sent mail is only visible via the preview URL
// logged to the console, not a real inbox. Add real SMTP env vars (see
// .env.example) to send mail that actually lands in someone's inbox. Same
// pattern as the main app's server/utils/mailer.js — this file used to be
// hardcoded to Ethereal only with no way to ever send real mail.
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
  return nodemailer.createTestAccount().then((testAccount) =>
    nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  );
}

function getTransporter() {
  if (!transporterPromise) transporterPromise = buildTransporter();
  return transporterPromise;
}

async function send({ to, subject, text, html }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || '"TITAN" <no-reply@titan-institute.test>',
    to,
    subject,
    text,
    html,
  });

  if (usingEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    // This is the ONLY way to see the "sent" email in dev, since Ethereal
    // never delivers to a real inbox — open this URL to view it.
    console.log(`\n📧 (Ethereal preview — no SMTP_HOST configured) ${subject} -> ${to}: ${previewUrl}\n`);
    return previewUrl;
  }
  return null;
}

async function sendContactConfirmation(toEmail, name, subject) {
  return send({
    to: toEmail,
    subject: `We received your message: ${subject}`,
    text: `Hi ${name},\n\nThanks for reaching out to TITAN. We've received your message and our admissions team will get back to you soon.\n\nSubject: ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #162346;">Thanks for reaching out, ${name}</h2>
        <p>We've received your message and our admissions team will get back to you soon.</p>
        <p style="color:#888;font-size:12px;">Subject: ${subject}</p>
      </div>
    `,
  });
}

async function sendApplicationConfirmation(toEmail, name, referenceNumber, programTitle) {
  return send({
    to: toEmail,
    subject: `Application received — reference ${referenceNumber}`,
    text: `Hi ${name},\n\nThanks for applying to TITAN's ${programTitle} program. Your application has been received.\n\nReference number: ${referenceNumber}\n\nOur admissions team will review your application and get back to you within 48 hours.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #162346;">Application received, ${name}</h2>
        <p>Thanks for applying to TITAN's <strong>${programTitle}</strong> program.</p>
        <p style="margin:16px 0;padding:12px 16px;background:#F5F0E6;border-radius:8px;">
          Reference number: <strong style="color:#162346;">${referenceNumber}</strong>
        </p>
        <p>Our admissions team will review your application and get back to you within 48 hours.</p>
      </div>
    `,
  });
}

module.exports = { sendContactConfirmation, sendApplicationConfirmation };
