const cloudinary = require('./cloudinary');

// A minimal multer storage engine for Cloudinary, written directly against
// the SDK instead of the `multer-storage-cloudinary` package — that package
// is effectively unmaintained for the current Cloudinary major version (its
// latest release still hard-depends on the vulnerable cloudinary@1.x line,
// see GHSA-g4mf-96x5-5m2c), and downgrading to its older API-compatible
// release would mean pairing a stale wrapper with a security-patched SDK
// for no real benefit. This implements the same multer.StorageEngine
// interface (_handleFile/_removeFile) the real package does.
class CloudinaryStorageEngine {
  constructor({ params }) {
    this.getParams = typeof params === 'function' ? params : () => params || {};
  }

  _handleFile(req, file, cb) {
    Promise.resolve(this.getParams(req, file))
      .then((params) => {
        const uploadStream = cloudinary.uploader.upload_stream(params, (err, result) => {
          if (err) return cb(err);
          // `path` mirrors what multer.diskStorage would set (a local disk
          // path) so existing controller code that reads req.file.path
          // keeps working unchanged — here it's the Cloudinary secure URL.
          cb(null, { path: result.secure_url, filename: result.public_id, size: result.bytes, cloudinaryResult: result });
        });
        file.stream.pipe(uploadStream);
      })
      .catch(cb);
  }

  _removeFile(req, file, cb) {
    if (!file.filename) return cb(null);
    cloudinary.uploader.destroy(file.filename, { resource_type: file.cloudinaryResult?.resource_type || 'image' }, (err) => cb(err));
  }
}

module.exports = function cloudinaryStorage(options) {
  return new CloudinaryStorageEngine(options);
};
