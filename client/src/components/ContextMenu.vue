<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFilesStore } from '../stores/files'

const props = defineProps({
  x: Number,
  y: Number,
  item: Object,
  currentPath: String
})

const emit = defineEmits(['close'])

const filesStore = useFilesStore()
const showRename = ref(false)
const newName = ref('')
const loading = ref(false)

const fullPath = computed(() => {
  return props.currentPath ? `${props.currentPath}/${props.item.name}` : props.item.name
})

// Adjust position if menu would overflow viewport
const adjustedPosition = computed(() => {
  const menuWidth = 180
  const menuHeight = 200
  
  let x = props.x
  let y = props.y
  
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10
  }
  
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10
  }
  
  return { x, y }
})

function handleDownload() {
  if (!props.item.isDirectory) {
    filesStore.downloadFile(fullPath.value, props.item.name)
  }
  emit('close')
}

async function handleDelete() {
  if (confirm(`Are you sure you want to delete "${props.item.name}"?`)) {
    await filesStore.deleteItem(fullPath.value)
  }
  emit('close')
}

function startRename() {
  newName.value = props.item.name
  showRename.value = true
}

async function handleRename() {
  if (!newName.value.trim() || newName.value === props.item.name) {
    showRename.value = false
    return
  }
  
  loading.value = true
  await filesStore.renameItem(fullPath.value, newName.value.trim())
  loading.value = false
  emit('close')
}

function handleOpen() {
  if (props.item.isDirectory) {
    filesStore.navigateTo(props.item.name)
  }
  emit('close')
}

// Close on escape
function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div 
    class="context-menu animate-fade-in"
    :style="{ left: adjustedPosition.x + 'px', top: adjustedPosition.y + 'px' }"
    @click.stop
  >
    <!-- Rename form -->
    <form v-if="showRename" @submit.prevent="handleRename" class="rename-form">
      <input 
        v-model="newName"
        type="text"
        class="input"
        autofocus
        @keydown.esc="showRename = false"
      />
      <div class="rename-actions">
        <button type="button" class="btn btn-ghost btn-sm" @click="showRename = false">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary btn-sm" :disabled="loading">
          Rename
        </button>
      </div>
    </form>
    
    <!-- Menu items -->
    <template v-else>
      <button v-if="item.isDirectory" class="menu-item" @click="handleOpen">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        Open
      </button>
      
      <button v-if="!item.isDirectory" class="menu-item" @click="handleDownload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download
      </button>
      
      <button class="menu-item" @click="startRename">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        Rename
      </button>
      
      <div class="menu-divider"></div>
      
      <button class="menu-item danger" @click="handleDelete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Delete
      </button>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 200;
  min-width: 160px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item svg {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.menu-item.danger {
  color: #ff6666;
}

.menu-item.danger svg {
  color: #ff6666;
}

.menu-item.danger:hover {
  background: rgba(255, 68, 68, 0.1);
}

.menu-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 6px 0;
}

.rename-form {
  padding: 8px;
}

.rename-form .input {
  margin-bottom: 8px;
  font-size: 13px;
  padding: 8px 12px;
}

.rename-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

