import React from "react";
import { Phone, Video, Info, ChevronLeft } from "lucide-react";
import Nopfp from "../../../assets/nopfp.jpg";
import { formatLastSeen } from "../../../Helpers/Helper";

const ChatHeader = ({ chatUser, isTyping, isOnline, onBack }) => (
  <div className="chat-header">
    {onBack && (
      <button className="chat-back-btn" onClick={onBack} aria-label="Back">
        <ChevronLeft size={26} />
      </button>
    )}

    <img
      src={chatUser.profilePic || Nopfp}
      alt=""
      className="chat-header-avatar"
    />

    <div className="chat-user-info">
      <div className="chat-user-text">
        <h4 className="username p-0 m-0">{chatUser.name}</h4>
        <p className="online-indicator p-0 m-0">
          {isTyping ? (
            "typing..."
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
        <div className="info">
          <Info color="#7758f9" />
        </div>
      </div>
    </div>
  </div>
);

export default ChatHeader;