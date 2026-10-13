import React, { useState, useRef, useEffect } from "react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import {
  Type,
  Paperclip,
  Link2,
  Smile,
  Info,
  Trash2,
  Send,
  Image,
  FileText,
  Mic,
  Square,
} from "lucide-react";
import { getMediaLabel, formatDuration } from "./mediaUtils.js";
import useVoiceRecorder from "./useVoiceRecorder.js";

const MessageInput = ({
  text,
  onChange,
  onSend,
  replyMessage,
  onCancelReply,
  onSelectFile,
  onSendVoice,
  voiceSending,
}) => {
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const inputRef = useRef(null);

  const {
    isRecording,
    seconds,
    levels,
    error: micError,
    startRecording,
    stopRecording,
  } = useVoiceRecorder(onSendVoice);

  // recording shuru hote hi emoji picker band
  useEffect(() => {
    if (isRecording) setEmojiOpen(false);
  }, [isRecording]);

  // attach menu: outside click / Esc par band
  useEffect(() => {
    if (!attachOpen) return;
    const onPointerDown = (e) => {
      if (!e.target.closest(".attach-wrapper")) setAttachOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAttachOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [attachOpen]);

  // emoji picker: outside click / Esc par band
  useEffect(() => {
    if (!emojiOpen) return;
    const onPointerDown = (e) => {
      if (!e.target.closest(".emoji-wrapper")) setEmojiOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setEmojiOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [emojiOpen]);

  // emoji ko cursor ki position par insert karta hai
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);

    // handleInputChange sirf e.target.value use karta hai, isliye yeh kaam karta hai
    onChange({ target: { value: next } });

    requestAnimationFrame(() => {
      if (!input) return;
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onSelectFile?.(file);
    e.target.value = ""; // same file dobara select ho sake
    setAttachOpen(false);
  };

  // clipboard se image / file paste (Ctrl+V)
  const handlePaste = (e) => {
    const file = Array.from(e.clipboardData?.files || [])[0];
    if (file) {
      e.preventDefault();
      onSelectFile?.(file);
    }
  };

  return (
    <div className="message-box">
      {replyMessage && (
        <div className="reply-preview">
          <div className="reply-preview-left">
            <span className="reply-title">Replying to</span>
            <p className="reply-preview-text">{getMediaLabel(replyMessage)}</p>
          </div>

          <button
            type="button"
            className="reply-close"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      {isRecording ? (
        <div className="recording-bar">
          <span className="recording-dot" />
          <span className="recording-time">{formatDuration(seconds)}</span>

          <div className="wave" aria-hidden="true">
            {levels.map((level, i) => (
              <span
                key={i}
                className="wave-bar"
                style={{ height: `${Math.round(level * 100)}%` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="message-input"
          value={text}
          onChange={onChange}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            // isComposing: IME keyboard compose kar raha ho to send na karein
            if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend();
          }}
        />
      )}

      {micError && <div className="mic-error">{micError}</div>}

      <div className="message-footer">
        <div className="left-icons">

          <div className="attach-wrapper">
            <button
              type="button"
              className="attach-btn"
              aria-label="Attach"
              aria-expanded={attachOpen}
              onClick={() => setAttachOpen((o) => !o)}
              disabled={isRecording}
            >
              <Paperclip size={18} />
            </button>

            {attachOpen && (
              <div className="attach-menu">
                <button type="button" onClick={() => mediaInputRef.current?.click()}>
                  <Image size={16} /> Photos &amp; videos
                </button>
                <button type="button" onClick={() => docInputRef.current?.click()}>
                  <FileText size={16} /> Document
                </button>
              </div>
            )}

            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={handleFileChange}
            />
            <input ref={docInputRef} type="file" hidden onChange={handleFileChange} />
          </div>


          <div className="emoji-wrapper">
            <button
              type="button"
              className="emoji-btn"
              aria-label="Emoji"
              aria-expanded={emojiOpen}
              onClick={() => setEmojiOpen((o) => !o)}
              disabled={isRecording}
            >
              <Smile size={18} />
            </button>

            {emojiOpen && (
              <div className="emoji-popover">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  emojiStyle={EmojiStyle.APPLE}
                  theme={Theme.DARK}
                  width={320}
                  height={380}
                  lazyLoadEmojis
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji"
                />
              </div>
            )}
          </div>

        </div>

        {isRecording ? (
          <button type="button" className="send-btn stop-btn" onClick={stopRecording}>
            <Square size={16} />
            Stop
          </button>
        ) : (
          <div className="send-actions">
            <button
              type="button"
              className="mic-btn"
              aria-label="Record voice message"
              onClick={startRecording}
              disabled={voiceSending}
            >
              <Mic size={18} />
            </button>
            <button type="button" className="send-btn" onClick={onSend}>
              <Send size={16} />
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageInput;