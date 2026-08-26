import requests from "../utils/axios";
import { logout as logoutAction } from "../src/features/authSlice";


// Register user
export const registerUser = async (data) => {

  const res = await requests.post("/auth/register", data);
  return res; // direct backend response

};

// Login user
export const loginUser = async (data) => {
  const res = await requests.post("/auth/login", data);
  return res;
};

// Get profile
export const getProfile = async () => {
  try {
    const res = await requests.get("/auth/me");
    return res;
  } catch (err) {
    return err.response?.data || { status: false, message: "Something went wrong!" };
  }
};

// LOGOUT USER
export const logoutUser = () => async (dispatch) => {
  try {
    await requests.post("/auth/logout"); 
    dispatch(logoutAction());            
  } catch (error) {
    console.error("Logout failed:", error);
    dispatch(logoutAction());
  }
};
