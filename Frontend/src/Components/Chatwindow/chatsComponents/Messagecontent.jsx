import React from "react";

const DeletedText = () => (
  <span className="deleted-msg">🚫 This message was deleted</span>
);

// Reply quote (if any) + message text / deleted placeholder
// 

const MessageContent = ({ msg, user, chatUser }) => {
  const replyName =
    String(msg?.replyTo?.senderId) === String(user?._id)
      ? "You"
      : chatUser?.name;

  return (
    <>
      {msg.replyTo && (
        <div className="reply-inside-message">
          <div className="reply-name">
            {replyName}
          </div>

          <div className="reply-text">
            {msg.replyTo.text}
          </div>
        </div>
      )}

      {msg.isDeleted ? (
        <DeletedText />
      ) : (
        msg.text
      )}
    </>
  );
};
export default MessageContent;



