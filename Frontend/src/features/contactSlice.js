import { createSlice } from "@reduxjs/toolkit";

const contactSlice = createSlice({
  name: "contacts",
  initialState: [],
  reducers: {
    setContacts: (state, action) => action.payload,
    addContactState: (state, action) => {
      state.push(action.payload);
    },
    removeContact: (state, action) => {
      return state.filter(contact => contact._id !== action.payload);
    },
  },
});

export const { setContacts, addContactState, removeContact } = contactSlice.actions;
export default contactSlice.reducer;
