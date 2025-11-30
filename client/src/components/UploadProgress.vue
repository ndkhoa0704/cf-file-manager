<script setup>
import { computed } from 'vue'
import { useFilesStore } from '../stores/files'

const filesStore = useFilesStore()

const allProgress = computed(() => {
  const uploads = Object.entries(filesStore.uploadProgress).map(([id, data]) => ({
    id,
    type: 'upload',
    ...data
  }))
  
  const downloads = Object.entries(filesStore.downloadProgress).map(([id, data]) => ({
    id,
    type: 'download',
    ...data
  }))
  
  return [...uploads, ...downloads]
})

function formatSize(bytes) {
  if (!bytes) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <div v-if="allProgress.length > 0" class="progress-container">
    <div 
      v-for="item in allProgress" 
      :key="item.id" 
      class="progress-item"
      :class="item.status"
    >
      <div class="progress-icon">
        <svg v-if="item.type === 'upload'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      
      <div class="progress-info">
        <div class="progress-header">
          <span class="progress-filename">{{ item.filename }}</span>
          <span class="progress-size" v-if="item.size">{{ formatSize(item.size) }}</span>
        </div>
        
        <div class="progress-bar-container">
          <div 
            class="progress-bar" 
            :style="{ width: `${item.progress}%` }"
          ></div>
        </div>
        
        <div class="progress-footer">
          <span v-if="item.status === 'uploading' || item.status === 'downloading'">
            {{ Math.round(item.progress) }}%
          </span>
          <span v-else-if="item.status === 'completed'" class="status-completed">
            ✓ Completed
          </span>
          <span v-else-if="item.status === 'error'" class="status-error">
            ✕ {{ item.error }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-container {
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}

@media (max-width: 768px) {
  .progress-container {
    padding: 10px 12px;
  }

  .progress-item {
    padding: 10px 12px;
  }

  .progress-icon {
    width: 32px;
    height: 32px;
  }

  .progress-filename {
    font-size: 12px;
  }

  .progress-size {
    font-size: 11px;
  }
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.progress-item.completed {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.05);
}

.progress-item.error {
  border-color: rgba(255, 68, 68, 0.3);
  background: rgba(255, 68, 68, 0.05);
}

.progress-icon {
  width: 36px;
  height: 36px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-cyan);
}

.progress-icon svg {
  width: 18px;
  height: 18px;
}

.progress-info {
  flex: 1;
  min-width: 0;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.progress-filename {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-size {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.progress-bar-container {
  height: 4px;
  background: var(--bg-hover);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-item.completed .progress-bar {
  background: var(--accent-green);
}

.progress-item.error .progress-bar {
  background: #ff4444;
}

.progress-footer {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.status-completed {
  color: var(--accent-green);
}

.status-error {
  color: #ff6666;
}
</style>

