'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2, Check, X, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

interface UploadedDocument {
  id: string
  filename?: string
  size?: number
  status: 'uploading' | 'processing' | 'success' | 'error'
  progress?: number
  chunks?: number
  embeddings?: number
  error?: string
  uploadedAt?: string
  uploadedBy?: string
  docType?: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch existing documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await api.getDocuments()
      const existingDocs: UploadedDocument[] = response.documents.map((doc: any) => ({
        id: doc.id,
        status: 'success' as const,
        chunks: doc.chunks,
        uploadedAt: doc.uploadedAt,
        uploadedBy: doc.uploadedBy,
        docType: doc.docType
      }))
      setDocuments(existingDocs)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    await uploadFiles(files)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      await uploadFiles(files)
    }
  }

  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const newDoc: UploadedDocument = {
        id: docId,
        filename: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }

      setDocuments(prev => [...prev, newDoc])

      try {
        // Upload and ingest document
        const result = await api.uploadDocument(file, (progress) => {
          setDocuments(prev =>
            prev.map(d =>
              d.id === docId
                ? { ...d, progress, status: progress < 100 ? 'uploading' : 'processing' }
                : d
            )
          )
        })

        // Update with success
        setDocuments(prev =>
          prev.map(d =>
            d.id === docId
              ? {
                  ...d,
                  status: 'success',
                  progress: 100,
                  chunks: result.chunks,
                  embeddings: result.embeddings
                }
              : d
          )
        )

        // Refresh the documents list to get the persisted data
        await fetchDocuments()
      } catch (error) {
        // Update with error
        setDocuments(prev =>
          prev.map(d =>
            d.id === docId
              ? {
                  ...d,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : d
          )
        )
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const getStatusIcon = (status: UploadedDocument['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />
      case 'error':
        return <X className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: UploadedDocument['status']) => {
    const variants: Record<UploadedDocument['status'], 'default' | 'secondary' | 'destructive'> = {
      uploading: 'default',
      processing: 'secondary',
      success: 'default',
      error: 'destructive'
    }

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950/20">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
              Document Upload
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload documents for RAG ingestion and vector search
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/chat')}>
            Back to Chat
          </Button>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
            <CardDescription>
              Supported formats: TXT, MD, PDF, DOCX, CSV, JSON
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                Drag & drop files here
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                or click to browse
              </p>
              <input
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx,.csv,.json"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
              <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
            </CardContent>
          </Card>
        ) : documents.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>
                {documents.filter(d => d.status === 'success').length} document{documents.filter(d => d.status === 'success').length !== 1 ? 's' : ''} ingested
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(doc.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <p className="font-medium truncate">{doc.filename || doc.id}</p>
                          </div>
                          {doc.size && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatFileSize(doc.size)}
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {/* Progress Bar */}
                    {(doc.status === 'uploading' || doc.status === 'processing') && doc.progress !== undefined && (
                      <div className="mb-3">
                        <Progress value={doc.progress} className="h-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {doc.status === 'uploading' ? 'Uploading...' : 'Processing chunks & embeddings...'}
                        </p>
                      </div>
                    )}

                    {/* Success Metadata */}
                    {doc.status === 'success' && (
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {doc.chunks} chunks created
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {doc.embeddings} embeddings generated
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {doc.status === 'error' && (
                      <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{doc.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-gray-600 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No documents uploaded yet</p>
              <p className="text-sm mt-1">Upload your first document to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
