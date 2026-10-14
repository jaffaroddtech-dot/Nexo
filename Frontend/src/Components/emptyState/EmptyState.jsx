import React from "react";
import "./EmptyState.css";

const EmptyState = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <div className="empty-state">
    <div className="empty-state-area">
      <div className="empty-state-icon">{icon}</div>

      <div className="empty-state-text">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>

      {actionLabel && onAction && (
        <div className="empty-state-button">
          <button
            type="button"
            className="nexo-btn-primary empty-state-btn"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  </div>
);

export default EmptyState;