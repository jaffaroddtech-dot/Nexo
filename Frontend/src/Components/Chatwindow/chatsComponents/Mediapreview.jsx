import React, { useEffect, useRef } from "react";
import { X, Send, FileText } from "lucide-react";
import { formatFileSize } from "./mediaUtils.js";

// WhatsApp-style "review before sending" screen
const MediaPreview = ({
  attachment,
  caption,
  setCaption,
  uploading,
  progress,
  error,
  onSend,
  onCancel,
}) => {
  const captionRef = useRef(null);

  useEffect(() => {
    if (!attachment) return;
    captionRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !uploading) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [attachment, uploading, onCancel]);

  if (!attachment) return null;

  const { file, kind, previewUrl } = attachment;
  const blockingError = attachment.error;

  return (
    <div className="media-preview-overlay" role="dialog" aria-modal="true">
      <div className="media-preview">
        <div className="media-preview-header">
          <button
            type="button"
            className="media-preview-close"
            onClick={onCancel}
            disabled={uploading}
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
          <span className="media-preview-name">{file.name}</span>
        </div>

        <div className="media-preview-stage">
          {kind === "image" && <img src={previewUrl} alt={file.name} />}
          {kind === "video" && <video src={previewUrl} controls />}
          {kind === "file" && (
            <div className="media-preview-file">
              <FileText size={64} />
              <strong>{file.name}</strong>
              <span>{formatFileSize(file.size)}</span>
              <small>No preview available</small>
            </div>
          )}
        </div>

        {(blockingError || error) && (
          <div className="media-preview-error">{blockingError || error}</div>
        )}

        {uploading && (
          <div className="media-progress" aria-label="Upload progress">
            <div className="media-progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        )}

        <div className="media-preview-footer">
          <input
            ref={captionRef}
            type="text"
            className="media-caption-input"
            placeholder="Add a caption..."
            value={caption}
            disabled={uploading || !!blockingError}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend();
            }}
          />
          <button
            type="button"
            className="media-send-btn"
            onClick={onSend}
            disabled={uploading || !!blockingError}
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;