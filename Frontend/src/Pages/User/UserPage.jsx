import React from "react";
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


const UserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);
    
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

  // 👇 Direct upload without modal
  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadProfilePic(user?._id, formData);
        console.log(res)
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


  return (
    <div className="user-page d-flex flex-column align-items-center justify-content-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="profile-card text-center d-flex gap-4">
        <div className="userCard">
          <h2 className="title">Account Details</h2>

          <div className="infoGroup">
            <label>Display Name:</label>
            <input type="text" {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="error">{errors.name.message}</p>}
          </div>

          <div className="infoGroup">
            <label>Phone Number:</label>
            <input type="text" {...register("phoneNumber")} disabled className="phone" />
          </div>

          <div className="infoGroup">
            <label>Country:</label>
            <input type="text" {...register("country", { required: "Country is required" })} />
            {errors.country && <p className="error">{errors.country.message}</p>}
          </div>

          <button type="submit" className="saveBtn">Save Changes</button>
        </div>

        <div className="container-setting">
          <div className="settingsCard">
            {/* Profile Pic with Hover Overlay */}
            <div className="profilepic-wrapper">
              <img src={user?.profilePic || defaultPic} alt="profile" className="profilepic" />
              <div className="overlay" onClick={() => document.getElementById("fileInput").click()}>
              <Pencil/>
              </div>
              <input type="file" id="fileInput" style={{ display: "none" }} onChange={onFileChange} />
            </div>

            <h2 className="title m-0">Account Settings</h2>
            <div className="section">
              <h4 className="sectionTitle">Security</h4>
              <button type="button" className="actionBtn">Change Password</button>
              <button type="button" className="actionBtn">Enable 2FA</button>
              <button type="button" className="actionBtn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="section-status">
            <h4 className="sectionTitle">Bio</h4>
            <input type="text" {...register("bio")} className="statusInput" />
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserPage;
