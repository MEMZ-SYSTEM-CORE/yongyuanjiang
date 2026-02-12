<template>
  <div class="stats-page">
    <div class="stats-header">
      <h2>统计分析</h2>
      <button class="btn btn-secondary" @click="exportLogs">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        导出下载日志
      </button>
    </div>
    
    <div class="stats-grid">
      <div class="card stats-card">
        <div class="stat-item">
          <div class="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ analytics.this_month?.total_files || 0 }}</span>
            <span class="stat-label">本月上传</span>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ analytics.this_month?.total_downloads || 0 }}</span>
            <span class="stat-label">本月下载</span>
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
            <span class="stat-value">{{ formatSize(analytics.this_month?.total_bytes || 0) }}</span>
            <span class="stat-label">本月流量</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>文件类型分布</h3>
        <div class="type-list">
          <div v-for="type in analytics.file_type_breakdown" :key="type.type" class="type-item">
            <div class="type-info">
              <span class="type-icon" :class="type.type">{{ getTypeIcon(type.type) }}</span>
              <span class="type-name">{{ getTypeName(type.type) }}</span>
            </div>
            <div class="type-stats">
              <span>{{ type.count }} 个文件</span>
              <span>{{ formatSize(type.total_size || 0) }}</span>
            </div>
            <div class="type-bar">
              <div class="type-fill" :style="{ width: getTypePercent(type.count) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>上传历史（近30天）</h3>
        <div class="chart-container">
          <div class="bar-chart">
            <div 
              v-for="(day, index) in history" 
              :key="index"
              class="chart-bar"
              :style="{ height: getBarHeight(day.uploaded_bytes) + '%' }"
              :title="day.date + ': ' + formatSize(day.uploaded_bytes)"
            ></div>
          </div>
          <div class="chart-labels">
            <span>{{ history.length > 0 ? history[history.length - 1]?.date?.slice(5) : '-' }}</span>
            <span>今天</span>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3>下载日志</h3>
        <div v-if="downloadLogs.length === 0" class="empty-state">
          <p>暂无下载记录</p>
        </div>
        <div v-else class="logs-table">
          <table class="table">
            <thead>
              <tr>
                <th>文件名</th>
                <th>IP</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in downloadLogs" :key="log.id">
                <td>{{ log.original_name }}</td>
                <td>{{ log.ip_address || 'N/A' }}</td>
                <td>{{ formatDateTime(log.downloaded_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="pagination.pages > 1" class="pagination">
          <button 
            class="page-btn" 
            :disabled="pagination.page === 1"
            @click="fetchLogs(pagination.page - 1)"
          >上一页</button>
          <span>{{ pagination.page }} / {{ pagination.pages }}</span>
          <button 
            class="page-btn"
            :disabled="pagination.page === pagination.pages"
            @click="fetchLogs(pagination.page + 1)"
          >下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface DownloadLog {
  id: string
  file_id: string
  original_name: string
  ip_address: string
  downloaded_at: string
}

interface FileType {
  type: string
  count: number
  total_size: number
}

interface HistoryItem {
  date: string
  uploaded_bytes: number
  file_count: number
}

const authStore = useAuthStore()

const analytics = ref<any>({})
const history = ref<HistoryItem[]>([])
const downloadLogs = ref<DownloadLog[]>([])
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 0 })

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    images: '🖼',
    videos: '🎬',
    audio: '🎵',
    pdf: '📄',
    archives: '📦',
    documents: '📃',
    others: '📁'
  }
  return icons[type] || '📁'
}

function getTypeName(type: string): string {
  const names: Record<string, string> = {
    images: '图片',
    videos: '视频',
    audio: '音频',
    pdf: 'PDF文档',
    archives: '压缩包',
    documents: '文档',
    others: '其他'
  }
  return names[type] || '其他'
}

function getTypePercent(count: number): string {
  const total = analytics.value.file_type_breakdown?.reduce((sum: number, t: FileType) => sum + t.count, 0) || 1
  return ((count / total) * 100).toFixed(1)
}

function getBarHeight(bytes: number): number {
  const max = Math.max(...history.value.map(d => d.uploaded_bytes), 1)
  return (bytes / max) * 100
}

async function fetchAnalytics() {
  try {
    const response = await authStore.api.get('/stats/analytics')
    analytics.value = response.data
  } catch {
    console.error('Failed to fetch analytics')
  }
}

async function fetchHistory() {
  try {
    const response = await authStore.api.get('/stats/storage/history')
    history.value = response.data.history || []
  } catch {
    console.error('Failed to fetch history')
  }
}

async function fetchLogs(page: number = 1) {
  try {
    const response = await authStore.api.get('/stats/downloads', { params: { page, limit: 50 } })
    downloadLogs.value = response.data.logs
    pagination.value = response.data.pagination
  } catch {
    console.error('Failed to fetch logs')
  }
}

async function exportLogs() {
  try {
    const response = await authStore.api.get('/stats/downloads/export', {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `download_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch {
    alert('导出失败')
  }
}

onMounted(() => {
  fetchAnalytics()
  fetchHistory()
  fetchLogs()
})
</script>

<style scoped>
.stats-page {
  max-width: 1200px;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.stats-header h2 {
  font-size: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
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

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.card h3 {
  font-size: 16px;
  margin-bottom: 20px;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  font-size: 20px;
}

.type-name {
  font-weight: 500;
}

.type-stats {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.type-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.type-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.chart-container {
  padding: 20px 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 150px;
  padding-bottom: 24px;
}

.chart-bar {
  flex: 1;
  min-width: 4px;
  background: var(--primary-color);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
  cursor: pointer;
}

.chart-bar:hover {
  background: var(--primary-hover);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.logs-table {
  overflow-x: auto;
}

.logs-table .table {
  min-width: 400px;
}

.logs-table td {
  font-size: 13px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.page-btn:disabled {
  opacity: 0.5;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-card {
    grid-template-columns: 1fr;
  }
}
</style>
