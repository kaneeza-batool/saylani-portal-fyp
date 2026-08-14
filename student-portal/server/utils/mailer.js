const nodemailer = require('nodemailer');

// DEV ONLY — Ethereal is Nodemailer's fake SMTP testing service: emails
// sent through it are never actually delivered anywhere, it just captures
// them and hands back a preview URL. That's why forgotPassword logs the
// preview URL to the server console instead of relying on a real inbox.
// Before production, replace this whole transporter with a real provider
// (Gmail SMTP, SendGrid, Postmark, etc.) configured via env vars.
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

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"TITAN Student Portal" <no-reply@titan-student-portal.test>',
    to: toEmail,
    subject: 'Reset your TITAN Student Portal password',
    text: `Reset your password using this link (expires in 30 minutes): ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #162346;">Reset your password</h2>
        <p>Click the button below to choose a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#162346;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
        <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  // This is the ONLY way to see the "sent" email in dev, since Ethereal
  // never delivers to a real inbox — open this URL to view it.
  console.log(`\n📧 Password reset email sent (Ethereal test inbox). Preview: ${previewUrl}\n`);
  return previewUrl;
}

module.exports = { sendPasswordResetEmail };
