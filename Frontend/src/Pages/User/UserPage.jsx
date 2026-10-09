import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { setCredentials } from "../../features/authSlice";
import { logoutUser } from "../../../Apis/auth";
import defaultPic from "../../assets/default.jfif";
import { updateProfile, uploadProfilePic } from "../../../Apis/user";
import "./UserPage.css";
import { Pencil } from 'lucide-react';
import ResetPassword from "../../Components/resetPassword/resetPassword";
import { resetPassword } from "../../../Apis/auth";


const UserPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [openResetModal, setOpenResetModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      country: user?.country || "",
      bio: user?.bio || "",
      email: user?.email || "",
    },
  });

  if (!user) {
    return (
      <div className="user-page d-flex align-items-center justify-content-center">
        <h3>Please log in to view your profile</h3>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/");
  };

  const onSubmit = async (data) => {
    try {
      const res = await updateProfile(user?._id, data);
      if (res.status) {
        localStorage.setItem("user", JSON.stringify(res.data));
        dispatch(setCredentials({ token, user: res.data }));
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await uploadProfilePic(user?._id, formData);
      if (res.status) {
        dispatch(setCredentials({ token, user: { ...user, profilePic: res.url } }));
        toast.success("Profile picture updated!");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload profile picture");
    }
  };

  // 👇 Reset Password handler
  const handleResetPassword = async ({ otp, newPassword }) => {
    try {
      const res = await resetPassword({ email: user.email, otp, newPassword });
      if (!res.status) {
        toast.error(res.message);
        return;
      }
      toast.success("Password reset successful!");
      setOpenResetModal(false);
    } catch (err) {
      toast.error("Reset failed");
    }
  };

  return (
    <div className="user-page">
      <form onSubmit={handleSubmit(onSubmit)} className="profile-card">
        {/* HERO */}
        <div className="profile-hero">
          <div className="profilepic-wrapper">
            <img
              src={user?.profilePic || defaultPic}
              alt="profile"
              className="profilepic"
            />
            <label htmlFor="fileInput" className="avatar-edit" aria-label="Change photo">
              <Pencil size={14} />
            </label>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
          </div>

          <div className="hero-text">
            <h2 className="hero-name">{user?.name}</h2>
            <p className="hero-email">{user?.email}</p>
          </div>
        </div>

        {/* ACCOUNT DETAILS */}
        <div className="card-box">
          <h3 className="card-title">Account Details</h3>

          <div className="fields-grid">
            <div className="infoGroup">
              <label>Display Name</label>
              <input type="text" {...register("name", { required: "Name is required" })} />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>

            <div className="infoGroup">
              <label>Country</label>
              <input type="text" {...register("country", { required: "Country is required" })} />
              {errors.country && <p className="error">{errors.country.message}</p>}
            </div>

            <div className="infoGroup">
              <label>Phone Number</label>
              <input type="text" {...register("phoneNumber")} disabled className="locked" />
            </div>

            <div className="infoGroup">
              <label>Email</label>
              <input type="email" {...register("email")} disabled className="locked" />
            </div>

            <div className="infoGroup full">
              <label>Bio</label>
              <input type="text" {...register("bio")} placeholder="Say something about yourself" />
            </div>
          </div>

          <div className="card-footer">
            <button type="submit" className="saveBtn">Save Changes</button>
          </div>
        </div>

        {/* SECURITY */}
        <div className="card-box">
          <h3 className="card-title">Security</h3>
          <div className="action-row">
            <button type="button" className="actionBtn" onClick={() => setOpenResetModal(true)}>
              Change Password
            </button>
            <button type="button" className="actionBtn">Enable 2FA</button>
            <button type="button" className="actionBtn danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </form>

      <ResetPassword
        isOpen={openResetModal}
        onClose={() => setOpenResetModal(false)}
        onSubmit={handleResetPassword}
        email={user.email}
      />
    </div>
  );
};

export default UserPage;
