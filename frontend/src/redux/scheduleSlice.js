import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios.js";

export const fetchToday = createAsyncThunk("schedule/fetchToday", async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get("/api/doses/today");
        return data;
    } catch (err) {
        return rejectWithValue(err.friendly);
    }
});

export const actOnDose = createAsyncThunk("schedule/actOnDose", async ({ id, action, payload }, { dispatch, rejectWithValue }) => {
    try {
        const { data } = await api.patch(`/api/doses/${id}/${action}`, payload || {});
        dispatch(fetchToday());
        return data;
    } catch (err) {
        return rejectWithValue(err.friendly);
    }
});

const scheduleSlice = createSlice({
    name: "schedule",
    initialState: {
        dateLabel: null,
        todayLabel: null,
        doses: [],
        status: "idle",
        error: null,
        lastFetched: null,
    },
    reducers: {
        clearSchedule(state) {
            state.doses = [];
            state.dateLabel = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchToday.pending, (state) => {
                state.status = state.doses.length ? "refreshing" : "loading";
                state.error = null;
            })
            .addCase(fetchToday.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.dateLabel = action.payload.dateLabel;
                state.todayLabel = action.payload.todayLabel;
                state.doses = action.payload.doses;
                state.lastFetched = Date.now();
            })
            .addCase(fetchToday.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            });
    },
});

export const { clearSchedule } = scheduleSlice.actions;
export default scheduleSlice.reducer;
