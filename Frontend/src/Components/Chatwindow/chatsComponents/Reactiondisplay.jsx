import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Nopfp from "../../../assets/nopfp.jpg";
import "../Chatwindow.css"


// userId populated object ho ya plain id, dono chalte hain
const idOf = (v) => String(v?._id || v);

const ReactionDisplay = ({ reactions, user, chatUser, onToggleReaction }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const clickTimer = useRef(null);

  const meId = idOf(user?._id);

  const list = useMemo(
    () => (reactions || []).map((r) => ({ userId: idOf(r.userId), emoji: r.emoji })),
    [reactions]
  );

  // emoji ke hisaab se group: { emoji, count, mine }
  const groups = useMemo(() => {
    const map = new Map();
    list.forEach(({ userId, emoji }) => {
      if (!map.has(emoji)) map.set(emoji, []);
      map.get(emoji).push(userId);
    });
    return [...map.entries()]
      .map(([emoji, ids]) => ({ emoji, count: ids.length, mine: ids.includes(meId) }))
      .sort((a, b) => b.count - a.count);
  }, [list, meId]);

  // saari reactions hat jayein to panel band
  useEffect(() => {
    if (!list.length) setOpen(false);
  }, [list.length]);

  useEffect(() => () => clearTimeout(clickTimer.current), []);

  // Esc se band
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!list.length) return null;

  // single click = panel, double click = react/unreact
  // (thori si delay taake double click par panel na khule)
  const handleChipClick = () => {
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      setTab("all");
      setOpen(true);
    }, 220);
  };

  const handleChipDoubleClick = (emoji) => {
    clearTimeout(clickTimer.current);
    onToggleReaction?.(emoji);
  };

  const getPerson = (id) => {
    if (id === meId) return { name: "You", pic: user?.profilePic };

    if (chatUser?.isGroup) {
      const p = chatUser.participants?.find((x) => idOf(x) === id);
      return { name: p?.name || "Former member", pic: p?.profilePic };
    }

    return { name: chatUser?.name || "User", pic: chatUser?.profilePic };
  };

  // koi tab ka emoji khatam ho gaya to "all" par wapas
  const active = groups.some((g) => g.emoji === tab) ? tab : "all";

  const rows = list
    .filter((r) => active === "all" || r.emoji === active)
    .map((r) => ({ ...r, mine: r.userId === meId, person: getPerson(r.userId) }))
    .sort((a, b) => b.mine - a.mine); // meri reaction sabse upar

  return (
    <>
      <div className="reaction-display">
        {groups.map((g) => (
          <button
            type="button"
            key={g.emoji}
            className={`reaction-item ${g.mine ? "mine" : ""}`}
            onClick={handleChipClick}
            onDoubleClick={() => handleChipDoubleClick(g.emoji)}
            aria-label={`${g.emoji} ${g.count}`}
          >
            <span>{g.emoji}</span>
            {g.count > 1 && <span className="rx-count">{g.count}</span>}
          </button>
        ))}
      </div>

      {open &&
        createPortal(
          <div className="rx-overlay" onClick={() => setOpen(false)}>
            <div
              className="rx-panel"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rx-header">
                <h4>Reactions</h4>
                <button
                  type="button"
                  className="rx-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rx-tabs">
                <button
                  type="button"
                  className={`rx-tab ${active === "all" ? "is-active" : ""}`}
                  onClick={() => setTab("all")}
                >
                  All {list.length}
                </button>
                {groups.map((g) => (
                  <button
                    type="button"
                    key={g.emoji}
                    className={`rx-tab ${active === g.emoji ? "is-active" : ""}`}
                    onClick={() => setTab(g.emoji)}
                  >
                    {g.emoji} {g.count}
                  </button>
                ))}
              </div>

              <div className="rx-list">
                {rows.map((row) => (
                  <div
                    key={row.userId}
                    className={`rx-row ${row.mine ? "is-mine" : ""}`}
                    role={row.mine ? "button" : undefined}
                    tabIndex={row.mine ? 0 : undefined}
                    onClick={
                      row.mine
                        ? () => {
                            setOpen(false);
                            onToggleReaction?.(row.emoji);
                          }
                        : undefined
                    }
                  >
                    <img className="rx-avatar" src={row.person.pic || Nopfp} alt="" />
                    <div className="rx-info">
                      <span className="rx-name">{row.person.name}</span>
                      {row.mine && <small>Tap to remove</small>}
                    </div>
                    <span className="rx-emoji">{row.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ReactionDisplay;