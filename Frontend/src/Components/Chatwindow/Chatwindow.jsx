import React, { useState, useEffect } from "react";
import "./Chatwindow.css";
import useChatWindow from "./chatsComponents/Usechatwindow";
import ChatHeader from "./chatsComponents/Chatheader";
import SentMessage from "./chatsComponents/Sentmessage";
import UserInfo from "./chatsComponents/userInfo";
import ReceivedMessage from "./chatsComponents/Receivedmessage";
import MessageInput from "./chatsComponents/Messageinput";
import MediaPreview from "./chatsComponents/Mediapreview";
import PinnedBanner from "./chatsComponents/PinnedBanner";
import PinDurationModal from "./chatsComponents/PinDurationModal";
import { MessageSquareText } from "lucide-react";
import EmptyState from "../emptyState/EmptyState";

const ChatWindow = ({ chatUser, onMessageSent, onBack, onOpenInfo,}) => {
  const {
    user,
    onlineUsers,
    messages,
    text,
    isTyping,
    typingLabel,
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
    handlePin,       
    handleUnpin,     
    pinnedMessages, 
    voiceSending,
  } = useChatWindow(chatUser, onMessageSent);

  const [dragging, setDragging] = useState(false);
  const [pinTarget, setPinTarget] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // chat badle to info band
  useEffect(() => {
    setShowInfo(false);
    setPinTarget(null);
  }, [chatUser?._id]);


  if (!chatUser) {
    return (
      <EmptyState
        icon={<MessageSquareText />}
        title="Choose a conversation"
        subtitle="Pick a chat from the list or start a new one to begin messaging."
      />
    );
  }

  const lastMineIndex = messages.reduce(
    (last, m, i) => (!m.isSystem && String(m.senderId) === String(user._id) ? i : last),
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
    onPinRequest: setPinTarget,
    onUnpin: handleUnpin
  };

  const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes("Files");

  const onDragOver = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  };

  const onDrop = (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };
  const jumpToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("msg-highlight");
    setTimeout(() => el.classList.remove("msg-highlight"), 1500);
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
        meId={user._id}
        isTyping={isTyping}
        typingLabel={typingLabel}
        isOnline={onlineUsers.includes(chatUser._id)}
        onBack={onBack}
        onOpenInfo={chatUser.isGroup ? onOpenInfo : () => setShowInfo(true)}
      />
      <PinnedBanner pins={pinnedMessages} onJump={jumpToMessage} />
      <div
        className="chat-body"
        onLoadCapture={handleMediaLoad}
        onLoadedMetadataCapture={handleMediaLoad}
      >
        {messages.map((msg, index) => {
          if (msg.isSystem) {
            return msg.systemText ? (
              <div key={msg._id} className="system-message">
                <span>{msg.systemText}</span>
              </div>
            ) : null;
          }

          return String(msg.senderId) === String(user._id) ? (
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
          );
        })}

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
      {showInfo && !chatUser.isGroup && (
        <UserInfo
          chatUser={chatUser}
          isOnline={onlineUsers.includes(chatUser._id)}
          messages={messages}
          onClose={() => setShowInfo(false)}
        />
      )}
      {pinTarget && (
        <PinDurationModal
          message={pinTarget}
          onConfirm={handlePin}
          onClose={() => setPinTarget(null)}
        />
      )}
    </div>
  );
};

export default ChatWindow;