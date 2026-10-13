import React, { useState, useEffect, useRef } from "react";
import { FileText, Download, X, Play, Pause } from "lucide-react";
import {
  formatFileSize,
  getMediaLabel,
  getDownloadUrl,
  formatDuration,
} from "./mediaUtils.js";
import EmojiText from "./EmojiText.jsx";

const DeletedText = () => (
  <span className="deleted-msg">🚫 This message was deleted</span>
);

// Full-screen image viewer
const ImageViewer = ({ media, onClose }) => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="image-viewer" onClick={onClose} role="dialog" aria-modal="true">
      <div className="image-viewer-actions" onClick={(e) => e.stopPropagation()}>
        <a
          href={getDownloadUrl(media.url)}
          target="_blank"
          rel="noreferrer"
          aria-label="Download"
        >
          <Download size={20} />
        </a>
        <button type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <img src={media.url} alt={media.name || "image"} onClick={(e) => e.stopPropagation()} />
    </div>
  );
};

// only one voice message plays at a time
let activeAudio = null;

// Voice message: play / pause only (no seeking)
const AudioMessage = ({ media }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);

  const total = media.duration || 0;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (activeAudio && activeAudio !== a) activeAudio.pause();
      activeAudio = a;
      a.play().catch(() => setPlaying(false));
    } else {
      a.pause();
    }
  };

  const progress = total ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="voice-message">
      <button
        type="button"
        className="voice-play-btn"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="voice-track">
        <div className="voice-progress" style={{ width: `${progress}%` }} />
      </div>

      <span className="voice-time">
        {formatDuration(playing || current > 0 ? current : total)}
      </span>

      <audio
        ref={audioRef}
        src={media.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onEnded={(e) => {
          setPlaying(false);
          setCurrent(0);
          e.target.currentTime = 0;
        }}
      />
    </div>
  );
};

const MediaBlock = ({ media }) => {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (media.type === "image") {
    return (
      <>
        <img
          className="chat-media-image"
          src={media.url}
          alt={media.name || "image"}
          loading="lazy"
          onClick={() => setViewerOpen(true)}
        />
        {viewerOpen && <ImageViewer media={media} onClose={() => setViewerOpen(false)} />}
      </>
    );
  }

  if (media.type === "audio") return <AudioMessage media={media} />;

  if (media.type === "video") {
    return (
      <video className="chat-media-video" src={media.url} controls preload="metadata" />
    );
  }

  return (
    <a
      className="chat-media-file"
      href={getDownloadUrl(media.url)}
      target="_blank"
      rel="noreferrer"
    >
      <FileText size={28} />
      <div className="chat-media-file-info">
        <span className="chat-media-file-name">{media.name || "Document"}</span>
        {media.size ? (
          <span className="chat-media-file-size">{formatFileSize(media.size)}</span>
        ) : null}
      </div>
      <Download size={18} />
    </a>
  );
};

// Reply quote (if any) + media + caption / text / deleted placeholder
const MessageContent = ({ msg, user, chatUser }) => {
  const replyName =
    String(msg?.replyTo?.senderId) === String(user?._id)
      ? "You"
      : chatUser?.name;

  const hasMedia = Boolean(msg.media?.url);

  return (
    <>
      {msg.replyTo && (
        <div className="reply-inside-message">
          <div className="reply-name">{replyName}</div>
          <div className="reply-text">{getMediaLabel(msg.replyTo)}</div>
        </div>
      )}

      {msg.isDeleted ? (
        <DeletedText />
      ) : (
        <>
          {hasMedia && <MediaBlock media={msg.media} />}

          {hasMedia && msg.caption && (
            <div className="chat-media-caption">
              <EmojiText text={msg.caption} />
            </div>
          )}

          {!hasMedia && msg.text && <EmojiText text={msg.text} />}
        </>
      )}
    </>
  );
};

export default MessageContent;