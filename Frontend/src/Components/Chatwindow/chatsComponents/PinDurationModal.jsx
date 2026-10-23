import React, { useState, useEffect } from "react";
import "../Chatwindow.css";

const OPTIONS = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

// onConfirm(messageId, duration) -> { ok, message }
const PinDurationModal = ({ message, onConfirm, onClose }) => {
  const [duration, setDuration] = useState("7d");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await onConfirm(message._id, duration);
    setBusy(false);
    if (res.ok) onClose();
    else setError(res.message || "Could not pin message");
  };

  return (
    <div className="pin-modal-backdrop" onClick={onClose}>
      <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Choose how long your pin lasts</h4>
        <p className="pin-modal-sub">You can unpin anytime.</p>

        <div className="pin-modal-options">
          {OPTIONS.map((o) => (
            <label key={o.value} className={duration === o.value ? "selected" : ""}>
              <input
                type="radio"
                name="pin-duration"
                value={o.value}
                checked={duration === o.value}
                onChange={() => setDuration(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>

        {error && <div className="pin-modal-error">{error}</div>}

        <div className="pin-modal-actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={submit} disabled={busy}>
            {busy ? "Pinning..." : "Pin"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinDurationModal;
