import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('nexus_auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
