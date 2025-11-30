<script setup>
import { ref } from 'vue'
import { useFilesStore } from '../stores/files'

const emit = defineEmits(['close'])
const filesStore = useFilesStore()

const folderName = ref('')
const loading = ref(false)
const error = ref('')

async function handleCreate() {
  if (!folderName.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  const result = await filesStore.createFolder(folderName.value.trim())
  
  if (result.success) {
    emit('close')
  } else {
    error.value = result.error
  }
  
  loading.value = false
}

function handleBackdropClick(e) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal animate-slide-up">
      <div class="modal-header">
        <h2>Create New Folder</h2>
        <button class="close-btn" @click="emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <form @submit.prevent="handleCreate" class="modal-body">
        <div class="form-group">
          <label for="folderName">Folder Name</label>
          <input 
            id="folderName"
            v-model="folderName"
            type="text"
            class="input"
            placeholder="Enter folder name"
            autofocus
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="emit('close')">
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="!folderName.trim() || loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Create</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

@media (max-width: 768px) {
  .modal-backdrop {
    padding: 16px;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 20px 16px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.error-message {
  color: #ff6666;
  font-size: 13px;
  background: rgba(255, 68, 68, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

