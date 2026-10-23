import React, { useState } from "react";
import { Pin } from "lucide-react";
import { getMediaLabel } from "./mediaUtils.js";
import "../Chatwindow.css";

// pins: active pinned messages (newest first)
// onJump(messageId): us message tak scroll + highlight
const PinnedBanner = ({ pins, onJump }) => {
  const [index, setIndex] = useState(0);

  if (!pins.length) return null;

  // pins kam ho jayen to index bahar na nikle
  const current = pins[index % pins.length];
  const position = index % pins.length;

  const handleClick = () => {
    onJump(current._id);
    // WhatsApp ki tarah: tap par agla pin dikhao
    setIndex((position + 1) % pins.length);
  };

  return (
    <div className="pinned-banner" onClick={handleClick} role="button" tabIndex={0}>
      <div className="pinned-banner-bars" aria-hidden="true">
        {pins.map((p, i) => (
          <span key={p._id} className={i === position ? "active" : ""} />
        ))}
      </div>

      <Pin size={16} className="pinned-banner-icon" />

      <div className="pinned-banner-text">
        <span className="pinned-banner-title">
          Pinned message{pins.length > 1 ? ` · ${position + 1} of ${pins.length}` : ""}
        </span>
        <p className="text-white">{getMediaLabel(current)}</p>
      </div>
    </div>
  );
};

export default PinnedBanner;
