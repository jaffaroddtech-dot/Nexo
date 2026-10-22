import React, { memo } from "react";
import { Ellipsis } from "lucide-react";
import MessageContent from "./Messagecontent";
import ReactionPicker from "./Reactionpicker";
import ReactionDisplay from "./Reactiondisplay";
import { formatTime } from "../../../Helpers/Helper";
import { getMemberName, getSenderColor } from "../../../../Apis/group";

const ReceivedMessage = ({
  msg,
  openReactionId,
  setOpenReactionId,
  openMenuId,
  setOpenMenuId,
  onReact,
  onReply,
  onDeleteForMe,
  user,
  chatUser,
}) => (
  <div className="received-message-wrapper">
    <div className="received-row">
      <div className="received" onDoubleClick={() => onReply(msg)}>
        {chatUser?.isGroup && (
          <div
            className="group-sender-name"
            style={{ color: getSenderColor(msg.senderId) }}
          >
            {getMemberName(chatUser, msg.senderId)}
          </div>
        )}

        <MessageContent msg={msg} user={user} chatUser={chatUser} />
        <div className="message-meta">
          <span className="message-time-chat">{formatTime(msg.createdAt)}</span>
        </div>
      </div>

      {!msg.isDeleted && (
        <div className="received-menu-wrapper">
          <button
            type="button"
            className="received-menu-btn"
            aria-label="Message options"
            onClick={() =>
              setOpenMenuId(openMenuId === msg._id ? null : msg._id)
            }
          >
            <Ellipsis size={14} />
          </button>

          <ReactionPicker
            isOpen={openReactionId === msg._id}
            onToggle={() =>
              setOpenReactionId(openReactionId === msg._id ? null : msg._id)
            }
            onSelect={(emoji) => onReact(msg, emoji)}
            reactions={msg.reactions}
            meId={user._id}
          />

          {openMenuId === msg._id && (
            <div className="received-menu-dropdown">
              <button type="button" onClick={() => onDeleteForMe(msg._id)}>
                Delete for Me
              </button>
              <button
                type="button"
                onClick={() => {
                  onReply(msg);
                  setOpenMenuId(null);
                }}
              >
                Reply
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    <ReactionDisplay
      reactions={msg.reactions}
      user={user}
      chatUser={chatUser}
      onToggleReaction={(emoji) => onReact(msg, emoji)}
    />
  </div>
);

export default memo(ReceivedMessage);