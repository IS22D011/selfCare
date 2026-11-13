import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

// Хүсэлт явуулах бүрт токен нэмэх
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Хэрэв серверээс 401 (Unauthorized) буцаавал токенийг цэвэрлэх
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Хэрэв хүсвэл шууд нэвтрэх хуудас руу шилжүүлж болно
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default API;