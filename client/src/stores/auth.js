import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
  }

  async function login(username, password) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/login', { username, password })
      setToken(response.data.token)
      user.value = response.data.user
      router.push('/')
      return true
    } catch (err) {
      error.value = err.response?.data?.error || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function checkAuth() {
    if (!token.value) return false
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      return true
    } catch (err) {
      logout()
      return false
    }
  }

  function logout() {
    setToken(null)
    user.value = null
    router.push('/login')
  }

  async function changePassword(currentPassword, newPassword) {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to change password' }
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuth,
    changePassword
  }
})

