import React, { memo } from "react";
import { CheckCheck, Ellipsis, Pin } from "lucide-react";
import MessageContent from "./Messagecontent";
import ReactionPicker from "./Reactionpicker";
import ReactionDisplay from "./Reactiondisplay";
import { formatTime } from "../../../Helpers/Helper";
import { isPinned } from "./pinUtils.js";

const SentMessage = ({
  msg,
  user,
  chatUser,
  isLastMine,
  openReactionId,
  setOpenReactionId,
  openMenuId,
  setOpenMenuId,
  onReact,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  onPinRequest, onUnpin
}) => (
  <div className="sent-message-wrapper" id={`msg-${msg._id}`} tabIndex={-1}>
    <div className="sent-row">
      {!msg.isDeleted && (
        <div className="sent-menu-wrapper"  >
          <ReactionPicker
            isOpen={openReactionId === msg._id}
            onToggle={() =>
              setOpenReactionId(openReactionId === msg._id ? null : msg._id)
            }
            onSelect={(emoji) => onReact(msg, emoji)}
            reactions={msg.reactions}
            meId={user._id}
          />

          <button
            type="button"
            className="sent-menu-btn"
            aria-label="Message options"
            onClick={() =>
              setOpenMenuId(openMenuId === msg._id ? null : msg._id)
            }
          >
            <Ellipsis size={14} />
          </button>

          {openMenuId === msg._id && (
            <div className="sent-menu-dropdown">
              <button type="button" onClick={() => onDeleteForEveryone(msg._id)}>
                Delete for Everyone
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
              <button type="button" onClick={() => onDeleteForMe(msg._id)}>
                Delete for Me
              </button>
              {isPinned(msg) ? (
                <button type="button" className="menu-pin" onClick={() => { onUnpin(msg._id); setOpenMenuId(null); }}>
                  Unpin
                </button>
              ) : (
                <button type="button" className="menu-pin" onClick={() => { onPinRequest(msg); setOpenMenuId(null); }}>
                  Pin
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="sent" onDoubleClick={() => onReply(msg)}>
        <MessageContent msg={msg} user={user} chatUser={chatUser} />

        <div className="message-meta">
          {isPinned(msg) && (
            <span className="pin-flag"><Pin size={11} /></span>
          )}
          <span className="message-time-chat">{formatTime(msg.createdAt)}</span>

          {isLastMine && !msg.isDeleted && (
            <span className={`seen-status ${msg.seen ? "seen" : "delivered"}`}>
              <CheckCheck size={15} />
            </span>
          )}
        </div>
      </div>
    </div>

    <ReactionDisplay
      reactions={msg.reactions}
      user={user}
      chatUser={chatUser}
      onToggleReaction={(emoji) => onReact(msg, emoji)}
    />
  </div>
);

export default memo(SentMessage);