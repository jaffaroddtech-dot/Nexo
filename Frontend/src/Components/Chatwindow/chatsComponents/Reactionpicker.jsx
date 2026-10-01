import React from "react";
import { Smile } from "lucide-react";
import { REACTION_EMOJIS } from "./constants";

const ReactionPicker = ({ isOpen, onToggle, onSelect }) => (
  <>
    <button className="reaction-btn" onClick={onToggle}>
      <Smile size={14} />
    </button>

    {isOpen && (
      <div className="reaction-panel">
        {REACTION_EMOJIS.map((emoji) => (
          <button key={emoji} onClick={() => onSelect(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    )}
  </>
);

export default ReactionPicker;