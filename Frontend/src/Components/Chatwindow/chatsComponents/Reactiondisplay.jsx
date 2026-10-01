import React from "react";

const ReactionDisplay = ({ reactions }) => {
  if (!reactions?.length) return null;

  return (
    <div className="reaction-display">
      {reactions.map((reaction, i) => (
        <span key={i} className="reaction-item">
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
};

export default ReactionDisplay;