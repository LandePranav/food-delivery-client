import axios from "axios";

const api = axios.create({
    // Fallback to local API routes if env is not set
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "/api",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
    withCredentials: true,
});

export default api;
