import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Type,
  Check,
  CircleDashed,
  Image as ImageIcon,
  Trash2,
  Eye,
  Camera,
  Loader2,
} from "lucide-react";
import EmptyState from "../../Components/emptyState/EmptyState";
import "./Status.css";
import StatusNotLogged from "../../Components/NotLoggedPages/statusNotLogged/statusNotLogged.jsx";
import {
  getStatus,
  createStatus,
  markStatusAsSeen,
  deleteStatus,
  likeStatus,
  replyStatus
} from "../../../Apis/status.js";

/* =========================
   CONSTANTS + HELPERS
========================= */
const GRADIENTS = [
  "linear-gradient(135deg, #7758f9 0%, #4b2fd0 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #0f766e 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
  "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
];
const MAX_CHARS = 250;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // keep in sync with mediaMiddleware.js
const TEXT_DURATION = 5000;
const IMAGE_DURATION = 5000;
const MAX_VIDEO_DURATION = 30000;
const AVATAR_COLORS = ["#7758f9", "#5b6cf0", "#a855f7", "#ec4899", "#0ea5e9", "#10b981", "#f59e0b"];

const getId = (x) => (x && typeof x === "object" ? x._id || x.id : x);

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const colorFor = (name = "") =>
  AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const formatTime = (d) => {
  const date = new Date(d);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? `Today, ${time}` : `Yesterday, ${time}`;
};

const plural = (n) => `${n} update${n === 1 ? "" : "s"}`;

// one arc per update; viewed arcs go dim
const ringGradient = (flags) => {
  const count = flags.length;
  if (!count) return "transparent";
  const gap = count > 1 ? 7 : 0;
  const seg = 360 / count - gap;
  const stops = [];
  let angle = -90;
  flags.forEach((viewed) => {
    const color = viewed ? "#3b3d6e" : "#8b6cff";
    stops.push(`${color} ${angle}deg ${angle + seg}deg`);
    if (gap) stops.push(`transparent ${angle + seg}deg ${angle + seg + gap}deg`);
    angle += seg + gap;
  });
  return `conic-gradient(${stops.join(",")})`;
};

const Avatar = ({ user, className, label }) =>
  user?.profilePic ? (
    <img className={className} src={user.profilePic} alt={user.fullName || "avatar"} draggable={false} />
  ) : (
    <div className={className} style={{ background: colorFor(user?.fullName) }}>
      {label ?? initials(user?.fullName)}
    </div>
  );

