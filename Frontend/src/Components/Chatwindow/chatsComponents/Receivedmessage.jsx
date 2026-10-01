import React from "react";
import { Ellipsis } from "lucide-react";
import MessageContent from "./MessageContent";
import ReactionPicker from "./ReactionPicker";
import ReactionDisplay from "./ReactionDisplay";

const ReceivedMessage = ({
  msg,
  openReactionId,
  setOpenReactionId,
  openMenuId,
  setOpenMenuId,
  onReact,
  onReply,
  onDeleteForMe,
}) => (
  <div className="received-message-wrapper">
    <div className="received-row">
      <div className="received" onDoubleClick={() => onReply(msg)}>
        <MessageContent msg={msg} />
      </div>

      {!msg.isDeleted && (
        <div className="received-menu-wrapper">
          <button
            className="received-menu-btn"
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
          />

          {openMenuId === msg._id && (
            <div className="received-menu-dropdown">
              <button onClick={() => onDeleteForMe(msg._id)}>
                Delete for Me
              </button>
              <button
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

    <ReactionDisplay reactions={msg.reactions} />
  </div>
);

export default ReceivedMessage;