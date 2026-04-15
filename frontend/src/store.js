
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import chatReducer from '@/features/chat/chatSlice';
import issuesReducer from '@/features/issues/issuesSlice';
import socialIssuesReducer from '@/features/social/socialIssuesSlice';
import ngoReducer from '@/features/ngo/ngoSlice';
import communityReducer from '@/features/community/communitySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    issues: issuesReducer,
    socialIssues: socialIssuesReducer,
    ngo: ngoReducer,
    community: communityReducer,
  },
});

export default store;
