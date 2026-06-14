import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach widget token to every request for API authentication
api.interceptors.request.use(
  (config) => {
    const widgetToken = window.__GDWidgetToken;
    if (widgetToken) {
      config.headers['x-widget-token'] = widgetToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Widget auth error:', error.response?.data?.message);
    }
    return Promise.reject(error);
  }
);

// Conversations



export default api;
