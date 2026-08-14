const nodemailer = require('nodemailer');

// DEV ONLY — Ethereal is Nodemailer's fake SMTP testing service: emails
// sent through it are never actually delivered anywhere, it just captures
// them and hands back a preview URL. That's why sendContactConfirmation
// logs the preview URL to the server console instead of relying on a real
// inbox. Before production, replace this whole transporter with a real
// provider (Gmail SMTP, SendGrid, Postmark, etc.) configured via env vars.
let transporterPromise = null;

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then((testAccount) =>
      nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })
    );
  }
  return transporterPromise;
}

async function sendContactConfirmation(toEmail, name, subject) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"TITAN" <no-reply@titan-institute.test>',
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

  const previewUrl = nodemailer.getTestMessageUrl(info);
  // This is the ONLY way to see the "sent" email in dev, since Ethereal
  // never delivers to a real inbox — open this URL to view it.
  console.log(`\n📧 Contact confirmation email sent (Ethereal test inbox). Preview: ${previewUrl}\n`);
  return previewUrl;
}

async function sendApplicationConfirmation(toEmail, name, referenceNumber, programTitle) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"TITAN Admissions" <no-reply@titan-institute.test>',
    to: toEmail,
    subject: `Application received — reference ${referenceNumber}`,
    text: `Hi ${name},\n\nThanks for applying to TITAN's ${programTitle} program. Your application has been received.\n\nReference number: ${referenceNumber}\nKeep this reference number to check your application status later.\n\nOur admissions team will review your application and get back to you within 48 hours.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #162346;">Application received, ${name}</h2>
        <p>Thanks for applying to TITAN's <strong>${programTitle}</strong> program.</p>
        <p style="margin:16px 0;padding:12px 16px;background:#F5F0E6;border-radius:8px;">
          Reference number: <strong style="color:#162346;">${referenceNumber}</strong><br/>
          <span style="color:#888;font-size:12px;">Keep this to check your application status later.</span>
        </p>
        <p>Our admissions team will review your application and get back to you within 48 hours.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  // This is the ONLY way to see the "sent" email in dev, since Ethereal
  // never delivers to a real inbox — open this URL to view it.
  console.log(`\n📧 Application confirmation email sent (Ethereal test inbox). Preview: ${previewUrl}\n`);
  return previewUrl;
}

module.exports = { sendContactConfirmation, sendApplicationConfirmation };
