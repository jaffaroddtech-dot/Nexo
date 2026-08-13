import React, { useState, useEffect, useRef, useMemo } from 'react';
import './Status.css';
import { useSelector } from "react-redux";
import StatusNotLogged from '../../Components/NotLoggedPages/statusNotLogged/statusNotLogged.jsx';

const GRADIENTS = [
  'linear-gradient(135deg,#7C5CFF,#FF6FA5)',
  'linear-gradient(135deg,#4C6FFF,#7C5CFF)',
  'linear-gradient(135deg,#FF9A6C,#FF6FA5)',
  'linear-gradient(135deg,#2FD3A6,#4C6FFF)',
  'linear-gradient(135deg,#FFC24C,#FF6F6F)',
  'linear-gradient(135deg,#8A6CFF,#2FD3A6)',
];
const AVATAR_BG = ['#7C5CFF', '#FF6FA5', '#4C6FFF', '#2FD3A6', '#FF9A6C', '#FFC24C'];
const SEG_DURATION = 4200; // ms per story slide

const initials = (name) => name.split(' ').map((n) => n[0]).join('');

const ringGradient = (count, allViewed) => {
  if (!count) return 'transparent';
  const gap = 7;
  const seg = 360 / count - gap;
  let stops = [];
  let angle = -90;
  for (let i = 0; i < count; i++) {
    const color = allViewed ? '#D8D5E8' : i % 2 === 0 ? '#7C5CFF' : '#FF6FA5';
    stops.push(`${color} ${angle}deg ${angle + seg}deg`);
    stops.push(`transparent ${angle + seg}deg ${angle + seg + gap}deg`);
    angle += seg + gap;
  }
  return `conic-gradient(${stops.join(',')})`;
};

