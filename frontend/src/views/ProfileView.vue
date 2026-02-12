<template>
  <div class="profile-page">
    <div class="profile-grid">
      <div class="card profile-card">
        <div class="profile-header">
          <div class="avatar">
            {{ user?.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="profile-info">
            <h2>{{ user?.username }}</h2>
            <p>{{ user?.email }}</p>
            <span class="badge" :class="user?.role === 'admin' ? 'badge-primary' : 'badge-success'">
              {{ user?.role === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </div>
        </div>
        
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">{{ formatSize(user?.used_storage || 0) }}</span>
            <span class="stat-label">已用空间</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatSize(user?.storage_quota || 0) }}</span>
            <span class="stat-label">总空间</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ new Date(user?.created_at || '').toLocaleDateString() }}</span>
            <span class="stat-label">注册时间</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>编辑个人资料</h3>
        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-group">
            <label>用户名</label>
            <input :value="user?.username" type="text" class="input" disabled />
            <p class="form-hint">用户名不可更改</p>
          </div>
          
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="email" type="email" class="input" placeholder="请输入邮箱" required />
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存更改' }}
          </button>
        </form>
      </div>
      
      <div class="card">
        <h3>修改密码</h3>
        <form @submit.prevent="updatePassword" class="profile-form">
          <div class="form-group">
            <label>当前密码</label>
            <input v-model="passwordForm.currentPassword" type="password" class="input" required />
          </div>
          
          <div class="form-group">
            <label>新密码</label>
            <input v-model="passwordForm.newPassword" type="password" class="input" required minlength="6" />
            <p class="form-hint">密码长度至少6个字符</p>
          </div>
          
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="input" required />
          </div>
          
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="success-message">密码已更新</div>
          
          <button type="submit" class="btn btn-primary" :disabled="passwordSaving">
            {{ passwordSaving ? '更新中...' : '更新密码' }}
          </button>
        </form>
      </div>
      
      <div class="card danger-zone">
        <h3>危险操作</h3>
        <div class="danger-content">
          <div class="danger-info">
            <h4>删除账户</h4>
            <p>删除账户后，所有文件和数据将被永久删除，此操作不可恢复。</p>
          </div>
          <button class="btn btn-danger" @click="deleteAccount">删除账户</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const saving = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const email = ref('')
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function updateProfile() {
  saving.value = true
  try {
    const success = await authStore.updateProfile({ email: email.value })
    if (success) {
      alert('个人资料已更新')
    }
  } catch {
    alert('更新失败')
  } finally {
    saving.value = false
  }
}

async function updatePassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    passwordError.value = '密码长度至少6个字符'
    return
  }
  
  passwordSaving.value = true
  try {
    const success = await authStore.updatePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    if (success) {
      passwordSuccess.value = true
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } else {
      passwordError.value = authStore.error || '密码更新失败'
    }
  } finally {
    passwordSaving.value = false
  }
}

async function deleteAccount() {
  if (confirm('确定要删除您的账户吗？此操作不可恢复，所有文件和数据将被永久删除。')) {
    if (confirm('这真的是最后一次确认，请输入 "DELETE" 以继续')) {
      try {
        await authStore.api.delete('/auth/account')
        authStore.logout()
        router.push('/login')
      } catch {
        alert('删除失败')
      }
    }
  }
}

onMounted(() => {
  if (user.value) {
    email.value = user.value.email
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 800px;
}

.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #2563eb 100%);
  color: white;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
}

.profile-info h2 {
  font-size: 24px;
  margin-bottom: 4px;
}

.profile-info p {
  opacity: 0.9;
  margin-bottom: 8px;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.8;
}

.card h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.profile-form {
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

.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.error-message {
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.success-message {
  padding: 12px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--success-color);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.danger-zone {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.danger-zone h3 {
  color: var(--danger-color);
}

.danger-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.danger-info h4 {
  font-size: 14px;
  margin-bottom: 4px;
}

.danger-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .danger-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
