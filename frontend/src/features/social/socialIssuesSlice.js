import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/apiClient';

export const fetchSocialIssues = createAsyncThunk('social/fetchAll', async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/social-issues${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch social issues');
  }
});

export const createSocialIssue = createAsyncThunk('social/create', async (payload, thunkAPI) => {
  try {
    const response = await api.post('/social-issues', payload);
    return response.data.issue;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create social issue');
  }
});

export const upvoteSocialIssue = createAsyncThunk('social/upvote', async (id, thunkAPI) => {
  try {
    const response = await api.put(`/social-issues/${id}/upvote`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to upvote issue');
  }
});

export const addWitnessStatement = createAsyncThunk('social/witness', async ({ id, statement }, thunkAPI) => {
  try {
    const response = await api.post(`/social-issues/${id}/witness`, { statement });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add witness statement');
  }
});

const socialIssuesSlice = createSlice({
  name: 'socialIssues',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialIssues.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSocialIssues.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSocialIssues.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createSocialIssue.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(upvoteSocialIssue.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item._id === updated._id);
        if (index !== -1) {
          state.items[index] = updated;
        }
      })
      .addCase(addWitnessStatement.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item._id === updated._id);
        if (index !== -1) {
          state.items[index] = updated;
        }
      });
  },
});

export default socialIssuesSlice.reducer;
