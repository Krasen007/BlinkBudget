export const config = {
    env: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};
