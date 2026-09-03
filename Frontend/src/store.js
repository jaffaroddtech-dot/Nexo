import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import contactReducer from "./features/contactSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
     contacts: contactReducer,
  },
});
