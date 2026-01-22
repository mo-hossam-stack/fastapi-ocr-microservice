export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
    AUTH_TOKEN: import.meta.env.VITE_AUTH_TOKEN || '',
} as const;

if (!ENV.AUTH_TOKEN) {
    console.warn('VITE_AUTH_TOKEN is not set. API calls requiring auth will fail.');
}
