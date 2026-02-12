<template>
  <div class="file-detail" v-if="file">
    <div class="back-link">
      <router-link to="/files">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        返回文件列表
      </router-link>
    </div>
    
    <div class="detail-card card">
      <div class="file-header">
        <div class="file-icon-large" :class="getFileIconClass(file.mime_type)">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="file-main-info">
          <h1>{{ file.original_name }}</h1>
          <div class="file-badges">
            <span class="badge" :class="file.is_public ? 'badge-success' : 'badge-warning'">
              {{ file.is_public ? '公开' : '私有' }}
            </span>
            <span class="badge badge-primary">{{ getFileType(file.mime_type) }}</span>
          </div>
        </div>
      </div>
      
      <div class="file-stats">
        <div class="stat">
          <span class="stat-label">文件大小</span>
          <span class="stat-value">{{ fileStore.formatFileSize(file.file_size) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">下载次数</span>
          <span class="stat-value">{{ file.download_count }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">上传时间</span>
          <span class="stat-value">{{ formatDate(file.created_at) }}</span>
        </div>
        <div class="stat" v-if="file.expires_at">
          <span class="stat-label">过期时间</span>
          <span class="stat-value">{{ formatDate(file.expires_at) }}</span>
        </div>
      </div>
      
      <div class="file-actions-large">
        <button class="btn btn-primary" @click="handleDownload">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下载文件
        </button>
        <button class="btn btn-secondary" @click="handleCopyLink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          复制链接
        </button>
        <button class="btn btn-secondary" @click="showDirectLinkModal = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          生成分享链接
        </button>
      </div>
    </div>
    
    <div class="settings-card card">
      <h3>文件设置</h3>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>公开访问</label>
          <p>允许任何人通过链接下载此文件</p>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="isPublic" @change="updatePublic" />
          <span class="slider"></span>
        </label>
      </div>
      
      <div class="setting-item">
        <div class="setting-info">
          <label>过期时间</label>
          <p>设置链接过期时间，过期后文件将无法访问</p>
        </div>
        <input 
          type="datetime-local" 
          v-model="expiresAt" 
          class="input date-input"
          @change="updateExpires"
        />
      </div>
    </div>
    
    <div v-if="directLink" class="direct-link-card card">
      <h3>分享链接</h3>
      <div class="direct-link-box">
        <input type="text" :value="directLink" readonly class="input" />
        <button class="btn btn-primary" @click="copyDirectLink">复制</button>
      </div>
      <p class="link-expires">链接有效期至: {{ formatDateTime(directLinkExpires) }}</p>
    </div>
    
    <div class="danger-zone card">
      <h3>危险操作</h3>
      <button class="btn btn-danger" @click="handleDelete">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        删除文件
      </button>
    </div>
  </div>
  
  <div v-else-if="loading" class="loading-state">
    <div class="loading"></div>
    <p>加载中...</p>
  </div>
  
  <div v-else class="error-state card">
    <p>文件不存在或已被删除</p>
    <router-link to="/files" class="btn btn-primary">返回文件列表</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFileStore } from '@/stores/files'

const route = useRoute()
const router = useRouter()
const fileStore = useFileStore()

const loading = ref(true)
const file = ref<any>(null)
const isPublic = ref(false)
const expiresAt = ref('')
const directLink = ref('')
const directLinkExpires = ref('')
const showDirectLinkModal = ref(false)

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getFileIconClass(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'file'
}

function getFileType(mimeType: string): string {
  const types: Record<string, string> = {
    'image': '图片',
    'video': '视频',
    'audio': '音频',
    'pdf': 'PDF文档',
    'text': '文本',
    'archive': '压缩包'
  }
  if (mimeType.startsWith('image/')) return types.image
  if (mimeType.startsWith('video/')) return types.video
  if (mimeType.startsWith('audio/')) return types.audio
  if (mimeType.includes('pdf')) return types.pdf
  if (mimeType.includes('zip') || mimeType.includes('rar')) return types.archive
  if (mimeType.startsWith('text/')) return types.text
  return '其他文件'
}

async function handleDownload() {
  try {
    const response = await fileStore.api.get(`/files/${file.value.id}/download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', file.value.original_name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    alert('下载失败')
  }
}

async function handleCopyLink() {
  const result = await fileStore.getDirectLink(file.value.id)
  if (result) {
    await navigator.clipboard.writeText(result.direct_link)
    alert('链接已复制到剪贴板')
  }
}

async function handleGetDirectLink() {
  const result = await fileStore.getDirectLink(file.value.id)
  if (result) {
    directLink.value = result.direct_link
    directLinkExpires.value = result.expires_at
  }
}

function copyDirectLink() {
  navigator.clipboard.writeText(directLink.value)
  alert('链接已复制到剪贴板')
}

async function updatePublic() {
  await fileStore.updateVisibility(file.value.id, isPublic.value)
}

async function updateExpires() {
  await fileStore.updateVisibility(file.value.id, isPublic.value, expiresAt.value || undefined)
}

async function handleDelete() {
  if (confirm(`确定要删除文件 "${file.value.original_name}" 吗？此操作不可恢复。`)) {
    await fileStore.deleteFile(file.value.id)
    router.push('/files')
  }
}

onMounted(async () => {
  const id = route.params.id as string
  const fetchedFile = await fileStore.fetchFile(id)
  if (fetchedFile) {
    file.value = fetchedFile
    isPublic.value = fetchedFile.is_public === 1
    if (fetchedFile.expires_at) {
      expiresAt.value = new Date(fetchedFile.expires_at).toISOString().slice(0, 16)
    }
  }
  loading.value = false
})
</script>

<style scoped>
.file-detail {
  max-width: 800px;
}

.back-link {
  margin-bottom: 24px;
}

.back-link a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.back-link a:hover {
  color: var(--primary-color);
}

.detail-card {
  margin-bottom: 24px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.file-icon-large {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.file-icon-large.image {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.file-icon-large.video {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.file-icon-large.pdf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-main-info h1 {
  font-size: 20px;
  margin-bottom: 12px;
}

.file-badges {
  display: flex;
  gap: 8px;
}

.file-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 500;
}

.file-actions-large {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.settings-card {
  margin-bottom: 24px;
}

.settings-card h3 {
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info label {
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-info p {
  font-size: 13px;
  color: var(--text-secondary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary);
  transition: 0.3s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.date-input {
  width: 200px;
}

.direct-link-card {
  margin-bottom: 24px;
}

.direct-link-card h3 {
  margin-bottom: 16px;
}

.direct-link-box {
  display: flex;
  gap: 12px;
}

.direct-link-box .input {
  flex: 1;
}

.link-expires {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
}

.danger-zone {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.danger-zone h3 {
  color: var(--danger-color);
  margin-bottom: 16px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
}

.loading-state p {
  margin-top: 16px;
  color: var(--text-secondary);
}

.error-state p {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .file-header {
    flex-direction: column;
    text-align: center;
  }
  
  .file-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .file-actions-large {
    flex-direction: column;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .date-input {
    width: 100%;
  }
}
</style>
