<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
</script>

<template>
  <div class="login-page">
    <div class="login-container animate-slide-up">
      <!-- Logo/Brand -->
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            <path d="M12 11v6M9 14h6" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="brand-title">CloudFiles</h1>
        <p class="brand-subtitle">Secure File Management</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="authStore.login(username, password)" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              id="username"
              v-model="username"
              type="text"
              class="input"
              placeholder="Enter username"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              placeholder="Enter password"
              autocomplete="current-password"
              required
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <p v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </p>

        <button 
          type="submit" 
          class="btn btn-primary btn-login"
          :disabled="authStore.loading || !username || !password"
        >
          <span v-if="authStore.loading" class="spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <!-- Footer -->
      <div class="login-footer">
        <p>Protected by end-to-end encryption</p>
      </div>
    </div>

    <!-- Decorative elements -->
    <div class="bg-grid"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}

.bg-glow-1 {
  top: -200px;
  left: -200px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.15), transparent 70%);
}

.bg-glow-2 {
  bottom: -200px;
  right: -200px;
  background: radial-gradient(circle, rgba(153, 51, 255, 0.15), transparent 70%);
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  position: relative;
  z-index: 1;
}

.brand {
  text-align: center;
  margin-bottom: 40px;
}

.brand-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--glow-cyan);
}

.brand-icon svg {
  width: 36px;
  height: 36px;
  color: var(--bg-primary);
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  pointer-events: none;
}

.input-wrapper .input {
  padding-left: 44px;
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.toggle-password:hover {
  color: var(--text-secondary);
}

.toggle-password svg {
  width: 18px;
  height: 18px;
}

.error-message {
  color: #ff6666;
  font-size: 13px;
  background: rgba(255, 68, 68, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 68, 68, 0.2);
}

.btn-login {
  margin-top: 8px;
  padding: 14px 20px;
  font-size: 15px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.login-footer p {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.login-footer p::before {
  content: '🔒';
  font-size: 11px;
}
</style>