const Status = () => {
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([
    { id: 1, name: 'Emma Wilson', time: '10m ago', avatar: AVATAR_BG[0], viewed: 0, segs: [
      { bg: GRADIENTS[0], caption: 'This is some awesome thinking! 💡', font: 'a' },
      { bg: GRADIENTS[3], caption: 'Coffee first, then conquer ☕', font: 'b' },
    ]},
    { id: 2, name: 'Cameron Perez', time: '22m ago', avatar: AVATAR_BG[1], viewed: 0, segs: [
      { bg: GRADIENTS[1], caption: 'What terrific math skills 📐', font: 'a' },
    ]},
    { id: 3, name: 'Emily Johnson', time: '1h ago', avatar: AVATAR_BG[2], viewed: 0, segs: [
      { bg: GRADIENTS[2], caption: 'You are an amazing writer ✍️', font: 'a' },
      { bg: GRADIENTS[4], caption: 'Drafting chapter three tonight', font: 'b' },
    ]},
    { id: 4, name: 'Brayden Fleming', time: '3h ago', avatar: AVATAR_BG[3], viewed: 1, segs: [
      { bg: GRADIENTS[5], caption: 'Wow — you have improved so much!', font: 'a' },
    ]},
    { id: 5, name: 'Wyatt Perry', time: '5h ago', avatar: AVATAR_BG[4], viewed: 1, segs: [
      { bg: GRADIENTS[3], caption: "Nice idea. Let's ship it 🚀", font: 'a' },
    ]},
  ]);

  const [myStatus, setMyStatus] = useState({ segs: [] });

  const unseen = useMemo(() => users.filter((u) => u.viewed < u.segs.length), [users]);
  const seen = useMemo(() => users.filter((u) => u.viewed >= u.segs.length), [users]);

  const getUserById = (id) =>
    id === 'me'
      ? { id: 'me', name: 'My Status', time: 'Just now', avatar: 'linear-gradient(135deg,#FFB86C,#FF6FA5)', segs: myStatus.segs }
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
    let ids;
    if (id === 'me') ids = ['me'];
    else ids = [...unseen.map((u) => u.id), ...seen.map((u) => u.id)];
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
    if (!viewerOpen || !activeUser || activeUser.id === 'me') return;
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
  const [composerFont, setComposerFont] = useState('a');
  const [composerText, setComposerText] = useState('');
  const textareaRef = useRef(null);

  const openComposer = () => {
    setComposerText('');
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

  const renderRow = (u) => {
    const allViewed = u.viewed >= u.segs.length;
    return (
      <div className="status-item" key={u.id} onClick={() => openViewer(u.id)}>
        <div className="ring" style={{ background: ringGradient(u.segs.length, allViewed) }}>
          <div className="ring-inner">
            <div className="avatar" style={{ background: u.avatar }}>
              {initials(u.name)}
            </div>
          </div>
        </div>
        <div className="flex-grow-1 min-w-0">
          <h6 className="mb-0">{u.name}</h6>
          <small>{u.segs.length} update{u.segs.length > 1 ? 's' : ''}</small>
        </div>
        <small className="row-time">{u.time}</small>
      </div>
    );
  };

  if (!user) {
    return <StatusNotLogged />;
  }

  return (
    <div className="Main">
      <div className="container-fluid p-0 status-page">
        <div className="main-status d-flex">

          {/* Left Panel */}
          <div className="status-sidebar">
            <div className="p-4 border-bottom">
              <h3 className="fw-bold mb-1">Status</h3>
              <small className="text-muted">Updates disappear after 24 hours</small>
            <div className="pt-2">
              <input className="status-search" placeholder="Search status..." />
            </div>
            </div>


            <div className="status-list">
              {/* My status */}
              <div
                className="status-item"
                onClick={() => (myStatus.segs.length ? openViewer('me') : openComposer())}
              >
                {myStatus.segs.length ? (
                  <div className="ring" style={{ background: ringGradient(myStatus.segs.length, false) }}>
                    <div className="ring-inner">
                      <div className="avatar" style={{ background: 'linear-gradient(135deg,#FFB86C,#FF6FA5)' }}>
                        You
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="avatar avatar-dashed">
                    <span className="add-plus">+</span>
                  </div>
                )}
                <div className="flex-grow-1">
                  <h6 className="mb-0">My Status</h6>
                  <small>
                    {myStatus.segs.length
                      ? `${myStatus.segs.length} update${myStatus.segs.length > 1 ? 's' : ''} · Tap to add more`
                      : 'Add to your status'}
                  </small>
                </div>
              </div>

              {unseen.length > 0 && (
                <>
                  <p className="section-title">Recent Updates</p>
                  {unseen.map(renderRow)}
                </>
              )}

              {seen.length > 0 && (
                <>
                  <p className="section-title">Viewed Status</p>
                  {seen.map(renderRow)}
                </>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="status-view">
            {!viewerOpen && !composerOpen && (
              <div className="text-center text">
                <div className="display-2">
                  
                </div>
                <h4 className="mt-3">Select The Status You Want To View</h4>
              </div>
            )}

            {/* ---------- Story viewer ---------- */}
            {viewerOpen && activeUser && activeSeg && (
              <div className="viewer-overlay">
                <button className="nav-arrow prev" onClick={goPrevSeg}>‹</button>

                <div
                  className={`slide ${activeSeg.font === 'b' ? 'font-b' : ''}`}
                  style={{ background: activeSeg.bg }}
                  onMouseDown={() => setIsPaused(true)}
                  onMouseUp={() => setIsPaused(false)}
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                >
                  <div className="bars">
                    {activeUser.segs.map((_, i) => (
                      <div className="bar" key={i}>
                        <span
                          className={
                            i < activeSegIdx ? 'bar-fill filled' : i === activeSegIdx ? 'bar-fill active' : 'bar-fill'
                          }
                          style={
                            i === activeSegIdx
                              ? { animationDuration: `${SEG_DURATION}ms`, animationPlayState: isPaused ? 'paused' : 'running' }
                              : undefined
                          }
                          onAnimationEnd={i === activeSegIdx ? goNextSeg : undefined}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="viewer-head">
                    <div className="av" style={{ background: activeUser.avatar }}>
                      {activeUser.id !== 'me' ? initials(activeUser.name) : ''}
                    </div>
                    <div>
                      <div className="who">{activeUser.name}</div>
                      <div className="when">{activeUser.time}</div>
                    </div>
                    <button className="close" onClick={closeViewer}>✕</button>
                  </div>

                  <div className="caption">{activeSeg.caption}</div>

                  <div className="tap-zone left" onClick={goPrevSeg}></div>
                  <div className="tap-zone right" onClick={goNextSeg}></div>

                  <div className="reply-row">
                    <input type="text" placeholder="Reply..." />
                    <button>♥</button>
                  </div>
                </div>

                <button className="nav-arrow next" onClick={goNextSeg}>›</button>
              </div>
            )}

            {/* ---------- Composer ---------- */}
            {composerOpen && (
              <div className="composer-overlay">
                <div
                  className={`composer-card ${composerFont === 'b' ? 'font-b' : ''}`}
                  style={{ background: GRADIENTS[composerBgIdx] }}
                >
                  <div className="composer-top">
                    <button onClick={() => setComposerOpen(false)}>✕</button>
                    <button onClick={() => setComposerFont((f) => (f === 'a' ? 'b' : 'a'))}>Aa</button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="composer-textarea"
                    maxLength={120}
                    rows={4}
                    placeholder="Type a status..."
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                  />

                  <div className="swatches">
                    {GRADIENTS.map((g, i) => (
                      <div
                        key={i}
                        className={`swatch ${i === composerBgIdx ? 'selected' : ''}`}
                        style={{ background: g }}
                        onClick={() => setComposerBgIdx(i)}
                      />
                    ))}
                  </div>

                  <div className="composer-bottom">
                    <span></span>
                    <button className="add-btn" onClick={addStatus}>
                      + Add to status
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Status;