<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1 class="auth-logo">永远酱</h1>
        <p class="auth-subtitle">创建您的账户</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="input"
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input"
            placeholder="请输入邮箱"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="input"
            placeholder="请输入密码（至少6位）"
            required
          />
        </div>
        
        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="authStore.loading">
          <span v-if="authStore.loading" class="loading"></span>
          <span v-else>注册</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>已有账户？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')

async function handleRegister() {
  if (password.value.length < 6) {
    authStore.error = '密码长度至少6位'
    return
  }
  
  const success = await authStore.register(username.value, email.value, password.value)
  if (success) {
    router.push('/')
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 20px;
}

.auth-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.auth-subtitle {
  color: var(--text-secondary);
}

.auth-form {
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
  font-weight: 500;
  font-size: 14px;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.btn-block {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
}
</style>
