import React, { useState, useEffect } from "react";
import { X, Search, Check } from "lucide-react";
import Nopfp from "../../Assets/nopfp.jpg";
import { createGroup } from "../../../Apis/group.js";
import './Group.css'

const NewGroup = ({ contacts, onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const list = contacts.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = name.trim() && selected.length >= 1 && !saving;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError("");
    try {
      const res = await createGroup({ chatName: name.trim(), participants: selected });
      if (res.status) onCreated(res.group);
      else setError(res.message || "Could not create group");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gm-overlay" onClick={() => !saving && onClose()}>
      <div className="gm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="gm-header">
          <h4>New group</h4>
          <button type="button" className="gm-icon-btn" onClick={onClose} disabled={saving} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="gm-body">
          <input
            className="gm-input"
            placeholder="Group name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="gm-search">
            <Search size={16} />
            <input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className="gm-label">Add members ({selected.length} selected)</p>

          <div className="gm-list">
            {list.length === 0 && <p className="gm-empty">No contacts found</p>}
            {list.map((c) => {
              const on = selected.includes(c._id);
              return (
                <div
                  key={c._id}
                  role="button"
                  tabIndex={0}
                  className={`gm-row ${on ? "is-on" : ""}`}
                  onClick={() => toggle(c._id)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(c._id)}
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

          {error && <div className="gm-error">{error}</div>}
        </div>

        <div className="gm-footer">
          <button type="button" className="gm-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="gm-btn primary" onClick={handleCreate} disabled={!canCreate}>
            {saving ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroup;