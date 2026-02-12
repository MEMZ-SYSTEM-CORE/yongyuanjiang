<template>
  <div class="storage-page">
    <div class="page-header">
      <h2>存储源管理</h2>
      <button class="btn btn-primary" @click="showAddModal = true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加存储源
      </button>
    </div>
    
    <div class="storage-overview card">
      <div class="usage-bar">
        <div class="usage-info">
          <span class="usage-label">存储空间使用情况</span>
          <span class="usage-value">{{ formatSize(usage.used) }} / {{ formatSize(usage.quota) }}</span>
        </div>
        <div class="usage-progress">
          <div class="progress-fill" :style="{ width: usage.percent + '%' }"></div>
        </div>
      </div>
    </div>
    
    <div class="providers-section">
      <h3>已配置的存储源</h3>
      
      <div v-if="providers.length === 0" class="empty-state card">
        <p>暂无存储源，添加一个开始使用</p>
      </div>
      
      <div v-else class="providers-grid">
        <div v-for="provider in providers" :key="provider.id" class="provider-card card">
          <div class="provider-header">
            <div class="provider-icon" :class="provider.type">
              <svg v-if="provider.type === 'local'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
              <svg v-else-if="provider.type === 'aliyun'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
              </svg>
            </div>
            <div class="provider-info">
              <h4>{{ provider.name }}</h4>
              <span class="provider-type">{{ getProviderName(provider.type) }}</span>
            </div>
            <span v-if="provider.is_default" class="badge badge-primary">默认</span>
          </div>
          
          <div class="provider-stats">
            <span>创建于 {{ formatDate(provider.created_at) }}</span>
          </div>
          
          <div class="provider-actions">
            <button class="btn btn-sm btn-secondary" @click="editProvider(provider)">编辑</button>
            <button class="btn btn-sm btn-secondary" @click="refreshProvider(provider)" v-if="provider.type !== 'local'">刷新</button>
            <button class="btn btn-sm btn-danger" @click="deleteProvider(provider)">删除</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="add-modal" v-if="showAddModal">
      <div class="modal-overlay" @click="showAddModal = false"></div>
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingProvider ? '编辑' : '添加' }}存储源</h2>
          <button @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveProvider" class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input v-model="providerForm.name" type="text" class="input" placeholder="存储源名称" required />
          </div>
          
          <div class="form-group">
            <label>类型</label>
            <select v-model="providerForm.type" class="input" required :disabled="!!editingProvider">
              <option value="local">本地存储</option>
              <option value="aliyun">阿里云盘</option>
              <option value="qcloud">腾讯云COS</option>
              <option value="huawei">华为云OBS</option>
              <option value="onedrive">OneDrive</option>
            </select>
          </div>
          
          <div class="form-group" v-if="providerForm.type !== 'local'">
            <label>配置信息</label>
            <div v-if="providerForm.type === 'aliyun'" class="config-fields">
              <input v-model="providerForm.config.access_token" type="text" class="input" placeholder="Access Token" />
              <input v-model="providerForm.config.refresh_token" type="text" class="input" placeholder="Refresh Token" />
            </div>
            <div v-else-if="providerForm.type === 'qcloud'" class="config-fields">
              <input v-model="providerForm.config.secret_id" type="text" class="input" placeholder="Secret ID" />
              <input v-model="providerForm.config.secret_key" type="password" class="input" placeholder="Secret Key" />
              <input v-model="providerForm.config.region" type="text" class="input" placeholder="Region" />
            </div>
            <div v-else-if="providerForm.type === 'huawei'" class="config-fields">
              <input v-model="providerForm.config.client_id" type="text" class="input" placeholder="Client ID" />
              <input v-model="providerForm.config.client_secret" type="password" class="input" placeholder="Client Secret" />
            </div>
            <div v-else-if="providerForm.type === 'onedrive'" class="config-fields">
              <input v-model="providerForm.config.client_id" type="text" class="input" placeholder="Client ID" />
              <input v-model="providerForm.config.client_secret" type="password" class="input" placeholder="Client Secret" />
            </div>
            <p class="config-note">配置信息将加密存储，请确保凭证安全</p>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="providerForm.is_default" />
              <span>设为默认存储源</span>
            </label>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Provider {
  id: string
  name: string
  type: string
  is_default: number
  created_at: string
}

