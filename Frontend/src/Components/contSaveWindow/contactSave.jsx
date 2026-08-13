import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { addContact } from "../../../Apis/contacts"; // backend API call

import "./contactSave.css";

const ContactSave = ({ onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await addContact(data.phoneNumber);
      if (res.data.status) {
        toast.success(res.data.message);
        onSuccess(res.data.data); // update parent contacts list
        onClose(); // close panel
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to save contact");
    }
  };

  return (
    <div className="contact-modal">
      <div className="contact-card">
        <h4 className="mb-3">Save New Contact</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name */}
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="text-danger">{errors.name.message}</p>}
          </div>

          {/* Phone Number */}
          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="0300 1234567"
              {...register("phoneNumber", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{11}$/,
                  message: "Enter a valid 11-digit number"
                }
              })}
            />
            {errors.phoneNumber && (
              <p className="text-danger">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSave;
