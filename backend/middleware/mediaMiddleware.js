const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (keep in sync with frontend mediaUtils.js)

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "chat-media",
    resource_type: "auto",
  }),
});

// block executables / scripts
const BLOCKED_EXT = /\.(exe|bat|cmd|sh|msi|apk|jar|scr|com|js|vbs|ps1)$/i;

const fileFilter = (req, file, cb) => {
  if (BLOCKED_EXT.test(file.originalname)) {
    return cb(new Error("This file type is not allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

// Same as upload.single(field) but returns clean JSON errors
// (file too large, blocked type) instead of crashing into the default error handler.
upload.uploadSingle = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (!err) return next();

    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 25 MB)"
        : err.message || "Upload failed";

    return res.status(400).json({ status: false, message });
  });
};



// Status uploads: images + videos only
const statusFilter = (req, file, cb) => {
  if (!/^(image|video)\//.test(file.mimetype)) {
    return cb(new Error("Only photos and videos can be posted to status"));
  }
  cb(null, true);
};

const statusUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: statusFilter,
});

upload.statusSingle = (field) => (req, res, next) => {
  statusUpload.single(field)(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 25 MB)" : err.message || "Upload failed";
    return res.status(400).json({ status: false, message });
  });
};
// still works as `upload.single(...)` anywhere else you already use it
module.exports = upload;