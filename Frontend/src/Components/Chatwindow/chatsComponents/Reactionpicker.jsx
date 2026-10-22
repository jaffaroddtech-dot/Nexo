import React from "react";
import { Smile } from "lucide-react";
import { REACTION_EMOJIS } from "./constants";
import "../Chatwindow.css";

// userId populated object ho ya plain id, dono chalte hain
const idOf = (v) => String(v?._id || v);

const ReactionPicker = ({ isOpen, onToggle, onSelect, reactions, meId }) => {
  // mera current reaction (agar hai)
  const myEmoji = reactions?.find((r) => idOf(r.userId) === String(meId))?.emoji;

  return (
    <>
      <button
        type="button"
        className="reaction-btn"
        aria-label="React to message"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <Smile size={14} />
      </button>

      {isOpen && (
        <div className="reaction-panel">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className={emoji === myEmoji ? "is-selected" : undefined}
              aria-label={`React with ${emoji}`}
              aria-pressed={emoji === myEmoji}
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default ReactionPicker;