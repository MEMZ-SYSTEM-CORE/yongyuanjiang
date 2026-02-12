<template>
  <div class="dashboard">
    <div class="dashboard-grid">
      <div class="card stats-card">
        <div class="stat-item">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ overview.total_files || 0 }}</span>
            <span class="stat-label">文件总数</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2 </svg>
         ="3"/>
            </div>
          <div class="stat-content">
            <span class="stat-value">{{ overview.total_downloads || 0 }}</span>
            <span class="stat-label">下载次数</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatSize(overview.storage_used || 0) }}</span>
            <span class="stat-label">已用空间</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ overview.storage_usage_percent || 0 }}%</span>
            <span class="stat-label">使用率</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>最近上传</h3>
          <router-link to="/files" class="btn btn-sm btn-secondary">查看全部</router-link>
        </div>
        <div v-if="recentFiles.length === 0" class="empty-state">
          <p>暂无文件</p>
        </div>
        <div v-else class="file-list">
          <div v-for="file in recentFiles" :key="file.id" class="file-item" @click="$router.push(`/files/${file.id}`)">
            <div class="file-icon" :class="getFileIconClass(file.mime_type)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span class="file-meta">{{ formatSize(file.file_size) }} · {{ formatDate(file.created_at) }}</span>
            </div>
            <span class="file-downloads">{{ file.download_count }}次下载</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>热门下载</h3>
          <router-link to="/stats" class="btn btn-sm btn-secondary">查看统计</router-link>
        </div>
        <div v-if="topDownloads.length === 0" class="empty-state">
          <p>暂无下载记录</p>
        </div>
        <div v-else class="file-list">
          <div v-for="(file, index) in topDownloads" :key="file.id" class="file-item" @click="$router.push(`/files/${file.id}`)">
            <span class="rank">{{ index + 1 }}</span>
            <div class="file-icon" :class="getFileIconClass(file.mime_type)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span class="file-meta">{{ formatSize(file.file_size) }}</span>
            </div>
            <span class="file-downloads hot">{{ file.download_count }}次</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card quick-actions">
      <h3>快捷操作</h3>
      <div class="actions-grid">
        <label class="action-item upload-btn">
          <input type="file" @change="handleUpload" style="display: none" />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>上传文件</span>
        </label>
        <router-link to="/files" class="action-item">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>文件管理</span>
        </router-link>
        <router-link to="/storage" class="action-item">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <span>存储源</span>
        </router-link>
        <router-link to="/stats" class="action-item">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>统计分析</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFileStore } from '@/stores/files'

const router = useRouter()
const authStore = useAuthStore()
const fileStore = useFileStore()

const overview = ref<any>({})
const recentFiles = ref<any[]>([])
const topDownloads = ref<any[]>([])

function formatSize(bytes: number): string {
  return fileStore.formatFileSize(bytes)
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

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    try {
      await fileStore.uploadFile(input.files[0])
      await fetchDashboardData()
    } catch {
      console.error('Upload failed')
    }
  }
}

async function fetchDashboardData() {
  try {
    const response = await authStore.api.get('/stats/overview')
    overview.value = response.data.overview
    recentFiles.value = response.data.recent_files
    topDownloads.value = response.data.top_downloads
  } catch {
    console.error('Failed to fetch dashboard data')
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stats-card {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.green {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.stat-icon.purple {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.stat-icon.orange {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.file-list {
  display: flex;
  flex-direction: column;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.file-item:hover {
  background: var(--bg-secondary);
}

.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}

.file-icon.image {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.file-icon.video {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.file-icon.pdf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.file-downloads {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-downloads.hot {
  color: var(--primary-color);
  font-weight: 500;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.quick-actions h3 {
  margin-bottom: 20px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition);
}

.action-item:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.upload-btn {
  cursor: pointer;
}

.upload-btn:hover {
  background: var(--bg-tertiary);
}
</style>
