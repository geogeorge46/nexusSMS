import { api } from '@/lib/api'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Super Admin'
  status: 'Active' | 'Suspended'
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

const tokenKey = 'nexus_auth_token'

export async function loginWithApi(payload: { email: string; password: string }) {
  const response = await api.post<AuthResponse>('/auth/login', payload)
  saveAuthToken(response.data.token)
  return response.data
}

export async function signupWithApi(payload: {
  name: string
  email: string
  password: string
  role: 'Admin' | 'Super Admin'
}) {
  const response = await api.post<AuthResponse>('/auth/signup', payload)
  saveAuthToken(response.data.token)
  return response.data
}

export async function fetchCurrentUser() {
  const response = await api.get<{ user: AuthUser }>('/auth/me', {
    headers: getAuthHeaders(),
  })

  return response.data.user
}

export function saveAuthToken(token: string) {
  window.localStorage.setItem(tokenKey, token)
}

export function getAuthToken() {
  return window.localStorage.getItem(tokenKey)
}

export function clearAuthToken() {
  window.localStorage.removeItem(tokenKey)
}

export function getAuthHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
