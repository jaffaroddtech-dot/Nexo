import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Type,
  Check,
  CircleDashed,
} from "lucide-react";
import "./Status.css";
import StatusNotLogged from "../../Components/NotLoggedPages/statusNotLogged/statusNotLogged.jsx";

const GRADIENTS = [
  "linear-gradient(135deg,#7C5CFF,#FF6FA5)",
  "linear-gradient(135deg,#4C6FFF,#7C5CFF)",
  "linear-gradient(135deg,#FF9A6C,#FF6FA5)",
  "linear-gradient(135deg,#2FD3A6,#4C6FFF)",
  "linear-gradient(135deg,#FFC24C,#FF6F6F)",
  "linear-gradient(135deg,#8A6CFF,#2FD3A6)",
];
const AVATAR_BG = ["#7758f9", "#e0589a", "#4c6fff", "#1fb88f", "#f2874f", "#d9a21f"];
const ME_AVATAR = "linear-gradient(135deg,#FFB86C,#FF6FA5)";
const SEG_DURATION = 4200; // ms per story slide
const MAX_CHARS = 120;

const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

// ring made of one arc per update; viewed rings go dim
const ringGradient = (count, allViewed) => {
  if (!count) return "transparent";
  const gap = count > 1 ? 7 : 0;
  const seg = 360 / count - gap;
  const stops = [];
  let angle = -90;
  for (let i = 0; i < count; i++) {
    const color = allViewed ? "#3b3d6e" : i % 2 === 0 ? "#7758f9" : "#b9a8ff";
    stops.push(`${color} ${angle}deg ${angle + seg}deg`);
    if (gap) stops.push(`transparent ${angle + seg}deg ${angle + seg + gap}deg`);
    angle += seg + gap;
  }
  return `conic-gradient(${stops.join(",")})`;
};

