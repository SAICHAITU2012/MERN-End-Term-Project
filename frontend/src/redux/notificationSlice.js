import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios.js";

export const fetchNotifications = createAsyncThunk(
    "notifications/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/api/notifications");
            return data;
        } catch (err) {
            return rejectWithValue(err.friendly);
        }
    }
);

export const markAllRead = createAsyncThunk("notifications/markAllRead", async () => {
    await api.post("/api/notifications/read", {});
    return true;
});

const notificationSlice = createSlice({
    name: "notifications",
    initialState: { items: [], unreadCount: 0, status: "idle" },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.items = action.payload.notifications;
                state.unreadCount = action.payload.unreadCount;
                state.status = "succeeded";
            })
            .addCase(markAllRead.fulfilled, (state) => {
                state.items = state.items.map((n) => ({ ...n, isRead: true }));
                state.unreadCount = 0;
            });
    },
});

export default notificationSlice.reducer;