/* =========================
   COMPONENT
========================= */
// socket (optional): your socket.io client, used for live "newStatus" / "statusDeleted"
// onReply (optional): (user, status, text) => void, wire it to your chat send function
const Status = ({ socket, onReply }) => {
  const { user } = useSelector((state) => state.auth);
  const myId = String(getId(user) || "");
  const meUser = { fullName: user?.fullName || user?.name || "You", profilePic: user?.profilePic };

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // viewer
  const [viewer, setViewer] = useState(null); // { queue: [userId], userIdx, segIdx }
  const [isPaused, setIsPaused] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [ready, setReady] = useState({ id: null, ms: 0 });
  const [replyText, setReplyText] = useState("");
  const [replyFocused, setReplyFocused] = useState(false);
  const replyInputRef = useRef(null);
  const [liked, setLiked] = useState({});
  const videoRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [mode, setMode] = useState("text"); // "text" | "media"
  const [bgIdx, setBgIdx] = useState(0);
  const [font, setFont] = useState("a");
  const [composerText, setComposerText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState("");
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  /* ---------- responsive ---------- */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---------- fetch ---------- */
  const fetchStatuses = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setLoadError("");
      const res = await getStatus();
      setGroups(res.groupedStatuses || []);
    } catch (err) {
      if (!silent) {
        setLoadError(err?.response?.data?.message || err?.message || "Could not load status updates");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Like a status (optimistic)
  const handleLikeStatus = async () => {
    if (!activeStatus) return;

    setLiked((prev) => ({
      ...prev,
      [activeStatus._id]: !prev[activeStatus._id],
    }));


    try {
      const res = await likeStatus(
        activeStatus._id
      );

      setGroups((prev) =>
        prev.map((group) => ({
          ...group,
          statuses: group.statuses.map(
            (status) =>
              status._id === activeStatus._id
                ? res.updatedStatus
                : status
          ),
        }))
      );
    } catch (error) {
      console.log(error);
    }
  };


  // Reply to status
  const sendReply = async (text) => {
    const t = text.trim();

    if (!t || !activeStatus || !activeGroup) return;

    try {
      await replyStatus(activeStatus._id, { text: t });
      setReplyText("");
      replyInputRef.current?.blur();
      setReplyFocused(false);
    } catch (error) {
      console.log(error);
    }
  };


  // initial load + fallback refresh (every 30s and when the tab becomes visible again)
  useEffect(() => {
    if (!user) return;
    fetchStatuses();

    const refresh = () => fetchStatuses(true);
    const timer = setInterval(refresh, 30000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  /* ---------- state patch helpers ---------- */
  const addToGroups = (st) =>
    setGroups((prev) => {
      const uid = String(getId(st.userId));
      const idx = prev.findIndex((g) => String(getId(g.user)) === uid);
      if (idx >= 0) {
        return prev.map((g, i) =>
          i !== idx || g.statuses.some((s) => s._id === st._id)
            ? g
            : { ...g, statuses: [...g.statuses, st] }
        );
      }
      return [...prev, { user: st.userId, statuses: [st] }];
    });

  const removeFromGroups = (statusId) =>
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, statuses: g.statuses.filter((s) => s._id !== statusId) }))
        .filter((g) => g.statuses.length)
    );

  /* ---------- live updates ---------- */
  useEffect(() => {
    if (!socket) return;
    const onNew = (st) => addToGroups(st);
    const onDeleted = ({ statusId }) => removeFromGroups(statusId);
    socket.on("newStatus", onNew);
    socket.on("statusDeleted", onDeleted);
    return () => {
      socket.off("newStatus", onNew);
      socket.off("statusDeleted", onDeleted);
    };
  }, [socket]);

  /* ---------- derived data ---------- */
  const hasViewed = (s) => (s.viewers || []).some((v) => String(getId(v.userId)) === myId);

  const normalized = useMemo(
    () =>
      groups.map((g) => {
        const statuses = [...g.statuses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return { ...g, statuses };
      }),
    [groups]
  );

  const myGroup = normalized.find((g) => String(getId(g.user)) === myId);

  const { unseenAll, seenAll } = useMemo(() => {
    const others = normalized
      .filter((g) => String(getId(g.user)) !== myId)
      .map((g) => {
        const flags = g.statuses.map(hasViewed);
        return {
          ...g,
          flags,
          allViewed: flags.every(Boolean),
          latest: g.statuses[g.statuses.length - 1].createdAt,
        };
      })
      .sort((a, b) => new Date(b.latest) - new Date(a.latest));
    return {
      unseenAll: others.filter((g) => !g.allViewed),
      seenAll: others.filter((g) => g.allViewed),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, myId]);

  const q = search.trim().toLowerCase();
  const matches = (g) => !q || (g.user?.fullName || "").toLowerCase().includes(q);
  const unseen = unseenAll.filter(matches);
  const seen = seenAll.filter(matches);

  const activeGroup = viewer
    ? normalized.find((g) => String(getId(g.user)) === String(viewer.queue[viewer.userIdx]))
    : null;
  const activeStatus = activeGroup ? activeGroup.statuses[viewer.segIdx] : null;
  const isMine = !!activeGroup && String(getId(activeGroup.user)) === myId;

  const segDuration = !activeStatus
    ? null
    : activeStatus.type === "text"
      ? TEXT_DURATION
      : ready.id === activeStatus._id
        ? ready.ms
        : null;

  // reply focus aur delete modal khule hon to status ruka rahe
  const paused = isPaused || viewersOpen || replyFocused || showDeleteModal;
  const stageOpen = !!viewer || composerOpen;

  /* ---------- viewer navigation ---------- */
  const closeViewer = () => {
    setViewer(null);
    setViewersOpen(false);
    setIsPaused(false);
    setReplyFocused(false);
    setReplyText("");
  };

  const startIndex = (uid) => {
    if (String(uid) === myId) return 0;
    const g = normalized.find((x) => String(getId(x.user)) === String(uid));
    const i = g ? g.statuses.findIndex((s) => !hasViewed(s)) : -1;
    return i < 0 ? 0 : i;
  };

  const openViewer = (uid) => {
    uid = String(uid);
    const queue =
      uid === myId ? [uid] : [...unseenAll, ...seenAll].map((g) => String(getId(g.user)));
    const userIdx = queue.indexOf(uid);
    if (userIdx < 0) return;
    setComposerOpen(false);
    setIsPaused(false);
    setViewersOpen(false);
    setReplyFocused(false);
    setViewer({ queue, userIdx, segIdx: startIndex(uid) });
  };

  const goNextSeg = () => {
    if (!viewer || !activeGroup) return;
    if (viewer.segIdx + 1 < activeGroup.statuses.length) {
      setViewer({ ...viewer, segIdx: viewer.segIdx + 1 });
    } else if (viewer.userIdx + 1 < viewer.queue.length) {
      const nextUid = viewer.queue[viewer.userIdx + 1];
      setViewer({ ...viewer, userIdx: viewer.userIdx + 1, segIdx: startIndex(nextUid) });
    } else {
      closeViewer();
    }
  };

  const goPrevSeg = () => {
    if (!viewer) return;
    if (viewer.segIdx > 0) setViewer({ ...viewer, segIdx: viewer.segIdx - 1 });
    else if (viewer.userIdx > 0) setViewer({ ...viewer, userIdx: viewer.userIdx - 1, segIdx: 0 });
  };

  const navRef = useRef({});
  navRef.current = { goNextSeg, goPrevSeg };

  // viewer points at something that no longer exists (expired / deleted)
  useEffect(() => {
    if (viewer && (!activeGroup || !activeStatus)) closeViewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, activeGroup, activeStatus]);

  // mark as seen (optimistic)
  useEffect(() => {
    if (!activeStatus || isMine || hasViewed(activeStatus)) return;
    const id = activeStatus._id;
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        statuses: g.statuses.map((s) =>
          s._id === id
            ? { ...s, viewers: [...(s.viewers || []), { userId: myId, viewedAt: new Date().toISOString() }] }
            : s
        ),
      }))
    );
    markStatusAsSeen(id).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus?._id]);

  // keep <video> in sync with pause state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else {
      v.play().catch(() => {
        v.muted = true; // autoplay with sound can be blocked
        v.play().catch(() => { });
      });
    }
  }, [paused, activeStatus?._id, segDuration]);

  const handleDelete = async () => {
    if (!activeStatus) return;

    const id = activeStatus._id;

    setIsPaused(true);

    try {
      await deleteStatus(id);

      const remaining =
        activeGroup.statuses.length - 1;

      removeFromGroups(id);

      if (remaining <= 0) {
        closeViewer();
      } else {
        setViewer((v) => ({
          ...v,
          segIdx: Math.min(
            v.segIdx,
            remaining - 1
          ),
        }));
      }

      setShowDeleteModal(false);
      setIsPaused(false);

    } catch (err) {
      setIsPaused(false);

      console.log(err);
    }
  };

  /* ---------- composer ---------- */
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openComposer = (startMode = "text") => {
    closeViewer();
    setMode(startMode);
    setComposerText("");
    setFile(null);
    setComposerError("");
    setComposerOpen(true);
    if (startMode === "text") setTimeout(() => textareaRef.current?.focus(), 60);
    else setTimeout(() => fileRef.current?.click(), 60);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setFile(null);
    setComposerError("");
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setComposerText("");
    setComposerError("");
    if (m === "text") setFile(null);
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setComposerError("Choose a photo or a video");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setComposerError("File is too large (max 25 MB)");
      return;
    }
    setComposerError("");
    setFile(f);
    setMode("media");
  };

  const canPost = mode === "text" ? !!composerText.trim() : !!file;

  const submitStatus = async () => {
    if (!canPost || posting) return;
    const fd = new FormData();
    if (mode === "text") {
      fd.append("type", "text");
      fd.append("text", composerText.trim());
      fd.append("backgroundColor", GRADIENTS[bgIdx]);
      fd.append("font", font);
    } else {
      fd.append("type", file.type.startsWith("video/") ? "video" : "image");
      fd.append("text", composerText.trim());
      fd.append("file", file); // field name must match upload.single("file")
    }
    try {
      setPosting(true);
      setComposerError("");
      const res = await createStatus(fd);
      if (res?.populatedStatus) addToGroups(res.populatedStatus);
      else await fetchStatuses();
      closeComposer();
    } catch (err) {
      setComposerError(err?.response?.data?.message || err?.message || "Could not post status");
    } finally {
      setPosting(false);
    }
  };

  /* ---------- keyboard ---------- */
  useEffect(() => {
    if (!stageOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        if (viewersOpen) setViewersOpen(false);
        else {
          closeViewer();
          closeComposer();
        }
        return;
      }
      const tag = e.target?.tagName;
      if (!viewer || composerOpen || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") navRef.current.goNextSeg();
      if (e.key === "ArrowLeft") navRef.current.goPrevSeg();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageOpen, viewersOpen, viewer, composerOpen]);

  /* ---------- render helpers ---------- */
  const renderRow = (g) => {
    const uid = String(getId(g.user));
    return (
      <div
        key={uid}
        role="button"
        tabIndex={0}
        className="st-item"
        onClick={() => openViewer(uid)}
        onKeyDown={(e) => e.key === "Enter" && openViewer(uid)}
      >
        <div className="st-ring" style={{ background: ringGradient(g.flags) }}>
          <div className="st-ring-inner">
            <Avatar user={g.user} className="st-avatar" />
          </div>
        </div>
        <div className="st-info">
          <h6 className="st-name">{g.user?.savedName}</h6>
          <p className="st-sub">{plural(g.statuses.length)}</p>
        </div>
        <span className="st-time">{formatTime(g.latest)}</span>
      </div>
    );
  };

  if (!user) return <StatusNotLogged />;

  const viewerCount = isMine ? (activeStatus.viewers || []).length : 0;
  const myViewers = isMine
    ? [...(activeStatus.viewers || [])].sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
    : [];
  const myLatest = myGroup?.statuses[myGroup.statuses.length - 1];

  return (
    <div className="st-main">
      {/* ================= LEFT: LIST ================= */}
      {(!isMobile || !stageOpen) && (
        <div className="st-left">
          <div className="st-header">
            <div className="st-title-row">
              <div>
                <h3 className="st-title">Status</h3>
                <span className="st-count">Updates disappear after 24 hours</span>
              </div>
              <button type="button" className="st-add" title="Add status" onClick={() => openComposer("text")}>
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
              onClick={() => (myGroup ? openViewer(myId) : openComposer("text"))}
              onKeyDown={(e) => e.key === "Enter" && (myGroup ? openViewer(myId) : openComposer("text"))}
            >
              {myGroup ? (
                <div className="st-ring" style={{ background: ringGradient(myGroup.statuses.map(() => false)) }}>
                  <div className="st-ring-inner">
                    <Avatar user={meUser} className="st-avatar" />
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
                <h6 className="st-name">My status</h6>
                <p className="st-sub">
                  {myGroup
                    ? `${plural(myGroup.statuses.length)} · ${formatTime(myLatest.createdAt)}`
                    : "Add to your status"}
                </p>
              </div>
              {myGroup && (
                <button
                  type="button"
                  className="st-mini-btn"
                  title="Add another update"
                  aria-label="Add another update"
                  onClick={(e) => {
                    e.stopPropagation();
                    openComposer("text");
                  }}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {loading && (
              <div className="st-empty">
                <Loader2 size={26} className="st-spin" />
                <p>Loading updates</p>
              </div>
            )}

            {!loading && loadError && (
              <div className="st-empty">
                <p>{loadError}</p>
                <button type="button" className="st-retry" onClick={() => fetchStatuses()}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !loadError && unseen.length > 0 && (
              <div className="st-group">
                <h5 className="st-section">Recent updates</h5>
                {unseen.map(renderRow)}
              </div>
            )}

            {!loading && !loadError && seen.length > 0 && (
              <div className="st-group">
                <h5 className="st-section">Viewed</h5>
                {seen.map(renderRow)}
              </div>
            )}

            {!loading && !loadError && unseen.length === 0 && seen.length === 0 && (
              <div className="st-empty">
                <CircleDashed size={34} />
                <p>{q ? "No status matches your search" : "No updates from others yet"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= RIGHT: STAGE ================= */}
      {(!isMobile || stageOpen) && (
        <div className="st-right">
          {!stageOpen && (
            <EmptyState
              icon={<Camera />}
              title="Select a status"
              subtitle="Tap on a status from the list to view it."
            />
          )}
          {/* ---------- Viewer ---------- */}
          {viewer && activeGroup && activeStatus && (
            <div className="st-stage">
              <button type="button" className="st-nav prev" onClick={goPrevSeg} aria-label="Previous">
                <ChevronLeft size={20} />
              </button>

              <div
                className={`st-slide ${activeStatus.font === "b" ? "font-b" : ""}`}
                style={{
                  background:
                    activeStatus.type === "text" ? activeStatus.backgroundColor || GRADIENTS[0] : "#05060f",
                }}
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
              >
                {activeStatus.type === "image" && (
                  <img
                    key={activeStatus._id}
                    className="st-media"
                    src={activeStatus.mediaUrl}
                    alt=""
                    draggable={false}
                    onLoad={() => setReady({ id: activeStatus._id, ms: IMAGE_DURATION })}
                    onError={() => setReady({ id: activeStatus._id, ms: IMAGE_DURATION })}
                  />
                )}

                {activeStatus.type === "video" && (
                  <video
                    key={activeStatus._id}
                    ref={videoRef}
                    className="st-media"
                    src={activeStatus.mediaUrl}
                    playsInline
                    autoPlay
                    onLoadedMetadata={(e) =>
                      setReady({
                        id: activeStatus._id,
                        ms: Math.min((e.target.duration || 15) * 1000, MAX_VIDEO_DURATION),
                      })
                    }
                    onError={() => setReady({ id: activeStatus._id, ms: IMAGE_DURATION })}
                  />
                )}

                {activeStatus.type !== "text" && segDuration === null && (
                  <Loader2 size={30} className="st-spin st-media-loader" />
                )}

                {activeStatus.type === "text" && <div className="st-caption">{activeStatus.text}</div>}
                {activeStatus.type !== "text" && activeStatus.text && (
                  <div className="st-caption st-caption-media">{activeStatus.text}</div>
                )}

                {/* progress bars */}
                <div className="st-bars">
                  {activeGroup.statuses.map((s, i) => {
                    const current = i === viewer.segIdx;
                    const active = current && segDuration !== null;
                    return (
                      <div className="st-bar" key={`${viewer.userIdx}-${s._id}`}>
                        <span
                          className={
                            i < viewer.segIdx
                              ? "st-bar-fill filled"
                              : active
                                ? "st-bar-fill active"
                                : "st-bar-fill"
                          }
                          style={
                            active
                              ? {
                                animationDuration: `${segDuration}ms`,
                                animationPlayState: paused ? "paused" : "running",
                              }
                              : undefined
                          }
                          onAnimationEnd={active ? goNextSeg : undefined}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* header */}
                <div className="st-viewer-head">
                  <Avatar user={isMine ? meUser : activeGroup.user} className="st-av" />
                  <div>
                    <div className="st-who">{isMine ? "You" : activeGroup.user?.fullName}</div>
                    <div className="st-when">{formatTime(activeStatus.createdAt)}</div>
                  </div>
                  {isMine && (
                    <button
                      type="button"
                      className="st-round-btn st-close"
                      onClick={() => {
                        setShowDeleteModal(true)
                        setIsPaused(true)
                      }}
                      aria-label="Delete status"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={`st-round-btn ${isMine ? "" : "st-close"}`}
                    onClick={closeViewer}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="st-tap left" onClick={goPrevSeg}></div>
                <div className="st-tap right" onClick={goNextSeg}></div>

                {/* footer */}
                {!isMine && (
                  <div
                    className="st-reply"
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={replyInputRef}
                      type="text"
                      placeholder="Reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setReplyFocused(true)}
                      onBlur={() => setReplyFocused(false)}
                      onKeyDown={(e) => e.key === "Enter" && sendReply(replyText)}
                    />
                    <button
                      type="button"
                      aria-label="Send reply"
                      className={`st-send ${replyText.trim() ? "active" : ""}`}
                      disabled={!replyText.trim()}
                      onClick={() => sendReply(replyText)}
                    >
                      <Send size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Like"
                      className={liked[activeStatus._id] ? "st-liked" : ""}
                      onClick={handleLikeStatus}
                    >
                      <Heart size={18} fill={liked[activeStatus._id] ? "currentColor" : "none"} />
                    </button>
                  </div>
                )}

                {isMine && (
                  <button type="button" className="st-views" onClick={() => setViewersOpen(true)}>
                    <Eye size={16} />
                    <span>{viewerCount}</span>
                  </button>
                )}

                {viewersOpen && (
                  <div className="st-sheet-backdrop" onClick={() => setViewersOpen(false)}>
                    <div className="st-sheet" onClick={(e) => e.stopPropagation()}>
                      <div className="st-sheet-head">
                        <h6>Viewed by {viewerCount}</h6>
                        <button
                          type="button"
                          className="st-round-btn"
                          onClick={() => setViewersOpen(false)}
                          aria-label="Close viewers"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="st-sheet-list">
                        {myViewers.length === 0 && <p className="st-sheet-empty">No views yet</p>}
                        {myViewers.map((v, i) => {
                          const hasLiked =
                            activeStatus.likes?.some(
                              (like) =>
                                String(getId(like.userId)) ===
                                String(getId(v.userId))
                            );

                          return (
                            <div
                              className="st-viewer-row"
                              key={String(getId(v.userId)) + i}
                            >
                              <Avatar
                                user={
                                  typeof v.userId === "object"
                                    ? v.userId
                                    : null
                                }
                                className="st-av st-av-lg"
                              />

                              <div className="st-info">
                                <h6 className="st-name">
                                  {
                                    typeof v.userId === "object"
                                      ? v.userId?.savedName
                                      : "Viewer"
                                  }
                                </h6>

                                <p className="st-sub">
                                  {formatTime(v.viewedAt)}
                                </p>
                              </div>

                              {hasLiked && (
                                <Heart
                                  size={16}
                                  fill="#8b6cff"
                                  color="#8b6cff"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {
                  showDeleteModal && (
                    <div
                      className="st-modal-backdrop"
                      onClick={() =>
                        setShowDeleteModal(false)
                      }
                    >
                      <div
                        className="st-modal"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <h3>
                          Delete Status?
                        </h3>

                        <p>
                          This status will be removed
                          permanently.
                        </p>

                        <div className="st-modal-actions">
                          <button
                            className="st-modal-cancel"
                            onClick={() =>
                              setShowDeleteModal(false)
                            }
                          >
                            Cancel
                          </button>

                          <button
                            className="st-modal-delete"
                            onClick={handleDelete}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }
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
                className={`st-composer ${mode === "text" && font === "b" ? "font-b" : ""}`}
                style={{ background: mode === "text" ? GRADIENTS[bgIdx] : "#05060f" }}
              >
                {mode === "media" && file && previewUrl &&
                  (file.type.startsWith("video/") ? (
                    <video className="st-media" src={previewUrl} autoPlay muted loop playsInline />
                  ) : (
                    <img className="st-media" src={previewUrl} alt="Preview" />
                  ))}

                <div className="st-composer-top">
                  <button type="button" className="st-round-btn" onClick={closeComposer} aria-label="Close">
                    <X size={16} />
                  </button>

                  <div className="st-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "text"}
                      className={mode === "text" ? "on" : ""}
                      onClick={() => switchMode("text")}
                    >
                      Text
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "media"}
                      className={mode === "media" ? "on" : ""}
                      onClick={() => switchMode("media")}
                    >
                      Photo / video
                    </button>
                  </div>

                  {mode === "text" ? (
                    <button
                      type="button"
                      className="st-round-btn"
                      onClick={() => setFont((f) => (f === "a" ? "b" : "a"))}
                      aria-label="Change font"
                    >
                      <Type size={16} />
                    </button>
                  ) : file ? (
                    <button
                      type="button"
                      className="st-round-btn"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Choose another file"
                    >
                      <ImageIcon size={16} />
                    </button>
                  ) : (
                    <span className="st-round-spacer" />
                  )}
                </div>

                {mode === "text" && (
                  <textarea
                    ref={textareaRef}
                    className="st-textarea"
                    maxLength={MAX_CHARS}
                    rows={4}
                    placeholder="Type a status..."
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                  />
                )}

                {mode === "media" && !file && (
                  <button type="button" className="st-pick" onClick={() => fileRef.current?.click()}>
                    <ImageIcon size={30} />
                    <span>Choose a photo or video</span>
                    <small>Up to 25 MB</small>
                  </button>
                )}

                {mode === "media" && file && (
                  <input
                    type="text"
                    className="st-caption-input"
                    maxLength={MAX_CHARS}
                    placeholder="Add a caption..."
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitStatus()}
                  />
                )}

                {mode === "text" && (
                  <div className="st-swatches">
                    {GRADIENTS.map((g, i) => (
                      <button
                        type="button"
                        key={i}
                        className={`st-swatch ${i === bgIdx ? "selected" : ""}`}
                        style={{ background: g }}
                        onClick={() => setBgIdx(i)}
                        aria-label={`Background ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {composerError && <div className="st-error">{composerError}</div>}

                <div className="st-composer-bottom">
                  <span className="st-chars">
                    {composerText.length}/{MAX_CHARS}
                  </span>
                  <button type="button" className="st-post" onClick={submitStatus} disabled={!canPost || posting}>
                    {posting ? <Loader2 size={16} className="st-spin" /> : <Check size={16} />}
                    {posting ? "Posting" : "Add to status"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={onPickFile} />
    </div>
  );
};

export default Status;