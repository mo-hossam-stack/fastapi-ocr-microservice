import axios from 'axios';
import { ENV } from '../config/env';

export const apiClient = axios.create({
    baseURL: ENV.API_BASE_URL,
    timeout: 30000, // 30s timeout matching backend
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Auth Token
apiClient.interceptors.request.use((config) => {
    if (ENV.AUTH_TOKEN && config.headers) {
        // Backend expects: "Authorization: <Type> <Token>"
        // The backend code splits by space and expects 2 parts.
        // Common standard is "Bearer <token>", but backend might expect custom.
        // Based on backend_features.md: "Authorization: <Type> <Token>"
        // Let's assume Bearer or JWT. The test code used "JWT <token>" or "Bearer".
        // I will use "Bearer" as it is standard, unless tests showed otherwise.
        // Reviewing backend_features.md: "Auth Required (Authorization: <Type> <Token>)"
        // The code checks `parts = authorization.split()`, `len(parts) != 2`.
        // It doesn't validate the <Type> string, only the <Token>.
        // So "Bearer <token>" is safe.
        config.headers.Authorization = `Bearer ${ENV.AUTH_TOKEN}`;
    }
    return config;
});

// Response Interceptor: Global Error Handling (Optional logging)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // We can add global logging here if needed
        return Promise.reject(error);
    }
);
