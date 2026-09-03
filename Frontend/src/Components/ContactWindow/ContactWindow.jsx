import React, { useState, useEffect, useRef } from "react";
import "./ContactWindow.css";
import {
  Phone, MessageCircle, Trash2, Send, Edit2, Check, UserRound, Info, MapPin, Mail
} from "lucide-react";
import { removeContactState, updateContactState } from "../../features/contactSlice";
import { deleteContact, updateContact } from "../../../Apis/contact";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import defaultPic from "../../assets/default.jfif";

const ContactWindow = ({ contactId, onDeleted }) => {
  const dispatch = useDispatch();
  const contact = useSelector(state =>
    state.contacts.find(c => c._id === contactId)
  );
  console.log(contact)

  const [editing, setEditing] = useState(false);
  const editRef = useRef(null);
  const [newName, setNewName] = useState(contact?.savedName || "");

  useEffect(() => {
    if (contact) setNewName(contact.savedName);
  }, [contact?.savedName]);

  // Delete Contact
  const handleDelete = async () => {
    try {
      const res = await deleteContact(contact._id);
      if (res.status) {
        dispatch(removeContactState(contact._id));
        toast.success(res.message);
        onDeleted();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRef.current && !editRef.current.contains(event.target)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update Saved Name
  const handleUpdate = async () => {
    try {
      const res = await updateContact(contact._id, { savedName: newName });
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

  if (!contact) {
    return (
      <div className="empty-contact d-flex flex-column justify-content-center">
        <div className="contact-logo"></div>
        <h2>Choose a conversation to continue</h2>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="contact-card">
        {/* Profile Image */}
        <div className="profile-avatar">
          <img src={contact.contactUser.profilePic || defaultPic} className="profilepic" alt="profile" />
        </div>

        {/* Header */}
        <div className="contact-header">
          {editing ? (
            <div className="edit-name d-flex justify-content-center">
              <div className="edit-wrapper" ref={editRef}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="edit-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <button onClick={handleUpdate} className="edit-check">
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="name-row d-flex justify-content-center align-items-center gap-1">
              <h2>{contact.savedName}</h2>
              <Edit2
                size={16}
                className="edit-icon"
                onClick={() => setEditing(true)}
                style={{ cursor: "pointer" }}
              />
            </div>
          )}
          <span>{contact.contactUser.online ? "Online" : "Offline"}</span>
        </div>

        <div className="divider"></div>

        {/* Contact Details */}
        <div className="contact-body">
          <div className="contact-top">
            <div className="contact-info-2">
              <div className="info-row">
                <Phone size={18} />
                <span>{contact.contactUser.phoneNumber}</span>
              </div>
            </div>

            {/* Action Icons */}
            <div className="action-icons">
              <Phone size={20} />
              <MessageCircle size={20} />
            </div>
          </div>

          {/* Contact Info */}
          <div className="details">
            <p className="details-title">Contact Info</p>
            <div className="detail-row">
              <UserRound size={18} />
              <span>{contact.contactUser.name}</span>
            </div>
            <div className="detail-row">
              <Mail size={18} />
              <span>{contact.contactUser.email}</span>
            </div>
            <div className="detail-row">
              <MapPin size={18} />
              <span>{contact.contactUser.country}</span>
            </div>
            <div className="detail-row">
              <Info size={18} />
              <span>{contact.contactUser.bio}</span>
            </div>
          </div>


          {/* Buttons */}
          <div className="d-flex align-items-center justify-content-between">
            <button className="delete-btn" onClick={handleDelete}>
              <Trash2 />
            </button>
            <button className="sendd-btn">
              <Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
  export default ContactWindow;