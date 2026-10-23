import React, { useState, useEffect, useRef } from "react";
import { X, LogOut, Check, Users, Camera, UserX } from "lucide-react";
import Nopfp from "../../Assets/nopfp.jpg";
import {
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
    updateGroup,
    updateGroupAvatar,
} from "../../../Apis/group.js";
import './Group.css'

const idOf = (v) => String(v?._id || v);

const GroupInfo = ({ group, me, contacts, onClose, onGroupChange, onLeft }) => {
    const [name, setName] = useState(group.chatName || "");
    const [toAdd, setToAdd] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // confirm popup: { type: "kick", userId, userName } | { type: "leave" }
    const [confirm, setConfirm] = useState(null);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState("");

    const closeConfirm = () => {
        if (confirmBusy) return;
        setConfirm(null);
        setConfirmError("");
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== "Escape") return;
            // confirm khula ho to sirf wahi band ho
            if (confirm) closeConfirm();
            else onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onClose, confirm, confirmBusy]);

    const myId = String(me._id);
    const isAdmin = idOf(group.groupAdmin) === myId;
    const memberIds = new Set(group.participants.map(idOf));
    const addable = contacts.filter((c) => !memberIds.has(String(c._id)));
    const groupPic = group.groupAvatar || group.profilePic;

    // me sabse upar, phir baaki
    const members = [...group.participants].sort(
        (a, b) => (idOf(b) === myId) - (idOf(a) === myId)
    );

    const run = async (fn, after) => {
        setBusy(true);
        setError("");
        try {
            const res = await fn();
            if (res.status) after?.(res);
            else setError(res.message || "Something went wrong");
        } catch (err) {
            setError(err?.response?.data?.message || "Something went wrong");
        } finally {
            setBusy(false);
        }
    };

    const handleRename = () => {
        if (!name.trim() || name.trim() === group.chatName) return;
        run(() => updateGroup(group._id, { chatName: name.trim() }), (res) =>
            onGroupChange(res.group)
        );
    };

    const handleAdd = () => {
        if (!toAdd.length) return;
        run(() => addGroupMembers(group._id, toAdd), (res) => {
            pushSystem(res);
            onGroupChange(res.group);
            setToAdd([]);
        });
    };

    // popup kholo (alert nahi)
    const handleRemove = (userId, userName) => {
        setConfirmError("");
        setConfirm({ type: "kick", userId, userName });
    };

    const handleLeave = () => {
        setConfirmError("");
        setConfirm({ type: "leave" });
    };

    const getConfirmCopy = () => {
        if (confirm?.type === "kick")
            return {
                title: "Remove member?",
                text: `${confirm.userName} will be removed from "${group.chatName}".`,
                action: "Remove",
                loading: "Removing...",
            };
        return {
            title: "Leave group?",
            text: `You will no longer receive messages from "${group.chatName}".`,
            action: "Leave group",
            loading: "Leaving...",
        };
    };

    const handleConfirm = async () => {
        if (!confirm || confirmBusy) return;
        setConfirmBusy(true);
        setConfirmError("");
        try {
            const res =
                confirm.type === "kick"
                    ? await removeGroupMember(group._id, confirm.userId)
                    : await leaveGroup(group._id);

            if (res.status) {
                if (confirm.type === "kick") {
                    pushSystem(res);
                    onGroupChange(res.group);
                    setConfirm(null);
                } else {
                    onLeft(group._id); // Home modal band kar dega
                }
            } else {
                setConfirmError(res.message || "Something went wrong");
            }
        } catch (err) {
            setConfirmError(err?.response?.data?.message || "Something went wrong");
        } finally {
            setConfirmBusy(false);
        }
    };

    const handleAvatar = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return alert("Please select an image");
        if (file.size > 5 * 1024 * 1024) return alert("Max 5MB");

        try {
            setUploading(true);
            const res = await updateGroupAvatar(group._id, file);
            if (res.status) {
                pushSystem(res);
                onGroupChange(res.group);
            }
        } catch (err) {
            alert(err?.response?.data?.message || "Could not update picture");
        } finally {
            setUploading(false);
        }
    };

    const pushSystem = (res) => {
        if (res.systemMessages?.length) {
            window.dispatchEvent(
                new CustomEvent("group-system-messages", { detail: res.systemMessages })
            );
        }
    };

    const toggleAdd = (id) =>
        setToAdd((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    const confirmCopy = confirm ? getConfirmCopy() : null;

    return (
        <>
            <div className="gm-overlay" onClick={onClose}>
                <div className="gm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                    <div className="gm-header">
                        <h4>Group info</h4>
                        <button type="button" className="gm-icon-btn" onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="gm-body">
                        {/* group photo, once */}
                        <div className="group-info-avatar">
                            {groupPic ? (
                                <img src={groupPic} alt="" />
                            ) : (
                                <div className="group-avatar-fallback group-info-fallback">
                                    <Users size={40} />
                                </div>
                            )}

                            {isAdmin && (
                                <>
                                    <button
                                        type="button"
                                        className="group-avatar-edit"
                                        onClick={() => fileRef.current?.click()}
                                        disabled={uploading}
                                        aria-label="Change group photo"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
                                </>
                            )}
                        </div>

                        {isAdmin ? (
                            <div className="gm-rename">
                                <input
                                    className="gm-input"
                                    value={name}
                                    maxLength={60}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="gm-btn primary"
                                    onClick={handleRename}
                                    disabled={busy || !name.trim() || name.trim() === group.chatName}
                                >
                                    Save
                                </button>
                            </div>
                        ) : (
                            <h3 className="gm-title">{group.chatName}</h3>
                        )}

                        <p className="gm-label">{group.participants.length} members</p>

                        <div className="gm-list">
                            {members.map((m) => {
                                const id = idOf(m);
                                const isMe = id === myId;
                                const isGroupAdmin = id === idOf(group.groupAdmin);
                                return (
                                    <div key={id} className="gm-row">
                                        <img className="gm-avatar" src={m.profilePic || Nopfp} alt="" />
                                        <span className="gm-name">{isMe ? "You" : m.name}</span>
                                        {isGroupAdmin && <span className="gm-badge">Admin</span>}
                                        {isAdmin && !isMe && !isGroupAdmin && (
                                            <button
                                                type="button"
                                                className="gm-kick-btn"
                                                onClick={() => handleRemove(id, m.name)}
                                                disabled={busy}
                                                aria-label={`Kick ${m.name}`}
                                            >
                                                <UserX size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {isAdmin && addable.length > 0 && (
                            <>
                                <p className="gm-label">Add members</p>
                                <div className="gm-list">
                                    {addable.map((c) => {
                                        const on = toAdd.includes(c._id);
                                        return (
                                            <div
                                                key={c._id}
                                                role="button"
                                                tabIndex={0}
                                                className={`gm-row ${on ? "is-on" : ""}`}
                                                onClick={() => toggleAdd(c._id)}
                                                onKeyDown={(e) => e.key === "Enter" && toggleAdd(c._id)}
                                            >
                                                <img className="gm-avatar" src={c.profilePic || Nopfp} alt="" />
                                                <span className="gm-name">{c.name}</span>
                                                <span className={`gm-check ${on ? "is-on" : ""}`}>
                                                    {on && <Check size={14} />}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    className="gm-btn primary gm-full"
                                    onClick={handleAdd}
                                    disabled={busy || !toAdd.length}
                                >
                                    Add {toAdd.length || ""} {toAdd.length === 1 ? "member" : "members"}
                                </button>
                            </>
                        )}

                        {error && <div className="gm-error">{error}</div>}
                    </div>

                    <div className="gm-footer">
                        <button type="button" className="gm-btn danger" onClick={handleLeave} disabled={busy}>
                            <LogOut size={16} /> Leave group
                        </button>
                    </div>
                </div>
            </div>

            {/* CONFIRM POPUP (kick / leave) */}
            {confirm && confirmCopy && (
                <div className="gm-overlay" onClick={closeConfirm}>
                    <div
                        className="gm-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="gm-header">
                            <h4>{confirmCopy.title}</h4>
                        </div>

                        <div className="gm-body">
                            <p className="gm-confirm-text">{confirmCopy.text}</p>
                            {confirmError && <div className="gm-error">{confirmError}</div>}
                        </div>

                        <div className="gm-footer">
                            <button
                                type="button"
                                className="gm-btn"
                                onClick={closeConfirm}
                                disabled={confirmBusy}
                            >
                                Cancel
                            </button>
                            <button type="button" className="gm-btn danger-fill" onClick={handleConfirm} disabled={confirmBusy}>
                                {confirmBusy ? confirmCopy.loading : confirmCopy.action}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GroupInfo;