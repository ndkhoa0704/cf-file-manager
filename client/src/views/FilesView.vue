<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import FileItem from '../components/FileItem.vue'
import UploadProgress from '../components/UploadProgress.vue'
import CreateFolderModal from '../components/CreateFolderModal.vue'
import ContextMenu from '../components/ContextMenu.vue'

const router = useRouter()
const authStore = useAuthStore()
const filesStore = useFilesStore()

const showCreateFolder = ref(false)
const fileInput = ref(null)
const isDragging = ref(false)

// Context menu
const contextMenu = ref({ show: false, x: 0, y: 0, item: null })

const breadcrumbs = computed(() => {
  const parts = filesStore.currentPath.split('/').filter(Boolean)
  return parts.map((name, index) => ({
    name,
    path: parts.slice(0, index + 1).join('/')
  }))
})

onMounted(() => {
  filesStore.listFiles('')
})

function handleFileSelect(event) {
  const files = event.target.files
  for (const file of files) {
    filesStore.uploadFile(file)
  }
  event.target.value = ''
}

function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer.files
  for (const file of files) {
    filesStore.uploadFile(file)
  }
}

function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleItemClick(item) {
  if (item.isDirectory) {
    filesStore.navigateTo(item.name)
  }
}

function handleContextMenu(event, item) {
  event.preventDefault()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item
  }
}

function closeContextMenu() {
  contextMenu.value.show = false
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="files-page" @click="closeContextMenu">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </div>
        <h1>CloudFiles</h1>
      </div>
      
      <div class="header-right">
        <span class="user-badge" :class="{ admin: authStore.isAdmin }">
          {{ authStore.user?.username }}
          <span v-if="authStore.isAdmin" class="role-tag">Admin</span>
        </span>
        
        <button 
          v-if="authStore.isAdmin"
          class="btn btn-ghost"
          @click="router.push('/admin')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          Users
        </button>
        
        <button class="btn btn-ghost" @click="authStore.logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Logout
        </button>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="breadcrumbs">
        <button class="breadcrumb-item" @click="filesStore.listFiles('')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
        
        <template v-for="(crumb, index) in breadcrumbs" :key="index">
          <svg class="breadcrumb-sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <button class="breadcrumb-item" @click="filesStore.listFiles(crumb.path)">
            {{ crumb.name }}
          </button>
        </template>
      </div>
      
      <div class="toolbar-actions">
        <button class="btn btn-secondary btn-sm" @click="showCreateFolder = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          New Folder
        </button>
        
        <button class="btn btn-primary btn-sm" @click="fileInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload
        </button>
        <input 
          ref="fileInput" 
          type="file" 
          multiple 
          @change="handleFileSelect"
          style="display: none"
        />
      </div>
    </div>

    <!-- Upload Progress -->
    <UploadProgress />

    <!-- File List -->
    <main 
      class="file-list-container"
      :class="{ dragging: isDragging }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- Back button -->
      <div 
        v-if="filesStore.currentPath"
        class="file-item back-item"
        @click="filesStore.navigateUp"
      >
        <div class="file-icon folder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </div>
        <div class="file-info">
          <span class="file-name">..</span>
          <span class="file-meta">Parent Directory</span>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="filesStore.loading" class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading files...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="filesStore.items.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <h3>No files yet</h3>
        <p>Upload files or create a folder to get started</p>
      </div>

      <!-- File items -->
      <FileItem
        v-else
        v-for="item in filesStore.items"
        :key="item.name"
        :item="item"
        :current-path="filesStore.currentPath"
        @click="handleItemClick(item)"
        @contextmenu="handleContextMenu($event, item)"
      />

      <!-- Drop overlay -->
      <div v-if="isDragging" class="drop-overlay">
        <div class="drop-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>Drop files to upload</p>
        </div>
      </div>
    </main>

    <!-- Context Menu -->
    <ContextMenu 
      v-if="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :item="contextMenu.item"
      :current-path="filesStore.currentPath"
      @close="closeContextMenu"
    />

    <!-- Create Folder Modal -->
    <CreateFolderModal 
      v-if="showCreateFolder"
      @close="showCreateFolder = false"
    />
  </div>
</template>

<style scoped>
.files-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo svg {
  width: 22px;
  height: 22px;
  color: var(--bg-primary);
}

.header-left h1 {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.role-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent-purple);
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.breadcrumb-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.breadcrumb-item:last-child {
  color: var(--accent-cyan);
}

.breadcrumb-sep {
  color: var(--text-muted);
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

/* File List */
.file-list-container {
  flex: 1;
  padding: 20px 24px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  align-content: start;
}

.file-list-container.dragging {
  background: rgba(0, 212, 255, 0.03);
}

.back-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-item:hover {
  border-color: var(--accent-cyan);
  background: var(--bg-tertiary);
}

.back-item .file-icon {
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.back-item .file-icon svg {
  width: 20px;
  height: 20px;
}

.back-item .file-info {
  display: flex;
  flex-direction: column;
}

.back-item .file-name {
  font-weight: 500;
  font-family: var(--font-mono);
}

.back-item .file-meta {
  font-size: 12px;
  color: var(--text-muted);
}

/* States */
.loading-state,
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-hover);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.empty-state .empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-muted);
  font-size: 14px;
}

/* Drop overlay */
.drop-overlay {
  position: absolute;
  inset: 10px;
  background: rgba(0, 212, 255, 0.05);
  border: 2px dashed var(--accent-cyan);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--accent-cyan);
}

.drop-content p {
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

