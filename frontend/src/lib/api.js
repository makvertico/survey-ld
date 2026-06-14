import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
})

// Attach JWT to every request from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ld_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear stored token so ProtectedRoute redirects to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ld_token')
      localStorage.removeItem('ld_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
