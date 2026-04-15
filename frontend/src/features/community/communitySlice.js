import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/apiClient';

export const fetchCommunityFeed = createAsyncThunk('community/fetchFeed', async (params = {}, thunkAPI) => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/community/feed${query ? `?${query}` : ''}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch community feed');
  }
});

export const fetchPublicImpact = createAsyncThunk('community/fetchImpact', async (_, thunkAPI) => {
  try {
    const response = await api.get('/public/impact');
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch public impact');
  }
});

const communitySlice = createSlice({
  name: 'community',
  initialState: {
    feed: [],
    impact: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunityFeed.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCommunityFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.feed = action.payload?.items || [];
      })
      .addCase(fetchCommunityFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchPublicImpact.fulfilled, (state, action) => {
        state.impact = action.payload;
      });
  },
});

export default communitySlice.reducer;
