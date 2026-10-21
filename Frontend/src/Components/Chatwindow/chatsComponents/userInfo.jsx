import React, { useState, useEffect, useMemo } from "react";
import { X, FileText, Download, Play, Mail, Info } from "lucide-react";
import Nopfp from "../../../assets/nopfp.jpg";
import { formatLastSeen } from "../../../Helpers/Helper";
import { formatFileSize, getDownloadUrl } from "./mediaUtils.js";

const UserInfo = ({ chatUser, isOnline, messages, onClose }) => {
  const [tab, setTab] = useState("media");
  const [viewer, setViewer] = useState(null); // { url, type, name }

  // Esc: pehle viewer band, phir modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (viewer) setViewer(null);
      else onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewer, onClose]);

  const { visuals, docs } = useMemo(() => {
    const list = (messages || []).filter((m) => !m.isDeleted && m.media?.url);
    return {
      visuals: list
        .filter((m) => m.media.type === "image" || m.media.type === "video")
        .reverse(), // latest pehle
      docs: list.filter((m) => m.media.type === "file").reverse(),
    };
  }, [messages]);

  // ⚠️ jo fields aapke User model mein hon wahi rakhein (bio/about/email)
  const about = chatUser.bio || chatUser.about;
  const email = chatUser.email;

  return (
    <div className="gm-overlay" onClick={onClose}>
      <div
        className="gm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="gm-header">
          <h4>Contact info</h4>
          <button type="button" className="gm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="gm-body">
          {/* HERO */}
          <div className="gm-hero">
            <img
              className="gm-hero-avatar"
              src={chatUser.profilePic || Nopfp}
              alt=""
              onClick={() =>
                chatUser.profilePic &&
                setViewer({ url: chatUser.profilePic, type: "image", name: chatUser.name })
              }
              style={chatUser.profilePic ? { cursor: "zoom-in" } : undefined}
            />
            <h3>{chatUser.name}</h3>
            <span className={`gm-hero-status ${isOnline ? "online" : ""}`}>
              {isOnline ? "Online" : formatLastSeen(chatUser.lastSeen)}
            </span>
          </div>

          {/* DETAILS (sirf jo maujood hon) */}
          {(about || email) && (
            <div className="gm-details">
              {about && (
                <div className="gm-detail">
                  <Info size={18} />
                  <div>
                    <small>About</small>
                    <p>{about}</p>
                  </div>
                </div>
              )}
              {email && (
                <div className="gm-detail">
                  <Mail size={18} />
                  <div>
                    <small>Email</small>
                    <p>{email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SHARED MEDIA */}
          <div className="gm-tabs">
            <button
              type="button"
              className={`gm-tab ${tab === "media" ? "is-active" : ""}`}
              onClick={() => setTab("media")}
            >
              Media ({visuals.length})
            </button>
            <button
              type="button"
              className={`gm-tab ${tab === "docs" ? "is-active" : ""}`}
              onClick={() => setTab("docs")}
            >
              Docs ({docs.length})
            </button>
          </div>

          {tab === "media" &&
            (visuals.length ? (
              <div className="gm-media-grid">
                {visuals.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className="gm-media-tile"
                    onClick={() =>
                      setViewer({ url: m.media.url, type: m.media.type, name: m.media.name })
                    }
                  >
                    {m.media.type === "image" ? (
                      <img src={m.media.url} alt="" loading="lazy" />
                    ) : (
                      <>
                        <video src={m.media.url} preload="metadata" muted />
                        <span className="gm-media-play">
                          <Play size={22} />
                        </span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="gm-empty">No photos or videos shared yet</p>
            ))}

          {tab === "docs" &&
            (docs.length ? (
              <div className="gm-list">
                {docs.map((m) => (
                  <a
                    key={m._id}
                    className="gm-doc"
                    href={getDownloadUrl(m.media.url)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText size={26} />
                    <div className="gm-doc-info">
                      <span className="gm-name">{m.media.name || "Document"}</span>
                      {m.media.size ? <small>{formatFileSize(m.media.size)}</small> : null}
                    </div>
                    <Download size={18} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="gm-empty">No documents shared yet</p>
            ))}

          
        </div>
      </div>

      {/* simple viewer (Chatwindow.css ki .image-viewer class reuse) */}
      {viewer && (
        <div className="image-viewer" onClick={(e) => { e.stopPropagation(); setViewer(null); }}>
          <div className="image-viewer-actions" onClick={(e) => e.stopPropagation()}>
            <a href={getDownloadUrl(viewer.url)} target="_blank" rel="noreferrer" aria-label="Download">
              <Download size={20} />
            </a>
            <button type="button" onClick={() => setViewer(null)} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          {viewer.type === "video" ? (
            <video
              src={viewer.url}
              controls
              autoPlay
              style={{ maxWidth: "94vw", maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img src={viewer.url} alt={viewer.name || ""} onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
};

export default UserInfo;