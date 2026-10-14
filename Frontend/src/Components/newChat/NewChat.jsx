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
            className="newchat-user"
            onClick={() => onSelect(u)}
            onKeyDown={(e) => e.key === "Enter" && onSelect(u)}
        >
            <img src={u.profilePic || Nopfp} alt="" className="newchat-avatar" />
            <div className="newchat-info">
                <h6>{u.name}</h6>
                {u.phone && <span>{u.phone}</span>}
            </div>
        </div>
    );

    return (
        <div className="newchat-overlay" onClick={onClose}>
            <div className="newchat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="newchat-header">
                    <button type="button" className="newchat-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                    <div className="newchat-icon">
                        <MessageSquarePlus size={22} />
                    </div>
                    <h3>New Chat</h3>
                    <p>Search a saved contact or enter a number</p>
                </div>
                <div className="newchat-search">
                    <Search size={16} />
                    <input
                        autoFocus
                        placeholder="Search name or enter number..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="newchat-list">
                    {filteredContacts.length > 0 && (
                        <>
                            <p className="newchat-label">Saved contacts</p>
                            {filteredContacts.map(renderUser)}
                        </>
                    )}

                    {looksLikeNumber && (
                        <>
                            <p className="newchat-label">
                                <Phone size={12} /> On Nexo
                            </p>
                            {loading && <p className="newchat-hint">Searching...</p>}
                            {!loading && showResult && renderUser(result)}
                            {!loading && searched && !result && (
                                <div className="newchat-empty">
                                    <UserX size={28} />
                                    <p>This number is not registered on Nexo.</p>
                                </div>
                            )}
                        </>
                    )}

                    {!looksLikeNumber && filteredContacts.length === 0 && (
                        <div className="newchat-empty">
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