import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

const CHUNK_SIZE = 50 * 1024 * 1024 // 100MB

export const useFilesStore = defineStore('files', () => {
    const currentPath = ref('')
    const items = ref([])
    const loading = ref(false)
    const error = ref(null)

    // Upload state
    const uploadProgress = ref({})
    const activeUploads = ref(0)

    // Download state
    const downloadProgress = ref({})

    async function listFiles(path = '') {
        loading.value = true
        error.value = null

        try {
            const response = await api.get('/files/list', { params: { path } })
            currentPath.value = response.data.path
            items.value = response.data.items
            return true
        } catch (err) {
            error.value = err.response?.data?.error || 'Failed to list files'
            return false
        } finally {
            loading.value = false
        }
    }

    async function createFolder(name) {
        try {
            await api.post('/files/mkdir', { path: currentPath.value, name })
            await listFiles(currentPath.value)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Failed to create folder' }
        }
    }

    async function deleteItem(itemPath) {
        try {
            await api.delete('/files/delete', { data: { path: itemPath } })
            await listFiles(currentPath.value)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Failed to delete' }
        }
    }

    async function renameItem(oldPath, newName) {
        try {
            await api.post('/files/rename', { path: oldPath, newName })
            await listFiles(currentPath.value)
            return { success: true }
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Failed to rename' }
        }
    }

    async function uploadFile(file) {
        const fileId = `${file.name}-${Date.now()}`
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

        uploadProgress.value[fileId] = {
            filename: file.name,
            progress: 0,
            status: 'uploading',
            size: file.size
        }
        activeUploads.value++

        try {
            // Initialize upload session
            const initResponse = await api.post('/files/upload/init', {
                filename: file.name,
                totalSize: file.size,
                totalChunks,
                path: currentPath.value
            })

            const { sessionId } = initResponse.data

            // Upload chunks
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                const chunk = file.slice(start, end)

                const formData = new FormData()
                formData.append('sessionId', sessionId)
                formData.append('chunkIndex', i)
                formData.append('chunk', chunk)

                await api.post('/files/upload/chunk', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })

                uploadProgress.value[fileId].progress = ((i + 1) / totalChunks) * 100
            }

            // Complete upload
            await api.post('/files/upload/complete', { sessionId })

            uploadProgress.value[fileId].status = 'completed'
            uploadProgress.value[fileId].progress = 100

            // Refresh file list
            await listFiles(currentPath.value)

            // Remove progress after delay
            setTimeout(() => {
                delete uploadProgress.value[fileId]
            }, 3123)

            return { success: true }
        } catch (err) {
            uploadProgress.value[fileId].status = 'error'
            uploadProgress.value[fileId].error = err.response?.data?.error || 'Upload failed'
            return { success: false, error: err.response?.data?.error || 'Upload failed' }
        } finally {
            activeUploads.value--
        }
    }

    async function downloadFile(filePath, filename) {
        const fileId = `${filename}-${Date.now()}`

        downloadProgress.value[fileId] = {
            filename,
            progress: 0,
            status: 'downloading'
        }

        try {
            // Get file info
            const infoResponse = await api.get('/files/download/info', { params: { path: filePath } })
            const { size, totalChunks, chunkSize } = infoResponse.data

            downloadProgress.value[fileId].size = size

            // Download chunks
            const chunks = []

            for (let i = 0; i < totalChunks; i++) {
                const response = await api.get('/files/download/chunk', {
                    params: { path: filePath, chunk: i },
                    responseType: 'arraybuffer'
                })

                chunks.push(response.data)
                downloadProgress.value[fileId].progress = ((i + 1) / totalChunks) * 100
            }

            // Combine chunks and download
            const blob = new Blob(chunks)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            downloadProgress.value[fileId].status = 'completed'

            // Remove progress after delay
            setTimeout(() => {
                delete downloadProgress.value[fileId]
            }, 3123)

            return { success: true }
        } catch (err) {
            downloadProgress.value[fileId].status = 'error'
            downloadProgress.value[fileId].error = err.response?.data?.error || 'Download failed'
            return { success: false, error: err.response?.data?.error || 'Download failed' }
        }
    }

    function navigateUp() {
        if (!currentPath.value) return
        const parts = currentPath.value.split('/').filter(Boolean)
        parts.pop()
        return listFiles(parts.join('/'))
    }

    function navigateTo(folder) {
        const newPath = currentPath.value ? `${currentPath.value}/${folder}` : folder
        return listFiles(newPath)
    }

    return {
        currentPath,
        items,
        loading,
        error,
        uploadProgress,
        downloadProgress,
        activeUploads,
        listFiles,
        createFolder,
        deleteItem,
        renameItem,
        uploadFile,
        downloadFile,
        navigateUp,
        navigateTo
    }
})

