const cloudinary = require('./cloudinary');

// Documents only ever store the Cloudinary secure_url (never the
// public_id), so deleting a superseded asset means recovering the
// public_id from its URL first. Format: .../upload/v<version>/<public_id>.<ext>
function publicIdFromUrl(url) {
  if (!url) return null;
  const uploadIdx = url.indexOf('/upload/');
  if (uploadIdx === -1) return null;
  const rest = url.slice(uploadIdx + '/upload/'.length).replace(/^v\d+\//, '');
  const dotIdx = rest.lastIndexOf('.');
  return dotIdx === -1 ? rest : rest.slice(0, dotIdx);
}

// Best-effort only — a failed deletion here must never block the request
// that's replacing the asset, it just leaves an orphan for manual cleanup.
async function destroyCloudinaryUrl(url, resourceType = 'image') {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Failed to delete old Cloudinary asset:', publicId, err.message);
  }
}

module.exports = { destroyCloudinaryUrl };
