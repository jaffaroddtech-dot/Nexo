import React from "react";
import { Type, Paperclip, Link2, Smile, Info, Trash2, Send } from "lucide-react";

const MessageInput = ({
  text,
  onChange,
  onSend,
  replyMessage,
  onCancelReply,
}) => (
  <div className="message-box">
    {replyMessage && (
      <div className="reply-preview">
        <div className="reply-preview-left">
          <span className="reply-title">Replying to</span>
          <p className="reply-preview-text">{replyMessage.text}</p>
        </div>

        <button className="reply-close" onClick={onCancelReply}>
          ✕
        </button>
      </div>
    )}

    <input
      type="text"
      placeholder="Type a message..."
      className="message-input"
      value={text}
      onChange={onChange}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSend();
      }}
    />

    <div className="message-footer">
      <div className="left-icons">
        <Type size={18} />
        <Paperclip size={18} />
        <Link2 size={18} />
        <Smile size={18} />
        <Info size={18} />
        <Trash2 size={18} />
      </div>

      <button className="send-btn" onClick={onSend}>
        <Send size={16} />
        Send
      </button>
    </div>
  </div>
);

export default MessageInput;