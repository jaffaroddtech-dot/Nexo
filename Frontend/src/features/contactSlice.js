import { createSlice } from "@reduxjs/toolkit";
const contactSlice = createSlice({
  name: "contacts",
  initialState: [],
  reducers: {
    setContacts: (state, action) => action.payload,
    addContactState: (state, action) => {
      state.push(action.payload);
    },
    removeContactState: (state, action) => {
      return state.filter(contact => contact._id !== action.payload);
    },
    updateContactState: (state, action) => {
      const updated = action.payload;
      const index = state.findIndex(c => c._id === updated._id);
      if (index !== -1) {
        state[index] = updated;
      }
    }

  },
});

export const { setContacts, addContactState, removeContactState, updateContactState } = contactSlice.actions;
export default contactSlice.reducer;
