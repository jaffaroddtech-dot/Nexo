import React from "react";
import { useSelector } from "react-redux";
import { logoutUser } from "../../../Apis/auth";
import pfp from "../../assets/images.jpg"
import "./UserPage.css";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { logout } from "../../features/authSlice";
import { useNavigate } from "react-router-dom";


const UserPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/");
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
            <div className="profile-card text-center">
                <img
                    src={user.profilePic || pfp} // agar backend se pic aaye toh use karo
                    alt="Profile"
                    className="profile-imagee rounded-circle mb-3"
                    width={120}
                    height={120}
                />
                <h2 className="user-name">{user.name}</h2>
                <p className="user-email">{user.email}</p>
                <p className="user-phone">{user.phoneNumber}</p>
                <div>
                    <button className="new-button" onClick={() => { handleLogout() }}>
                        logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserPage;
