import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ContactWindow.css";
import {
  Phone,
  MessageCircle,
  Trash2,
  Pencil,
  Check,
  X,
  UserRound,
  MapPin,
  Mail,
  MessageCircleMore,
  ChevronLeft,
  Contact
} from "lucide-react";
import EmptyState from "../emptyState/EmptyState";
import { removeContactState, updateContactState } from "../../features/contactSlice";
import { deleteContact, updateContact } from "../../../Apis/contact";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import defaultPic from "../../assets/default.jfif";

const ContactWindow = ({ contactId, onDeleted, onBack }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const contact = useSelector((state) =>
    state.contacts.find((c) => c._id === contactId)
  );

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newName, setNewName] = useState(contact?.savedName || "");
  const editRef = useRef(null);

  useEffect(() => {
    if (contact) setNewName(contact.savedName);
  }, [contact?.savedName]);

  // dusra contact select ho to edit/confirm reset
  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [contactId]);

  // bahar click par edit band
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRef.current && !editRef.current.contains(event.target)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



if (!contact) {
  return (
    <EmptyState
      icon={<Contact />}
      title="Select a contact"
      subtitle="Choose a contact from the list to view their details."
    />
  );
}

  const u = contact.contactUser || {};

  const openChat = () => navigate("/", { state: { chatUser: u } });

  const handleDelete = async () => {
    try {
      const res = await deleteContact(contact._id);
      if (res.status) {
        dispatch(removeContactState(contact._id));
        toast.success(res.message);
        onDeleted?.();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handleUpdate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await updateContact(contact._id, { savedName: newName.trim() });
      if (res.status) {
        dispatch(updateContactState(res.data));
        toast.success(res.message);
        setEditing(false);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to update contact");
    }
  };

  const info = [
    { icon: Phone, label: "Phone", value: u.phoneNumber },
    { icon: Mail, label: "Email", value: u.email },
    { icon: MapPin, label: "Country", value: u.country },
    { icon: UserRound, label: "Profile name", value: u.name },
    { icon: MessageCircleMore, label: "Bio", value: u.bio },
  ].filter((i) => i.value);

  return (
    <div className="cw-page">
      {onBack && (
        <div className="cw-topbar">
          <button type="button" className="cw-back" onClick={onBack} aria-label="Back">
            <ChevronLeft size={24} />
          </button>
          <span>Contacts</span>
        </div>
      )}

      <div className="cw-card">
        {/* HERO */}
        <div className="cw-hero">
          <img src={u.profilePic || defaultPic} alt="" className="cw-avatar" />

          {editing ? (
            <div className="cw-edit" ref={editRef}>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <button type="button" className="cw-edit-ok" onClick={handleUpdate} aria-label="Save">
                <Check size={16} />
              </button>
              <button type="button" className="cw-edit-x" onClick={() => setEditing(false)} aria-label="Cancel">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="cw-name-row">
              <h2 className="cw-name">{contact.savedName}</h2>
              <button
                type="button"
                className="cw-edit-btn"
                onClick={() => setEditing(true)}
                aria-label="Edit name"
              >
                <Pencil size={15} />
              </button>
            </div>
          )}

          {u.bio && <p className="cw-hero-bio">{u.bio}</p>}

          {/* QUICK ACTIONS */}
          <div className="cw-actions">
            <button type="button" className="cw-action" onClick={openChat}>
              <span className="cw-action-icon">
                <MessageCircle size={20} />
              </span>
              <span>Message</span>
            </button>

            {u.phoneNumber && (
              <a className="cw-action" href={`tel:${u.phoneNumber}`}>
                <span className="cw-action-icon">
                  <Phone size={20} />
                </span>
                <span>Call</span>
              </a>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="cw-section">
          <h4 className="cw-section-title">Contact Info</h4>
          {info.map(({ icon: Icon, label, value }) => (
            <div key={label} className="cw-row">
              <span className="cw-row-icon">
                <Icon size={16} />
              </span>
              <div className="cw-row-text">
                <small>{label}</small>
                <span>{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* DELETE */}
        <div className="cw-section">
          {confirmDelete ? (
            <div className="cw-confirm">
              <p>Ye contact delete karna hai?</p>
              <div className="cw-confirm-btns">
                <button type="button" className="cw-btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button type="button" className="cw-btn-danger solid" onClick={handleDelete}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="cw-btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} /> Delete Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactWindow;