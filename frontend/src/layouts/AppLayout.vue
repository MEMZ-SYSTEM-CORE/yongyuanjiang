<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo">永远酱</h1>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="sidebarCollapsed" d="M9 18l6-6-6-6"/>
            <path v-else d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.name === 'dashboard' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9" rx="1"/>
            <rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="14" y="12" width="7" height="9" rx="1"/>
            <rect x="3" y="16" width="7" height="5" rx="1"/>
          </svg>
          <span v-if="!sidebarCollapsed">仪表盘</span>
        </router-link>
        
        <router-link to="/files" class="nav-item" :class="{ active: $route.name === 'files' || $route.name === 'file-detail' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span v-if="!sidebarCollapsed">文件管理</span>
        </router-link>
        
        <router-link to="/storage" class="nav-item" :class="{ active: $route.name === 'storage' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <span v-if="!sidebarCollapsed">存储源</span>
        </router-link>
        
        <router-link to="/stats" class="nav-item" :class="{ active: $route.name === 'stats' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span v-if="!sidebarCollapsed">统计分析</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <router-link to="/profile" class="nav-item" :class="{ active: $route.name === 'profile' }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span v-if="!sidebarCollapsed">设置</span>
        </router-link>
        
        <button class="nav-item logout-btn" @click="handleLogout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span v-if="!sidebarCollapsed">退出登录</span>
        </button>
      </div>
    </aside>
    
    <main class="main-content">
      <header class="main-header">
        <div class="header-left">
          <h2 class="page-title">{{ $route.meta.title || pageTitle }}</h2>
        </div>
        <div class="header-right">
          <div class="storage-indicator" v-if="authStore.user">
            <div class="storage-bar">
              <div class="storage-used" :style="{ width: storagePercent + '%' }"></div>
            </div>
            <span class="storage-text">{{ formatSize(usedStorage) }} / {{ formatSize(quota) }}</span>
          </div>
          <div class="user-info">
            <span class="username">{{ authStore.user?.username }}</span>
          </div>
        </div>
      </header>
      
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFileStore } from '@/stores/files'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const fileStore = useFileStore()

const sidebarCollapsed = ref(false)
const quota = ref(10737418240)
const usedStorage = ref(0)

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: '仪表盘',
    files: '文件管理',
    'file-detail': '文件详情',
    storage: '存储源管理',
    stats: '统计分析',
    profile: '个人设置'
  }
  return titles[route.name as string] || ''
})

const storagePercent = computed(() => {
  return Math.min((usedStorage.value / quota.value) * 100, 100)
})

function formatSize(bytes: number): string {
  return fileStore.formatFileSize(bytes)
}

async function fetchStorageUsage() {
  try {
    const response = await authStore.api.get('/storage/usage')
    quota.value = response.data.quota
    usedStorage.value = response.data.used
  } catch {
    console.error('Failed to fetch storage usage')
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchStorageUsage()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  white-space: nowrap;
}

.collapse-btn {
  background: none;
  padding: 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.collapse-btn:hover {
  background: var(--bg-tertiary);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: var(--transition);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
}

.logout-btn {
  background: none;
  text-align: left;
  width: 100%;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar.collapsed + .main-content {
  margin-left: 64px;
}

.main-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.storage-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.storage-bar {
  width: 120px;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.storage-used {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.storage-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.content-wrapper {
  flex: 1;
  padding: 32px;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
  
  .main-content {
    margin-left: 64px;
  }
  
  .content-wrapper {
    padding: 16px;
  }
  
  .header-right {
    gap: 12px;
  }
  
  .storage-indicator {
    display: none;
  }
}
</style>
