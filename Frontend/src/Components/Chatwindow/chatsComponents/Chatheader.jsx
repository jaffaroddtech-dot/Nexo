import React from "react";
import { Phone, Video, Info, ChevronLeft, Users } from "lucide-react";
import Nopfp from "../../../assets/nopfp.jpg";
import { formatLastSeen } from "../../../Helpers/Helper";

const ChatHeader = ({
  chatUser,
  meId,
  isTyping,
  typingLabel,
  isOnline,
  onBack,
  onOpenInfo,
}) => {
  const isGroup = Boolean(chatUser.isGroup);

  // group subtitle: "Ali, Sara, You"
  const groupMembers = isGroup
    ? [...(chatUser.participants || [])]
      .sort((a, b) => (String(a._id) === String(meId)) - (String(b._id) === String(meId)))
      .map((p) => (String(p._id) === String(meId) ? "You" : p.name))
      .join(", ")
    : "";

  return (
    <div className="chat-header">
      {onBack && (
        <button className="chat-back-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={26} />
        </button>
      )}

      {isGroup && !chatUser.profilePic ? (
        <div
          className="chat-header-avatar group-avatar-fallback"
          onClick={onOpenInfo}
          style={{ cursor: "pointer" }}
        >
          <Users size={20} />
        </div>
      ) : (
        <img
          src={chatUser.profilePic || Nopfp}
          alt=""
          className="chat-header-avatar"
          onClick={onOpenInfo}
          style={onOpenInfo ? { cursor: "pointer" } : undefined}
        />
      )}

      <div className="chat-user-info">
        <div
          className="chat-user-text"
          onClick={onOpenInfo}
          style={onOpenInfo ? { cursor: "pointer" } : undefined}
        >
          <h4 className="username p-0 m-0">{chatUser.name}</h4>
          <p className="online-indicator p-0 m-0">
            {isTyping ? (
              isGroup ? typingLabel : "typing..."
            ) : isGroup ? (
              groupMembers
            ) : isOnline ? (
              <span style={{ color: "#16a808" }}>Online</span>
            ) : (
              formatLastSeen(chatUser.lastSeen)
            )}
          </p>
        </div>

        <div className="chat-actions">
          <div className="callIcon">
            <Phone color="#7758f9" />
          </div>
          <div className="videoCallIcon">
            <Video color="#7758f9" />
          </div>
          <div
            className="info"
            onClick={onOpenInfo}
            style={onOpenInfo ? { cursor: "pointer" } : undefined}
          >
            <Info color="#7758f9" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;