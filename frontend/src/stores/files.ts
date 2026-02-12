import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import axios from 'axios'

interface File {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  download_count: number
  is_public: number
  expires_at?: string
  created_at: string
  updated_at: string
}

interface FilesResponse {
  files: File[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface UploadResponse {
  message: string
  file: File
}

export const useFileStore = defineStore('files', () => {
  const files = ref<File[]>([])
  const currentFile = ref<File | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref(0)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  const authStore = useAuthStore()
  const api = authStore.api

  async function fetchFiles(params: { page?: number; limit?: number; sort?: string; order?: string; search?: string } = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<FilesResponse>('/files', { params })
      files.value = response.data.files
      pagination.value = response.data.pagination
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch files'
    } finally {
      loading.value = false
    }
  }

  async function fetchFile(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<{ file: File }>(`/files/${id}`)
      currentFile.value = response.data.file
      return response.data.file
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch file'
      return null
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(file: File, onProgress?: (progress: number) => void) {
    loading.value = true
    error.value = null
    uploadProgress.value = 0
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post<UploadResponse>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress?.(uploadProgress.value)
          }
        }
      })
      
      files.value.unshift(response.data.file)
      return response.data.file
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Upload failed'
      throw err
    } finally {
      loading.value = false
      uploadProgress.value = 0
    }
  }

  async function deleteFile(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/files/${id}`)
      files.value = files.value.filter(f => f.id !== id)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Delete failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function getDirectLink(id: string) {
    try {
      const response = await api.get<{ direct_link: string; expires_at: string }>(`/files/${id}/direct-link`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to get direct link'
      return null
    }
  }

  async function updateVisibility(id: string, isPublic: boolean, expiresAt?: string) {
    try {
      await api.put(`/files/${id}/public`, { is_public: isPublic, expires_at: expiresAt })
      const file = files.value.find(f => f.id === id)
      if (file) {
        file.is_public = isPublic ? 1 : 0
        file.expires_at = expiresAt
      }
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Update failed'
      return false
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive'
    if (mimeType.startsWith('text/')) return 'text'
    return 'file'
  }

  return {
    files,
    currentFile,
    loading,
    error,
    uploadProgress,
    pagination,
    fetchFiles,
    fetchFile,
    uploadFile,
    deleteFile,
    getDirectLink,
    updateVisibility,
    formatFileSize,
    getFileIcon
  }
})
