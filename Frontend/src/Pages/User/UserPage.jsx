import React from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { setUser } from "../../features/authSlice";
import { logoutUser } from "../../../Apis/auth";
import { updateProfile } from "../../../Apis/user"; // 👈 API call for profile update
import pfp from "../../assets/images.jpg";
import "./UserPage.css";

const UserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

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

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
    };

    const onSubmit = async (data) => {
        const res = await updateProfile(user?._id, data);
        console.log(res)
        try {
            if (res.status) {
                dispatch(setUser(res.data));
                localStorage.setItem("user", JSON.stringify(res.data));
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error("Failed to update profile");
        }
    };

    if (!user) {
        return (
            <div className="user-page d-flex align-items-center justify-content-center">
                <h3>Please log in to view your profile</h3>
            </div>
        );
    }

    return (
        <div className="user-page d-flex flex-column align-items-center justify-content-center p-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="profile-card text-center d-flex gap-4"
            >
                <div className="userCard">
                    <h2 className="title">Account Details</h2>

                    {/* Display Name */}
                    <div className="infoGroup">
                        <label>Display Name:</label>
                        <input
                            type="text"
                            {...register("name", { required: "Name is required" })}
                        />
                        {errors.name && <p className="error">{errors.name.message}</p>}
                    </div>

                    {/* Phone Number (disabled) */}
                    <div className="infoGroup">
                        <label>Phone Number:</label>
                        <input
                            type="text"
                            {...register("phoneNumber")}
                            disabled
                            className="phone"
                        />
                    </div>

                    {/* Country */}
                    <div className="infoGroup">
                        <label>Country:</label>
                        <input
                            type="text"
                            {...register("country", { required: "Country is required" })}
                        />
                        {errors.country && <p className="error">{errors.country.message}</p>}
                    </div>

                    {/* Notification Toggle */}
                    <div className="infoGroup toggleGroup">
                        <label>Notification Settings:</label>
                        <div
                            className={`toggle on`}
                        // 👈 you can connect this toggle to backend later
                        >
                            <div className="circle"></div>
                        </div>
                    </div>

                    <button type="submit" className="saveBtn">
                        Save Changes
                    </button>
                </div>

                <div className="container-setting">
                    <div className="settingsCard">
                        <img src={pfp} alt="" height={100} className="mb-4 profilepic" />
                        <h2 className="title m-0">Account Settings</h2>

                        {/* Security Section */}
                        <div className="section">
                            <h4 className="sectionTitle">Security</h4>
                            <button type="button" className="actionBtn">Change Password</button>
                            <button type="button" className="actionBtn">Enable 2FA</button>
                            <button type="button" className="actionBtn" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="section-status">
                        <h4 className="sectionTitle">Bio</h4>
                        <small className="hint">Type a custom text Bio, e.g.</small>
                        <input
                            type="text"
                            {...register("bio")}
                            className="statusInput"
                        />
                    </div>
                </div>
            </form>


        </div>
    );
};

export default UserPage;
