import axios from "axios";

// dev: same-origin via Vite proxy; prod: VITE_API_URL (e.g. Render backend)
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    withCredentials: true,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        err.friendly =
            err.response?.data?.message ||
            (err.code === "ERR_NETWORK"
                ? "Can't reach the server — check your connection"
                : "Something went wrong — please try again");
        return Promise.reject(err);
    }
);

export default api;
