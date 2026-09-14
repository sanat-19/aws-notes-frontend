import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Attachment } from '../lib/types'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentPanel({ noteId, canEdit }: { noteId: number; canEdit: boolean }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.listAttachments(noteId).then(setAttachments).catch(() => setAttachments([]))
  }, [noteId])

  async function handleFileChange() {
    const file = fileInput.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const attachment = await api.uploadAttachment(noteId, file)
      setAttachments((prev) => [...prev, attachment])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    await api.deleteAttachment(id)
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-2">
      {attachments.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          <button
            onClick={() => api.downloadAttachment(a.id, a.filename)}
            className="truncate text-left text-stone-700 hover:text-violet-600 hover:underline"
            title={a.filename}
          >
            {a.filename}
          </button>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs text-stone-400">{formatSize(a.size_bytes)}</span>
            {canEdit && (
              <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:text-red-700">
                Delete
              </button>
            )}
          </div>
        </div>
      ))}

      {canEdit && (
        <>
          <input ref={fileInput} type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-lg border border-dashed border-stone-300 px-3 py-2 text-xs text-stone-500 hover:border-violet-400 hover:text-violet-600"
          >
            {uploading ? 'Uploading…' : '+ Add attachment'}
          </label>
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
