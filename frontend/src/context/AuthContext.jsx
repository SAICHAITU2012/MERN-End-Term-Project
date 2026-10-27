import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import api from "../api/axios.js";
import { clearSchedule } from "../redux/scheduleSlice.js";
import { clearNotifications } from "../redux/notificationSlice.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const dispatch = useDispatch();
    const [user, setUser] = useState(null);
    const [family, setFamily] = useState(null);
    const [onboardingNeeded, setOnboardingNeeded] = useState(false);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
            setFamily(data.family);
            setOnboardingNeeded(Boolean(data.onboardingNeeded));
            return data;
        } catch {
            setUser(null);
            setFamily(null);
            return null;
        }
    }, []);

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    const login = async (email, password) => {
        dispatch(clearSchedule());
        dispatch(clearNotifications());
        const { data } = await api.post("/api/auth/login", { email, password });
        const me = await refresh();
        return me || data;
    };

    const register = async (payload) => {
        dispatch(clearSchedule());
        dispatch(clearNotifications());
        const { data } = await api.post("/api/auth/register", payload);
        const me = await refresh();
        return me || data;
    };

    const logout = async () => {
        // Clear the client session immediately so a slow or unavailable API
        // cannot leave the user trapped on a protected screen.
        setUser(null);
        setFamily(null);
        setOnboardingNeeded(false);
        dispatch(clearSchedule());
        dispatch(clearNotifications());
        try {
            await api.post("/api/auth/logout");
        } catch {
            // The cookie is httpOnly and can only be cleared by the API. The
            // local app still exits; the next auth refresh will report if the
            // server could not clear the cookie.
        }
    };

    const updateUser = (u) => setUser(u);

    return (
        <AuthContext.Provider
            value={{ user, family, onboardingNeeded, loading, login, register, logout, refresh, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
