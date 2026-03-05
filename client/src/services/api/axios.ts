import axios from 'axios';
import { setupInterceptors } from './interceptors';

// Create the axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

setupInterceptors(api);

export default api;
