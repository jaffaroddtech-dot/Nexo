import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { addContact } from "../../../Apis/contact"
import {X} from "lucide-react"



import "./contactSave.css";

const ContactSave = ({ onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await addContact(data);
      if (res.status) {
        toast.success(res.message);
        onSuccess(res); // update parent contacts list
        onClose(); // close panel
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to save contact");
    }
  };

  return (
   <div className="contact-modal">
      <div className="contact-card">
        {/* Close X */}
        <button className="close-btn" onClick={onClose}><X /></button>

        <h4 className="mb-3">Save New Contact</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name */}
          <div className="mb-3">
            <label className="nexo-label form-label text-white">Name</label>
            <input
              type="text"
              className="nexo-input"
              placeholder="Enter name"
              {...register("Name", { required: "Name is required" })}
            />
            {errors.Name && (
              <p className="text-danger error">{"*" + errors.Name.message + "*"}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="mb-3">
            <label className="nexo-label form-label text-white">Phone Number</label>
            <input
              type="tel"
              className="nexo-input"
              placeholder="0300 1234567"
              {...register("phoneNumber", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{11}$/,
                  message: "Enter a valid phone number"
                }
              })}
            />
            {errors.phoneNumber && (
              <p className="text-danger error">{"*" + errors.phoneNumber.message + "*"}</p>
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="submit" className="sendd-btn">
              Save ✔
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSave;
