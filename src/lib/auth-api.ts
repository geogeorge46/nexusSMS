import { api } from '@/lib/api'
import axios from 'axios'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Super Admin' | 'Teacher' | 'Staff' | 'Student' | 'Parent'
  staff?: {
    id: string
    employeeNumber: string
    category: 'Teaching' | 'Non-Teaching'
    designation: string
    departmentId: string
  }
  student?: {
    id: string
    registerNumber: string
    name: string
    email: string
    department: string
    program: string
    semesterId: string
  }
  studentId?: string
  parent?: {
    id: string
    relationship: string
    phone: string
    linkedStudentIds: string[]
  }
  status?: 'Active' | 'Suspended'
  lastLoginAt?: string
  createdAt?: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

const tokenKey = 'nexus_auth_token'
const userKey = 'nexus_auth_user'

export async function loginWithApi(payload: { email: string; password: string }) {
  return runAuthRequest(async () => {
    const response = await api.post<AuthResponse>('/auth/login', payload)
    saveAuthSession(response.data)
    return response.data
  })
}

export async function fetchCurrentUser() {
  const response = await api.get<{ user: AuthUser }>('/auth/me')

  return response.data.user
}

export async function logoutWithApi() {
  await api.post('/auth/logout')
}

export function saveAuthSession(session: AuthResponse) {
  saveAuthToken(session.token)
  saveAuthUser(session.user)
}

export function saveAuthToken(token: string) {
  window.localStorage.setItem(tokenKey, token)
}

export function getAuthToken() {
  return window.localStorage.getItem(tokenKey)
}

export function saveAuthUser(user: AuthUser) {
  window.localStorage.setItem(userKey, JSON.stringify(user))
}

export function getStoredAuthUser() {
  const rawUser = window.localStorage.getItem(userKey)

  if (!rawUser) return null

  try {
    return JSON.parse(rawUser) as AuthUser
  } catch {
    window.localStorage.removeItem(userKey)
    return null
  }
}

export function clearAuthSession() {
  window.localStorage.removeItem(tokenKey)
  window.localStorage.removeItem(userKey)
}

async function runAuthRequest<T>(request: () => Promise<T>) {
  try {
    return await request()
  } catch (caught) {
    if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
      const message = caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message
      throw new Error(message ?? 'Authentication failed', { cause: caught })
    }

    throw caught
  }
}