const authStore = useAuthStore()

const providers = ref<Provider[]>([])
const usage = ref({ used: 0, quota: 10737418240, percent: 0 })
const showAddModal = ref(false)
const editingProvider = ref<Provider | null>(null)
const saving = ref(false)

const providerForm = reactive({
  name: '',
  type: 'local',
  config: {} as Record<string, string>,
  is_default: false
})

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function getProviderName(type: string): string {
  const names: Record<string, string> = {
    local: '本地存储',
    aliyun: '阿里云盘',
    qcloud: '腾讯云COS',
    huawei: '华为云OBS',
    onedrive: 'OneDrive'
  }
  return names[type] || type
}

async function fetchProviders() {
  try {
    const response = await authStore.api.get('/storage/providers')
    providers.value = response.data.providers
  } catch {
    console.error('Failed to fetch providers')
  }
}

async function fetchUsage() {
  try {
    const response = await authStore.api.get('/storage/usage')
    usage.value = {
      used: response.data.used,
      quota: response.data.quota,
      percent: parseFloat(response.data.usage_percentage)
    }
  } catch {
    console.error('Failed to fetch usage')
  }
}

function editProvider(provider: Provider) {
  editingProvider.value = provider
  providerForm.name = provider.name
  providerForm.type = provider.type
  providerForm.is_default = provider.is_default === 1
  showAddModal.value = true
}

async function saveProvider() {
  saving.value = true
  try {
    if (editingProvider.value) {
      await authStore.api.put(`/storage/providers/${editingProvider.value.id}`, {
        name: providerForm.name,
        is_default: providerForm.is_default,
        config: providerForm.config
      })
    } else {
      await authStore.api.post('/storage/providers', {
        name: providerForm.name,
        type: providerForm.type,
        config: providerForm.config,
        is_default: providerForm.is_default
      })
    }
    await fetchProviders()
    closeModal()
  } catch {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function refreshProvider(provider: Provider) {
  try {
    await authStore.api.post(`/storage/providers/${provider.id}/refresh`)
    alert('刷新请求已发送')
  } catch {
    alert('刷新失败')
  }
}

async function deleteProvider(provider: Provider) {
  if (confirm(`确定要删除存储源 "${provider.name}" 吗？`)) {
    try {
      await authStore.api.delete(`/storage/providers/${provider.id}`)
      await fetchProviders()
    } catch {
      alert('删除失败，该存储源可能还有文件')
    }
  }
}

function closeModal() {
  showAddModal.value = false
  editingProvider.value = null
  providerForm.name = ''
  providerForm.type = 'local'
  providerForm.config = {}
  providerForm.is_default = false
}

onMounted(() => {
  fetchProviders()
  fetchUsage()
})
</script>

<style scoped>
.storage-page {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 20px;
}

.storage-overview {
  margin-bottom: 32px;
}

.usage-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-info {
  display: flex;
  justify-content: space-between;
}

.usage-label {
  font-weight: 500;
}

.usage-value {
  color: var(--text-secondary);
}

.usage-progress {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.providers-section h3 {
  margin-bottom: 16px;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.provider-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.provider-icon.local {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.provider-icon.aliyun {
  background: rgba(247, 168, 37, 0.1);
  color: #f7a825;
}

.provider-icon.qcloud {
  background: rgba(4, 165, 240, 0.1);
  color: #04a5f0;
}

.provider-icon.huawei {
  background: rgba(255, 80, 80, 0.1);
  color: #ff5050;
}

.provider-icon.onedrive {
  background: rgba(0, 120, 212, 0.1);
  color: #0078d4;
}

.provider-info {
  flex: 1;
}

.provider-info h4 {
  font-size: 16px;
  margin-bottom: 4px;
}

.provider-type {
  font-size: 13px;
  color: var(--text-secondary);
}

.provider-stats {
  font-size: 13px;
  color: var(--text-secondary);
}

.provider-actions {
  display: flex;
  gap: 8px;
}

.add-modal .modal {
  max-width: 500px;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-note {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .providers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
