<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const authStore = useAuthStore()

const users = ref([])
const loading = ref(true)
const error = ref('')

// Create user form
const showCreateUser = ref(false)
const newUser = ref({ username: '', password: '', role: 'user' })
const createError = ref('')
const createLoading = ref(false)

// Reset password
const resetPasswordModal = ref({ show: false, userId: null, username: '' })
const newPassword = ref('')
const resetLoading = ref(false)

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  if (!newUser.value.username || !newUser.value.password) return
  
  createLoading.value = true
  createError.value = ''
  
  try {
    await api.post('/users', newUser.value)
    newUser.value = { username: '', password: '', role: 'user' }
    showCreateUser.value = false
    await loadUsers()
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create user'
  } finally {
    createLoading.value = false
  }
}

async function deleteUser(user) {
  if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) return
  
  try {
    await api.delete(`/users/${user.id}`)
    await loadUsers()
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to delete user')
  }
}

function openResetPassword(user) {
  resetPasswordModal.value = { show: true, userId: user.id, username: user.username }
  newPassword.value = ''
}

async function resetPassword() {
  if (!newPassword.value) return
  
  resetLoading.value = true
  
  try {
    await api.post(`/users/${resetPasswordModal.value.userId}/reset-password`, {
      newPassword: newPassword.value
    })
    resetPasswordModal.value.show = false
    alert('Password reset successfully')
  } catch (err) {
    alert(err.response?.data?.error || 'Failed to reset password')
  } finally {
    resetLoading.value = false
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="admin-page">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="btn btn-ghost" @click="router.push('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span class="btn-text">Back to Files</span>
        </button>
      </div>
      
      <h1>User Management</h1>
      
      <div class="header-right">
        <span class="user-badge admin">
          {{ authStore.user?.username }}
          <span class="role-tag">Admin</span>
        </span>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <div class="content-header">
        <h2>Users</h2>
        <button class="btn btn-primary" @click="showCreateUser = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-text">Add User</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading users...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="loadUsers">Retry</button>
      </div>

      <!-- Users Table (Desktop) -->
      <div v-else class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" :class="{ current: user.id === authStore.user?.id }">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ user.username }}</span>
                  <span v-if="user.id === authStore.user?.id" class="you-badge">You</span>
                </div>
              </td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ user.role }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="actions-cell">
                  <button 
                    class="btn btn-ghost btn-sm"
                    @click="openResetPassword(user)"
                    title="Reset Password"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </button>
                  <button 
                    v-if="user.id !== authStore.user?.id"
                    class="btn btn-ghost btn-sm danger"
                    @click="deleteUser(user)"
                    title="Delete User"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Card Layout -->
        <div class="users-cards">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-card"
            :class="{ current: user.id === authStore.user?.id }"
          >
            <div class="user-card-header">
              <div class="user-cell">
                <div class="user-avatar">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span>{{ user.username }}</span>
                    <span v-if="user.id === authStore.user?.id" class="you-badge">You</span>
                  </div>
                  <span class="role-badge" :class="user.role" style="margin-top: 4px; display: inline-block;">
                    {{ user.role }}
                  </span>
                </div>
              </div>
            </div>
            <div class="user-card-body">
              <div class="user-card-row">
                <span class="user-card-label">Created</span>
                <span>{{ formatDate(user.created_at) }}</span>
              </div>
            </div>
            <div class="user-card-actions">
              <button 
                class="btn btn-secondary btn-sm"
                @click="openResetPassword(user)"
                style="flex: 1;"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Reset Password
              </button>
              <button 
                v-if="user.id !== authStore.user?.id"
                class="btn btn-danger btn-sm"
                @click="deleteUser(user)"
                style="flex: 1;"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create User Modal -->
    <div v-if="showCreateUser" class="modal-backdrop" @click.self="showCreateUser = false">
      <div class="modal animate-slide-up">
        <div class="modal-header">
          <h2>Create New User</h2>
          <button class="close-btn" @click="showCreateUser = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="createUser" class="modal-body">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              id="username"
              v-model="newUser.username"
              type="text"
              class="input"
              placeholder="Enter username (min 3 characters)"
              minlength="3"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              v-model="newUser.password"
              type="password"
              class="input"
              placeholder="Enter password (min 6 characters)"
              minlength="6"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" v-model="newUser.role" class="input">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <p v-if="createError" class="error-message">{{ createError }}</p>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showCreateUser = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="createLoading">
              <span v-if="createLoading" class="spinner"></span>
              <span v-else>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="resetPasswordModal.show" class="modal-backdrop" @click.self="resetPasswordModal.show = false">
      <div class="modal animate-slide-up">
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button class="close-btn" @click="resetPasswordModal.show = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="resetPassword" class="modal-body">
          <p class="reset-info">
            Reset password for <strong>{{ resetPasswordModal.username }}</strong>
          </p>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input 
              id="newPassword"
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="Enter new password (min 6 characters)"
              minlength="6"
              required
            />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="resetPasswordModal.show = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="resetLoading">
              <span v-if="resetLoading" class="spinner"></span>
              <span v-else>Reset Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  gap: 12px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  text-align: center;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
  }

  .header h1 {
    font-size: 16px;
    text-align: left;
  }

  .header-left .btn-text {
    display: none;
  }

  .header-left .btn {
    padding: 8px;
  }
}

.btn-text {
  display: inline;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.role-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent-purple);
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Content */
.content {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
}

.content-header h2 {
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .content {
    padding: 16px 12px;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .content-header h2 {
    font-size: 18px;
  }

  .content-header .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Loading/Error states */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-hover);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.error-state {
  color: #ff6666;
}

.error-state .btn {
  margin-top: 16px;
}

/* Users Table */
.users-table-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 14px 20px;
  text-align: left;
}

.users-table th {
  background: var(--bg-tertiary);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table tr {
  border-bottom: 1px solid var(--border-subtle);
}

.users-table tr:last-child {
  border-bottom: none;
}

.users-table tr:hover {
  background: var(--bg-tertiary);
}

.users-table tr.current {
  background: rgba(0, 212, 255, 0.05);
}

/* Mobile card layout */
.users-cards {
  display: none;
}

@media (max-width: 768px) {
  .users-table-container {
    background: transparent;
    border: none;
    padding: 0;
  }

  .users-table {
    display: none;
  }

  .users-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-card.current {
    background: rgba(0, 212, 255, 0.05);
    border-color: var(--accent-cyan);
  }

  .user-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .user-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .user-card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
  }

  .user-card-label {
    color: var(--text-muted);
    font-size: 12px;
  }

  .user-card-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .user-card-actions .btn {
    flex: 1;
    justify-content: center;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--bg-primary);
}

.you-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--bg-hover);
  color: var(--text-muted);
  border-radius: 4px;
}

.role-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}

.role-badge.admin {
  background: rgba(153, 51, 255, 0.15);
  color: var(--accent-purple);
}

.role-badge.user {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent-cyan);
}

.date-cell {
  color: var(--text-muted);
  font-size: 13px;
}

.actions-cell {
  display: flex;
  gap: 4px;
}

.actions-cell .btn.danger:hover {
  color: #ff6666;
  background: rgba(255, 68, 68, 0.1);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

@media (max-width: 768px) {
  .modal-backdrop {
    padding: 16px;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 20px 16px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.form-group select.input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239090a8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}

.reset-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
}

.reset-info strong {
  color: var(--accent-cyan);
}

.error-message {
  color: #ff6666;
  font-size: 13px;
  background: rgba(255, 68, 68, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

