import React, { useState } from "react";
import "./Chatwindow.css";
import useChatWindow from "./chatsComponents/Usechatwindow";
import ChatHeader from "./chatsComponents/Chatheader";
import SentMessage from "./chatsComponents/Sentmessage";
import ReceivedMessage from "./chatsComponents/Receivedmessage";
import MessageInput from "./chatsComponents/Messageinput";
import MediaPreview from "./chatsComponents/Mediapreview";

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
    attachment,
    caption,
    setCaption,
    uploading,
    uploadProgress,
    uploadError,
    selectFile,
    clearAttachment,
    handleSendMedia,
    handleMediaLoad,
    handleSendVoice,
    voiceSending,
  } = useChatWindow(chatUser, onMessageSent);

  // drag & drop highlight (must be above the early return - hooks rule)
  const [dragging, setDragging] = useState(false);

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

  const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");

  const onDragOver = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    // ignore leave events fired when moving over child elements
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  };

  const onDrop = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  return (
    <div
      className={`chat-window ${dragging ? "dragging" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <ChatHeader
        chatUser={chatUser}
        isTyping={isTyping}
        isOnline={onlineUsers.includes(chatUser._id)}
        onBack={onBack}
      />

      <div
        className="chat-body"
        onLoadCapture={handleMediaLoad}
        onLoadedMetadataCapture={handleMediaLoad}
      >
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
            <ReceivedMessage
              key={msg._id}
              msg={msg}
              user={user}
              chatUser={chatUser}
              {...shared}
            />
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

      {/* key remounts the input when switching chats, which discards any
          in-progress recording so it can never go to the wrong person */}
      <MessageInput
        key={chatUser._id}
        text={text}
        onChange={handleInputChange}
        onSend={handleSend}
        replyMessage={replyMessage}
        onCancelReply={() => setReplyMessage(null)}
        onSelectFile={selectFile}
        onSendVoice={handleSendVoice}
        voiceSending={voiceSending}
      />

      {dragging && <div className="drop-overlay">Drop a file to send</div>}

      <MediaPreview
        attachment={attachment}
        caption={caption}
        setCaption={setCaption}
        uploading={uploading}
        progress={uploadProgress}
        error={uploadError}
        onSend={handleSendMedia}
        onCancel={clearAttachment}
      />
    </div>
  );
};

export default ChatWindow;