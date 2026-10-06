import React from "react";
import "./Chatwindow.css";
import useChatWindow from "./chatsComponents/useChatwindow";
import ChatHeader from "./chatsComponents/ChatHeader";
import SentMessage from "./chatsComponents/SentMessage";
import ReceivedMessage from "./chatsComponents/ReceivedMessage";
import MessageInput from "./chatsComponents/MessageInput";

const ChatWindow = ({ chatUser, onMessageSent, onBack }) => {
  const {
    user,
    onlineUsers,
    messages,
    text,
    isTyping,
    replyMessage,
    setReplyMessage,
    openReactionId,
    setOpenReactionId,
    openMenuId,
    setOpenMenuId,
    bottomRef,
    handleSend,
    handleInputChange,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleReaction,
  } = useChatWindow(chatUser, onMessageSent);

  // EMPTY CHAT
  if (!chatUser) {
    return (
      <div className="empty-chat d-flex flex-column justify-content-center">
        <div className="chat-logo"></div>
        <h2>Choose a conversation to continue</h2>
      </div>
    );
  }

  // index of my last message (for the seen/delivered tick)
  const lastMineIndex = messages.reduce(
    (last, m, i) => (m.senderId === user._id ? i : last),
    -1
  );

  const shared = {
    openReactionId,
    setOpenReactionId,
    openMenuId,
    setOpenMenuId,
    onReact: handleReaction,
    onReply: setReplyMessage,
    onDeleteForMe: handleDeleteForMe,
  };

  return (
    <div className="chat-window">
      <ChatHeader
        chatUser={chatUser}
        isTyping={isTyping}
        isOnline={onlineUsers.includes(chatUser._id)}
        onBack={onBack}
      />

      <div className="chat-body">
        {messages.map((msg, index) =>
          msg.senderId === user._id ? (
            <SentMessage
              key={msg._id}
              msg={msg}
              user={user}
              chatUser={chatUser}
              isLastMine={index === lastMineIndex}
              onDeleteForEveryone={handleDeleteForEveryone}
              {...shared}
            />
          ) : (
            <ReceivedMessage key={msg._id} msg={msg} user={user} chatUser={chatUser} {...shared} />
          )
        )}

        {isTyping && (
          <div className="typing-indicator received">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput
        text={text}
        onChange={handleInputChange}
        onSend={handleSend}
        replyMessage={replyMessage}
        onCancelReply={() => setReplyMessage(null)}
      />
    </div>
  );
};

export default ChatWindow;