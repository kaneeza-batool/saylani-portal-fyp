const cloudinary = require('cloudinary').v2;

// Configured from env at require-time, same pattern as every other
// integration in this app (mailer.js, chatController's OPENAI_API_KEY) —
// missing credentials don't crash the server, they just make the specific
// feature (course image / application document uploads) fail with a clear
// error on first use instead of silently misbehaving.
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    'Cloudinary is not configured (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET missing) — course image and application document uploads will fail until these are set.'
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
