import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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
        const { data } = await api.post("/api/auth/login", { email, password });
        const me = await refresh();
        return me || data;
    };

    const register = async (payload) => {
        const { data } = await api.post("/api/auth/register", payload);
        const me = await refresh();
        return me || data;
    };

    const logout = async () => {
        await api.post("/api/auth/logout");
        setUser(null);
        setFamily(null);
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
