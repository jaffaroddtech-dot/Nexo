import { createSlice } from "@reduxjs/toolkit";

const getUserFromStorage = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};
const initialState = {
  token: localStorage.getItem("@token") || null,
  user: getUserFromStorage(),
  isAuthenticated: !!localStorage.getItem("@token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ✅ Login/Register success
    setCredentials: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem("@token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    // ✅ Refresh token success
    refreshTokenSuccess: (state, action) => {
      const { token } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("@token", token);
    },

    // ✅ Logout
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("@token");
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, refreshTokenSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
