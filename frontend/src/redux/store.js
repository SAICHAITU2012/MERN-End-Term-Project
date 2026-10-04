import { configureStore } from "@reduxjs/toolkit";
import scheduleReducer from "./scheduleSlice.js";
import notificationReducer from "./notificationSlice.js";

export const store = configureStore({
    reducer: {
        schedule: scheduleReducer,
        notifications: notificationReducer,
    },
});
