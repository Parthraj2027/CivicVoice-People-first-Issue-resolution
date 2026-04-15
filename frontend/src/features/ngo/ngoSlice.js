import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/lib/apiClient';

export const fetchNgos = createAsyncThunk('ngo/fetchAll', async (filters = {}, thunkAPI) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/ngos${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch NGOs');
  }
});

export const fetchNgoById = createAsyncThunk('ngo/fetchById', async (id, thunkAPI) => {
  try {
    const response = await api.get(`/ngos/${id}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch NGO profile');
  }
});

export const fetchManagedNgo = createAsyncThunk('ngo/fetchManagedNgo', async (_, thunkAPI) => {
  try {
    const state = thunkAPI.getState();
    const userId = state.auth?.user?._id;
    if (!userId) {
      return thunkAPI.rejectWithValue('User not found');
    }

    const response = await api.get('/ngos');
    const list = Array.isArray(response.data) ? response.data : [];
    const managed = list.find((ngo) => {
      const managedById = ngo?.managedBy?._id || ngo?.managedBy;
      return String(managedById || '') === String(userId);
    });

    if (!managed) {
      return thunkAPI.rejectWithValue('No NGO profile is assigned to this account');
    }

    return managed;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load NGO profile');
  }
});

export const fetchNgoIssues = createAsyncThunk('ngo/fetchIssues', async (ngoId, thunkAPI) => {
  try {
    const response = await api.get(`/ngos/${ngoId}/issues`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch NGO cases');
  }
});

export const fetchNgoAnalytics = createAsyncThunk('ngo/fetchAnalytics', async (ngoId, thunkAPI) => {
  try {
    const response = await api.get(`/ngos/${ngoId}/analytics`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch NGO analytics');
  }
});

export const acceptNgoCase = createAsyncThunk('ngo/acceptCase', async ({ ngoId, issueId }, thunkAPI) => {
  try {
    const response = await api.put(`/ngos/${ngoId}/accept/${issueId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to accept case');
  }
});

export const resolveNgoCase = createAsyncThunk('ngo/resolveCase', async ({ ngoId, issueId, payload }, thunkAPI) => {
  try {
    const response = await api.put(`/ngos/${ngoId}/resolve/${issueId}`, payload || {});
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to resolve case');
  }
});

export const escalateNgoCase = createAsyncThunk('ngo/escalateCase', async ({ ngoId, issueId, reason }, thunkAPI) => {
  try {
    const response = await api.post(`/ngos/${ngoId}/escalate/${issueId}`, { reason });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to escalate case');
  }
});

function replaceIssue(items, updatedIssue) {
  const index = items.findIndex((item) => item._id === updatedIssue._id);
  if (index === -1) {
    return [updatedIssue, ...items];
  }

  const next = [...items];
  next[index] = updatedIssue;
  return next;
}

const ngoSlice = createSlice({
  name: 'ngo',
  initialState: {
    list: [],
    selected: null,
    issues: [],
    analytics: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNgos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNgos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchNgos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchNgoById.fulfilled, (state, action) => {
        state.selected = action.payload;
      })
      .addCase(fetchManagedNgo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchManagedNgo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selected = action.payload;
      })
      .addCase(fetchManagedNgo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchNgoIssues.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNgoIssues.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.issues = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchNgoIssues.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchNgoAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(acceptNgoCase.fulfilled, (state, action) => {
        state.issues = replaceIssue(state.issues, action.payload);
      })
      .addCase(resolveNgoCase.fulfilled, (state, action) => {
        state.issues = replaceIssue(state.issues, action.payload);
      })
      .addCase(escalateNgoCase.fulfilled, (state, action) => {
        state.issues = replaceIssue(state.issues, action.payload);
      });
  },
});

export default ngoSlice.reducer;
