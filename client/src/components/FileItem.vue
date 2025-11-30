<script setup>
import { computed } from 'vue'
import { useFilesStore } from '../stores/files'

const props = defineProps({
  item: Object,
  currentPath: String
})

const emit = defineEmits(['click', 'contextmenu'])

const filesStore = useFilesStore()

const fullPath = computed(() => {
  return props.currentPath ? `${props.currentPath}/${props.item.name}` : props.item.name
})

const fileExtension = computed(() => {
  if (props.item.isDirectory) return null
  const parts = props.item.name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : null
})

const iconType = computed(() => {
  if (props.item.isDirectory) return 'folder'
  
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const videoExts = ['mp4', 'webm', 'avi', 'mkv', 'mov']
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf']
  const codeExts = ['js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json', 'xml']
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz']
  
  const ext = fileExtension.value
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (docExts.includes(ext)) return 'document'
  if (codeExts.includes(ext)) return 'code'
  if (archiveExts.includes(ext)) return 'archive'
  return 'file'
})

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function handleDownload() {
  if (!props.item.isDirectory) {
    filesStore.downloadFile(fullPath.value, props.item.name)
  }
}
</script>

<template>
  <div 
    class="file-item"
    :class="{ directory: item.isDirectory }"
    @click="emit('click')"
    @contextmenu="emit('contextmenu', $event)"
  >
    <div class="file-icon" :class="iconType">
      <!-- Folder icon -->
      <svg v-if="iconType === 'folder'" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.59a1 1 0 01-.7-.29l-1.42-1.42a1 1 0 00-.7-.29H5a2 2 0 00-2 2z"/>
      </svg>
      <!-- Image icon -->
      <svg v-else-if="iconType === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <!-- Video icon -->
      <svg v-else-if="iconType === 'video'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
      <!-- Audio icon -->
      <svg v-else-if="iconType === 'audio'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
      <!-- Document icon -->
      <svg v-else-if="iconType === 'document'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <!-- Code icon -->
      <svg v-else-if="iconType === 'code'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
      <!-- Archive icon -->
      <svg v-else-if="iconType === 'archive'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="21 8 21 21 3 21 3 8"/>
        <rect x="1" y="3" width="22" height="5"/>
        <line x1="10" y1="12" x2="14" y2="12"/>
      </svg>
      <!-- Default file icon -->
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    </div>
    
    <div class="file-info">
      <span class="file-name" :title="item.name">{{ item.name }}</span>
      <span class="file-meta">
        <template v-if="item.isDirectory">Folder</template>
        <template v-else>{{ formatSize(item.size) }}</template>
        <span class="separator">•</span>
        {{ formatDate(item.modified) }}
      </span>
    </div>
    
    <button 
      v-if="!item.isDirectory"
      class="download-btn"
      @click.stop="handleDownload"
      title="Download"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.file-item:hover {
  border-color: var(--border-accent);
  background: var(--bg-tertiary);
}

.file-item.directory:hover {
  border-color: var(--accent-cyan);
}

.file-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon svg {
  width: 22px;
  height: 22px;
}

.file-icon.folder {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(153, 51, 255, 0.15));
  color: var(--accent-cyan);
}

.file-icon.image {
  background: rgba(0, 255, 136, 0.1);
  color: var(--accent-green);
}

.file-icon.video {
  background: rgba(255, 0, 170, 0.1);
  color: var(--accent-magenta);
}

.file-icon.audio {
  background: rgba(153, 51, 255, 0.1);
  color: var(--accent-purple);
}

.file-icon.document {
  background: rgba(255, 102, 0, 0.1);
  color: var(--accent-orange);
}

.file-icon.code {
  background: rgba(0, 212, 255, 0.1);
  color: var(--accent-cyan);
}

.file-icon.archive {
  background: rgba(255, 204, 0, 0.1);
  color: #ffcc00;
}

.file-icon.file {
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.file-meta .separator {
  margin: 0 6px;
}

.download-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--transition-fast);
}

.file-item:hover .download-btn {
  opacity: 1;
}

.download-btn:hover {
  background: var(--accent-cyan);
  color: var(--bg-primary);
}

.download-btn svg {
  width: 16px;
  height: 16px;
}
</style>

