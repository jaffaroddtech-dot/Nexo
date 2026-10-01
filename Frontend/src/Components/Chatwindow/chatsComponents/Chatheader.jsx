import React from "react";
import { Phone, Video, Info } from "lucide-react";
import Nopfp from "../../../assets/nopfp.jpg";
import { formatLastSeen } from "../../../Helpers/Helper";

const ChatHeader = ({ chatUser, isTyping, isOnline }) => (
  <div className="chat-header">
    <img
      src={chatUser.profilePic || Nopfp}
      alt=""
      height={40}
      className="profile-image"
    />

    <div className="chat-user-info w-100 d-flex justify-content-between align-items-center">
      <div>
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

      <div className="chat-actions d-flex gap-4 align-items-center">
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