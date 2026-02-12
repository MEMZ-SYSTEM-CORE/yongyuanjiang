<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
      <h1>404</h1>
      <p>页面不存在</p>
      <router-link to="/" class="btn btn-primary">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 20px;
}

.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.not-found-container svg {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.not-found-container h1 {
  font-size: 72px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.not-found-container p {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}
</style>