const Status = () => {
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([
    { id: 1, name: "Emma Wilson", time: "10m ago", avatar: AVATAR_BG[0], viewed: 0, segs: [
      { bg: GRADIENTS[0], caption: "This is some awesome thinking! 💡", font: "a" },
      { bg: GRADIENTS[3], caption: "Coffee first, then conquer ☕", font: "b" },
    ]},
    { id: 2, name: "Cameron Perez", time: "22m ago", avatar: AVATAR_BG[1], viewed: 0, segs: [
      { bg: GRADIENTS[1], caption: "What terrific math skills 📐", font: "a" },
    ]},
    { id: 3, name: "Emily Johnson", time: "1h ago", avatar: AVATAR_BG[2], viewed: 0, segs: [
      { bg: GRADIENTS[2], caption: "You are an amazing writer ✍️", font: "a" },
      { bg: GRADIENTS[4], caption: "Drafting chapter three tonight", font: "b" },
    ]},
    { id: 4, name: "Brayden Fleming", time: "3h ago", avatar: AVATAR_BG[3], viewed: 1, segs: [
      { bg: GRADIENTS[5], caption: "Wow — you have improved so much!", font: "a" },
    ]},
    { id: 5, name: "Wyatt Perry", time: "5h ago", avatar: AVATAR_BG[4], viewed: 1, segs: [
      { bg: GRADIENTS[3], caption: "Nice idea. Let's ship it 🚀", font: "a" },
    ]},
  ]);

  const [myStatus, setMyStatus] = useState({ segs: [] });
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, search]);

  const unseen = useMemo(() => filtered.filter((u) => u.viewed < u.segs.length), [filtered]);
  const seen = useMemo(() => filtered.filter((u) => u.viewed >= u.segs.length), [filtered]);

  const getUserById = (id) =>
    id === "me"
      ? { id: "me", name: "My Status", time: "Just now", avatar: ME_AVATAR, segs: myStatus.segs }
      : users.find((u) => u.id === id);

  // ---------- viewer state ----------
  const [viewerOpen, setViewerOpen] = useState(false);
  const [queueIds, setQueueIds] = useState([]);
  const [activeUserIdx, setActiveUserIdx] = useState(0);
  const [activeSegIdx, setActiveSegIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeUser = viewerOpen ? getUserById(queueIds[activeUserIdx]) : null;
  const activeSeg = activeUser ? activeUser.segs[activeSegIdx] : null;

  const openViewer = (id) => {
    const ids = id === "me" ? ["me"] : [...unseen, ...seen].map((u) => u.id);
    setQueueIds(ids);
    setActiveUserIdx(Math.max(ids.indexOf(id), 0));
    setActiveSegIdx(0);
    setIsPaused(false);
    setViewerOpen(true);
  };

  const closeViewer = () => setViewerOpen(false);

  const goNextUser = () => {
    if (activeUserIdx + 1 < queueIds.length) {
      setActiveUserIdx((i) => i + 1);
      setActiveSegIdx(0);
    } else {
      closeViewer();
    }
  };

  const goNextSeg = () => {
    if (!activeUser) return;
    if (activeSegIdx + 1 < activeUser.segs.length) setActiveSegIdx((i) => i + 1);
    else goNextUser();
  };

  const goPrevSeg = () => {
    if (activeSegIdx > 0) {
      setActiveSegIdx((i) => i - 1);
    } else if (activeUserIdx > 0) {
      setActiveUserIdx((i) => i - 1);
      setActiveSegIdx(0);
    }
  };

  // mark current segment viewed
  useEffect(() => {
    if (!viewerOpen || !activeUser || activeUser.id === "me") return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id ? { ...u, viewed: Math.max(u.viewed, activeSegIdx + 1) } : u
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, activeUserIdx, activeSegIdx]);

  // ---------- composer state ----------
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerBgIdx, setComposerBgIdx] = useState(0);
  const [composerFont, setComposerFont] = useState("a");
  const [composerText, setComposerText] = useState("");
  const textareaRef = useRef(null);

  const openComposer = () => {
    setComposerText("");
    setViewerOpen(false);
    setComposerOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const addStatus = () => {
    const text = composerText.trim();
    if (!text) return;
    setMyStatus((prev) => ({
      segs: [...prev.segs, { bg: GRADIENTS[composerBgIdx], caption: text, font: composerFont }],
    }));
    setComposerOpen(false);
  };

  // Esc closes viewer / composer
  useEffect(() => {
    if (!viewerOpen && !composerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setViewerOpen(false);
        setComposerOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewerOpen, composerOpen]);

  const stageOpen = viewerOpen || composerOpen;

  const renderRow = (u) => {
    const allViewed = u.viewed >= u.segs.length;
    return (
      <div
        key={u.id}
        role="button"
        tabIndex={0}
        className="st-item"
        onClick={() => openViewer(u.id)}
        onKeyDown={(e) => e.key === "Enter" && openViewer(u.id)}
      >
        <div className="st-ring" style={{ background: ringGradient(u.segs.length, allViewed) }}>
          <div className="st-ring-inner">
            <div className="st-avatar" style={{ background: u.avatar }}>
              {initials(u.name)}
            </div>
          </div>
        </div>
        <div className="st-info">
          <h6 className="st-name">{u.name}</h6>
          <p className="st-sub">
            {u.segs.length} update{u.segs.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className="st-time">{u.time}</span>
      </div>
    );
  };

  if (!user) {
    return <StatusNotLogged />;
  }

  return (
    <div className="st-main">
      {/* LEFT: LIST */}
      {(!isMobile || !stageOpen) && (
        <div className="st-left">
          <div className="st-header">
            <div className="st-title-row">
              <div>
                <h3 className="st-title">Status</h3>
                <span className="st-count">Updates disappear after 24 hours</span>
              </div>
              <button type="button" className="st-add" title="Add status" onClick={openComposer}>
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div className="st-search">
              <Search size={16} />
              <input
                placeholder="Search status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="st-list">
            {/* My status */}
            <div
              role="button"
              tabIndex={0}
              className="st-item"
              onClick={() => (myStatus.segs.length ? openViewer("me") : openComposer())}
              onKeyDown={(e) =>
                e.key === "Enter" && (myStatus.segs.length ? openViewer("me") : openComposer())
              }
            >
              {myStatus.segs.length ? (
                <div className="st-ring" style={{ background: ringGradient(myStatus.segs.length, false) }}>
                  <div className="st-ring-inner">
                    <div className="st-avatar" style={{ background: ME_AVATAR }}>
                      You
                    </div>
                  </div>
                </div>
              ) : (
                <div className="st-ring st-ring-empty">
                  <div className="st-avatar st-avatar-dashed">
                    <Plus size={20} />
                  </div>
                </div>
              )}
              <div className="st-info">
                <h6 className="st-name">My Status</h6>
                <p className="st-sub">
                  {myStatus.segs.length
                    ? `${myStatus.segs.length} update${myStatus.segs.length > 1 ? "s" : ""} · Tap to view`
                    : "Add to your status"}
                </p>
              </div>
            </div>

            {unseen.length > 0 && (
              <div className="st-group">
                <h5 className="st-section">Recent updates</h5>
                {unseen.map(renderRow)}
              </div>
            )}

            {seen.length > 0 && (
              <div className="st-group">
                <h5 className="st-section">Viewed</h5>
                {seen.map(renderRow)}
              </div>
            )}

            {unseen.length === 0 && seen.length === 0 && (
              <div className="st-empty">
                <CircleDashed size={34} />
                <p>No status found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RIGHT: STAGE */}
      {(!isMobile || stageOpen) && (
        <div className="st-right">
          {!stageOpen && (
            <div className="st-placeholder">
              <div className="st-placeholder-logo"></div>
              <h2>Select a status to view</h2>
            </div>
          )}

          {/* ---------- Story viewer ---------- */}
          {viewerOpen && activeUser && activeSeg && (
            <div className="st-stage">
              <button type="button" className="st-nav prev" onClick={goPrevSeg} aria-label="Previous">
                <ChevronLeft size={20} />
              </button>

              <div
                className={`st-slide ${activeSeg.font === "b" ? "font-b" : ""}`}
                style={{ background: activeSeg.bg }}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                <div className="st-bars">
                  {activeUser.segs.map((_, i) => (
                    <div className="st-bar" key={`${activeUserIdx}-${i}`}>
                      <span
                        className={
                          i < activeSegIdx
                            ? "st-bar-fill filled"
                            : i === activeSegIdx
                            ? "st-bar-fill active"
                            : "st-bar-fill"
                        }
                        style={
                          i === activeSegIdx
                            ? {
                                animationDuration: `${SEG_DURATION}ms`,
                                animationPlayState: isPaused ? "paused" : "running",
                              }
                            : undefined
                        }
                        onAnimationEnd={i === activeSegIdx ? goNextSeg : undefined}
                      />
                    </div>
                  ))}
                </div>

                <div className="st-viewer-head">
                  <div className="st-av" style={{ background: activeUser.avatar }}>
                    {activeUser.id !== "me" ? initials(activeUser.name) : "You"}
                  </div>
                  <div>
                    <div className="st-who">{activeUser.name}</div>
                    <div className="st-when">{activeUser.time}</div>
                  </div>
                  <button type="button" className="st-round-btn st-close" onClick={closeViewer} aria-label="Close">
                    <X size={16} />
                  </button>
                </div>

                <div className="st-caption">{activeSeg.caption}</div>

                <div className="st-tap left" onClick={goPrevSeg}></div>
                <div className="st-tap right" onClick={goNextSeg}></div>

                {activeUser.id !== "me" && (
                  <div className="st-reply">
                    <input type="text" placeholder="Reply..." />
                    <button type="button" aria-label="Like">
                      <Heart size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button type="button" className="st-nav next" onClick={goNextSeg} aria-label="Next">
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* ---------- Composer ---------- */}
          {composerOpen && (
            <div className="st-stage">
              <div
                className={`st-composer ${composerFont === "b" ? "font-b" : ""}`}
                style={{ background: GRADIENTS[composerBgIdx] }}
              >
                <div className="st-composer-top">
                  <button type="button" className="st-round-btn" onClick={() => setComposerOpen(false)} aria-label="Close">
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className="st-round-btn"
                    onClick={() => setComposerFont((f) => (f === "a" ? "b" : "a"))}
                    aria-label="Change font"
                  >
                    <Type size={16} />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  className="st-textarea"
                  maxLength={MAX_CHARS}
                  rows={4}
                  placeholder="Type a status..."
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                />

                <div className="st-swatches">
                  {GRADIENTS.map((g, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`st-swatch ${i === composerBgIdx ? "selected" : ""}`}
                      style={{ background: g }}
                      onClick={() => setComposerBgIdx(i)}
                      aria-label={`Background ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="st-composer-bottom">
                  <span className="st-chars">
                    {composerText.length}/{MAX_CHARS}
                  </span>
                  <button
                    type="button"
                    className="st-post"
                    onClick={addStatus}
                    disabled={!composerText.trim()}
                  >
                    <Check size={16} /> Add to status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Status;