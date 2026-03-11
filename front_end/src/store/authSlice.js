import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  admin: {
    isAuthenticated: false,
    user: null,
    token: null
  },
  member: {
    isAuthenticated: false,
    user: null,
    token: null
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Admin actions
    adminLogin: (state, action) => {
      const { user, token } = action.payload;
      state.admin.isAuthenticated = true;
      state.admin.user = user;
      state.admin.token = token || null; // Handle missing token
    },
    adminLogout: (state) => {
      state.admin.isAuthenticated = false;
      state.admin.user = null;
      state.admin.token = null;
    },
    
    // Member actions
    memberLogin: (state, action) => {
      const { member, user } = action.payload;
      state.member.isAuthenticated = true;
      state.member.user = member || user;
    },
    memberLogout: (state) => {
      state.member.isAuthenticated = false;
      state.member.user = null;
      state.member.token = null;
    },
    
    // Update user data (for profile updates, etc.)
    updateAdminData: (state, action) => {
      state.admin.user = { ...state.admin.user, ...action.payload };
    },
    updateMemberData: (state, action) => {
      state.member.user = { ...state.member.user, ...action.payload };
    }
  }
});

export const {
  adminLogin,
  adminLogout,
  memberLogin,
  memberLogout,
  updateAdminData,
  updateMemberData
} = authSlice.actions;

export default authSlice.reducer;
