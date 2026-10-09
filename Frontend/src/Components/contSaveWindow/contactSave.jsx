import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { Check, X, UserPlus } from "lucide-react";
import { addContact } from "../../../Apis/contact";
import { addContactState } from "../../features/contactSlice";

import "./contactSave.css";

const ContactSave = ({ onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);

  // Esc se band
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const res = await addContact(data);
      if (res.status) {
        toast.success(res.message);
        dispatch(addContactState(res.data));
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="cs-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="cs-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <button type="button" onClick={onClose} className="cs-close" aria-label="Close">
          <X size={18} />
        </button>

        <div className="cs-icon">
          <UserPlus size={24} />
        </div>
        <h2 className="cs-title">Save New Contact</h2>
        <p className="cs-subtitle">Add a name and number to your contacts</p>

        {/* NAME */}
        <div className="cs-group">
          <label htmlFor="cs-name">Name</label>
          <input
            id="cs-name"
            type="text"
            className={`cs-input ${errors.Name ? "has-error" : ""}`}
            placeholder="Enter name"
            autoComplete="off"
            autoFocus
            {...register("Name", { required: "Name is required" })}
          />
          {errors.Name && <p className="cs-error">{errors.Name.message}</p>}
        </div>

        {/* PHONE */}
        <div className="cs-group">
          <label htmlFor="cs-phone">Phone Number</label>
          <input
            id="cs-phone"
            type="tel"
            inputMode="numeric"
            className={`cs-input ${errors.phoneNumber ? "has-error" : ""}`}
            placeholder="0300 1234567"
            autoComplete="off"
            {...register("phoneNumber", {
              required: "Phone number is required",
              pattern: {
                value: /^[0-9]{11}$/,
                message: "Enter a valid 11 digit phone number",
              },
            })}
          />
          {errors.phoneNumber && (
            <p className="cs-error">{errors.phoneNumber.message}</p>
          )}
        </div>

        <button type="submit" className="cs-confirm" disabled={saving}>
          <Check size={18} /> {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
};

export default ContactSave;