import React, { useEffect, useMemo, useState } from "react";
import { Search, X, UserX, Phone, MessageSquarePlus } from "lucide-react";
import Nopfp from "../../Assets/nopfp.jpg";
import { searchUserByPhone } from "../../../Apis/messages";
import "./NewChat.css";

const digitsOnly = (v) => v.replace(/\D/g, "");

const NewChat = ({ contacts = [], onClose, onSelect }) => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null); // registered user found by number
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const q = query.trim().toLowerCase();
  const qDigits = digitsOnly(query);
  const looksLikeNumber = qDigits.length >= 7;

  // Esc se band
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // saved contacts filter (name ya number se)
  const filteredContacts = useMemo(() => {
    if (!q) return contacts;
    return contacts.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        (qDigits && digitsOnly(u.phone || "").includes(qDigits))
    );
  }, [contacts, q, qDigits]);

  // number search (debounced)
  useEffect(() => {
    setResult(null);
    setSearched(false);

    if (!looksLikeNumber) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchUserByPhone(qDigits);
        setResult(res?.status ? res.user : null);
      } catch (err) {
        console.error(err);
        setResult(null);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [qDigits, looksLikeNumber]);

  // agar number wala user pehle se saved list mein hai to dobara na dikhayen
  const showResult =
    result && !filteredContacts.some((u) => String(u._id) === String(result._id));

  const renderUser = (u) => (
    <div
      key={u._id}
      role="button"
      tabIndex={0}
      className="nc-user"
      onClick={() => onSelect(u)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(u)}
    >
      <img src={u.profilePic || Nopfp} alt="" className="nc-avatar" />
      <div className="nc-info">
        <h6>{u.name}</h6>
        {u.phone && <span>{u.phone}</span>}
      </div>
    </div>
  );

  return (
    <div
      className="nc-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="nc-card">
        <button type="button" onClick={onClose} className="nc-close" aria-label="Close">
          <X size={18} />
        </button>

        <div className="nc-icon">
          <MessageSquarePlus size={24} />
        </div>
        <h2 className="nc-title">New Chat</h2>
        <p className="nc-subtitle">Search a saved contact or enter a number</p>

        <div className="nc-search">
          <Search size={16} />
          <input
            autoFocus
            type="text"
            autoComplete="off"
            placeholder="Search name or enter number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="nc-list">
          {filteredContacts.length > 0 && (
            <>
              <p className="nc-label">Saved contacts</p>
              {filteredContacts.map(renderUser)}
            </>
          )}

          {looksLikeNumber && (
            <>
              <p className="nc-label">
                <Phone size={12} /> On Nexo
              </p>
              {loading && <p className="nc-hint">Searching...</p>}
              {!loading && showResult && renderUser(result)}
              {!loading && searched && !result && (
                <div className="nc-empty">
                  <UserX size={28} />
                  <p>This number is not registered on Nexo.</p>
                </div>
              )}
            </>
          )}

          {!looksLikeNumber && filteredContacts.length === 0 && (
            <div className="nc-empty">
              <UserX size={28} />
              <p>This number is not registered on Nexo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChat;