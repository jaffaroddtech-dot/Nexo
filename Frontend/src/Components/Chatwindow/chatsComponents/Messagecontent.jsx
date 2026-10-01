import React from "react";

const DeletedText = () => (
  <span className="deleted-msg">🚫 This message was deleted</span>
);

// Reply quote (if any) + message text / deleted placeholder
const MessageContent = ({ msg }) => (
  <>
    {msg.replyTo && (
      <div className="reply-inside-message">
        {msg.replyTo.isDeleted ? <DeletedText /> : msg.replyTo.text}
      </div>
    )}
    {msg.isDeleted ? <DeletedText /> : msg.text}
  </>
);

export default MessageContent;