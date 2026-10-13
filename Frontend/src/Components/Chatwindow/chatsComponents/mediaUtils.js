export const MAX_FILE_SIZE = 25 * 1024 * 1024; // keep in sync with backend upload.js

export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// seconds -> m:ss
export const formatDuration = (sec = 0) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const getFileKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

// One-line text for reply previews and the conversation list's last message
export const getMediaLabel = (msg) => {
  if (!msg) return "";
  if (msg.isDeleted) return "🚫 This message was deleted";

  switch (msg.media?.type) {
    case "image":
      return msg.caption ? `📷 ${msg.caption}` : "📷 Photo";
    case "video":
      return msg.caption ? `🎥 ${msg.caption}` : "🎥 Video";
    case "audio":
      return `🎤 Voice message${
        msg.media.duration ? ` (${formatDuration(msg.media.duration)})` : ""
      }`;
    case "file":
      return `📄 ${msg.media.name || "Document"}`;
    default:
      return msg.text || "";
  }
};

// Cloudinary: force "save as" instead of opening in the browser
export const getDownloadUrl = (url = "") =>
  url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;