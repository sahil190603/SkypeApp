import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userSelected: "",
};

export const SkypeSlice = createSlice({
  name: "UserData",
  initialState,
  reducers: {
    setUserSelected: (state, action) => {
      state.userSelected = action.payload;
    },
  },
});

export const { setUserSelected } = SkypeSlice.actions;
export default SkypeSlice.reducer;
