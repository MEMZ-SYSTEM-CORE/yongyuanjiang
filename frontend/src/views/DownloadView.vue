<template>
  <div class="download-page">
    <div class="download-container">
      <div v-if="loading" class="loading-state">
        <div class="loading"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h2>下载失败</h2>
        <p>{{ error }}</p>
        <a href="/" class="btn btn-primary">返回首页</a>
      </div>
      
      <div v-else-if="file" class="file-info-card">
        <div class="file-icon-large" :class="getFileIconClass(file.mime_type)">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        
        <h1>{{ file.original_name }}</h1>
        
        <div class="file-meta">
          <span>{{ formatSize(file.file_size) }}</span>
          <span>{{ file.download_count }} 次下载</span>
          <span v-if="file.expires_at">有效期至 {{ formatDate(file.expires_at) }}</span>
        </div>
        
        <div class="download-actions">
          <button class="btn btn-primary btn-lg" @click="handleDownload">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            下载文件
          </button>
        </div>
        
        <p class="download-note">下载次数已计入统计</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

interface File {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  download_count: number
  expires_at?: string
}

const route = useRoute()
const loading = ref(true)
const error = ref('')
const file = ref<File | null>(null)

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

function getFileIconClass(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'file'
}

async function handleDownload() {
  if (!file.value) return
  
  try {
    const response = await axios.get(`/api/files/${file.value.id}/download`, {
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

onMounted(async () => {
  const fileId = route.params.id as string
  try {
    const response = await axios.get<{ file: File }>(`/api/files/${fileId}`)
    file.value = response.data.file
  } catch (err: any) {
    error.value = err.response?.data?.error || '文件不存在或已过期'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.download-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 20px;
}

.download-container {
  width: 100%;
  max-width: 480px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.loading-state p {
  margin-top: 16px;
  color: var(--text-secondary);
}

.error-state svg {
  color: var(--danger-color);
  margin-bottom: 16px;
}

.error-state h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.error-state p {
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.file-info-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 48px 32px;
  text-align: center;
}

.file-icon-large {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  margin: 0 auto 24px;
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

.file-info-card h1 {
  font-size: 20px;
  margin-bottom: 16px;
  word-break: break-all;
}

.file-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  font-size: 14px;
  color: var(--text-secondary);
}

.download-actions {
  margin-bottom: 16px;
}

.download-note {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
