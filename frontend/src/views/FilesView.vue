<template>
  <div class="files-page">
    <div class="page-header">
      <div class="header-left">
        <div class="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文件..."
            class="search-input"
            @input="handleSearch"
          />
        </div>
      </div>
      <div class="header-right">
        <label class="btn btn-primary upload-btn">
          <input type="file" @change="handleUpload" style="display: none" multiple />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          上传文件
        </label>
      </div>
    </div>
    
    <div v-if="fileStore.uploadProgress > 0 && fileStore.uploadProgress < 100" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: fileStore.uploadProgress + '%' }"></div>
      </div>
      <span>上传中 {{ fileStore.uploadProgress }}%</span>
    </div>
    
    <div v-if="fileStore.error" class="error-alert">
      {{ fileStore.error }}
      <button @click="fileStore.error = null">×</button>
    </div>
    
    <div v-if="fileStore.files.length === 0 && !fileStore.loading" class="empty-state card">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      <h3>暂无文件</h3>
      <p>上传您的第一个文件开始使用</p>
      <label class="btn btn-primary">
        <input type="file" @change="handleUpload" style="display: none" />
        上传文件
      </label>
    </div>
    
    <div v-else class="files-grid">
      <div v-for="file in fileStore.files" :key="file.id" class="file-card" @click="$router.push(`/files/${file.id}`)">
        <div class="file-preview">
          <div v-if="file.mime_type.startsWith('image/')" class="preview-image">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div v-else-if="file.mime_type.startsWith('video/')" class="preview-video">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <div v-else-if="file.mime_type.includes('pdf')" class="preview-pdf">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div v-else class="preview-file">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
        <div class="file-info">
          <h4 class="file-name" :title="file.original_name">{{ file.original_name }}</h4>
          <div class="file-meta">
            <span>{{ fileStore.formatFileSize(file.file_size) }}</span>
            <span>{{ file.download_count }}次下载</span>
          </div>
        </div>
        <div class="file-actions" @click.stop>
          <button class="action-btn" @click="handleDownload(file.id)" title="下载">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button class="action-btn" @click="handleCopyLink(file.id)" title="复制链接">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="action-btn danger" @click="handleDelete(file)" title="删除">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="fileStore.pagination.pages > 1" class="pagination">
      <button 
        class="page-btn" 
        :disabled="fileStore.pagination.page === 1"
        @click="changePage(fileStore.pagination.page - 1)"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ fileStore.pagination.page }} / {{ fileStore.pagination.pages }} 页
      </span>
      <button 
        class="page-btn"
        :disabled="fileStore.pagination.page === fileStore.pagination.pages"
        @click="changePage(fileStore.pagination.page + 1)"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFileStore } from '@/stores/files'

const route = useRoute()
const fileStore = useFileStore()

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout>

function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fileStore.fetchFiles({ search: searchQuery.value })
  }, 300)
}

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    for (const file of Array.from(input.files)) {
      try {
        await fileStore.uploadFile(file)
      } catch {
        console.error('Upload failed')
      }
    }
    input.value = ''
  }
}

async function handleDownload(fileId: string) {
  try {
    const response = await fileStore.api.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    console.error('Download failed')
  }
}

async function handleCopyLink(fileId: string) {
  const result = await fileStore.getDirectLink(fileId)
  if (result) {
    await navigator.clipboard.writeText(result.direct_link)
    alert('链接已复制到剪贴板')
  }
}

async function handleDelete(file: any) {
  if (confirm(`确定要删除文件 "${file.original_name}" 吗？`)) {
    await fileStore.deleteFile(file.id)
  }
}

function changePage(page: number) {
  fileStore.fetchFiles({ page })
}

onMounted(() => {
  fileStore.fetchFiles()
})
</script>

<style scoped>
.files-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  width: 300px;
}

.search-box svg {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
}

.progress-bar {
  flex: 1;
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

.error-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
  border-radius: var(--radius-md);
}

.error-alert button {
  background: none;
  font-size: 20px;
  padding: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-state p {
  margin-bottom: 20px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.file-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition);
}

.file-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.file-preview {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
}

.preview-image {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.preview-video {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.preview-pdf {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.preview-file {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.file-info {
  padding: 16px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.file-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: var(--transition);
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-color);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.page-btn {
  padding: 10px 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: var(--transition);
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    width: 100%;
  }
  
  .header-right {
    display: flex;
    justify-content: flex-end;
  }
  
  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
}
</style>
