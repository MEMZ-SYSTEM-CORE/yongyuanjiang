import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import router from '@/router'

interface User {
  id: string
  username: string
  email: string
  role: string
  storage_quota?: number
  used_storage?: number
}

interface LoginResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const api = axios.create({
    baseURL: '/api'
  })

  api.interceptors.request.use((config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout()
        router.push('/login')
      }
      return Promise.reject(error)
    }
  )

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password })
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<LoginResponse>('/auth/register', { username, email, password })
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    loading.value = true
    try {
      const response = await api.get<{ user: User }>('/auth/me')
      user.value = response.data.user
    } catch {
      logout()
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    router.push('/login')
  }

  async function updateProfile(data: { email: string }) {
    loading.value = true
    try {
      await api.put('/auth/profile', data)
      await fetchUser()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Update failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    loading.value = true
    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Password update failed'
      return false
    } finally {
      loading.value = false
    }
  }

  if (token.value) {
    fetchUser()
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    api,
    login,
    register,
    fetchUser,
    logout,
    updateProfile,
    updatePassword
  }
})
