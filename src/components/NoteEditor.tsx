import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Note } from '../lib/types'
import TagBar from './TagBar'
import AttachmentPanel from './AttachmentPanel'
import ShareDialog from './ShareDialog'

interface Props {
  note: Note
  onSaved: (note: Note) => void
  onDeleted: (id: number) => void
}

type Section = 'tags' | 'attachments' | 'share' | null

export default function NoteEditor({ note, onSaved, onDeleted }: Props) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<Section>(null)

  // permission is only present on "shared with me" notes - absent means
  // it's the requester's own note (owner, full access).
  const isOwner = note.permission === undefined
  const canEdit = isOwner || note.permission === 'write'

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setDirty(false)
    setError(null)
  }, [note.id, note.title, note.content])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateNote(note.id, title, content)
      onSaved(updated)
      setDirty(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this note? This cannot be undone.')) return
    try {
      await api.deleteNote(note.id)
      onDeleted(note.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete')
    }
  }

  function toggleSection(section: Section) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
        <input
          value={title}
          readOnly={!canEdit}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
          className="w-full text-xl font-semibold text-stone-900 outline-none placeholder:text-stone-300"
          placeholder="Untitled"
        />
        <div className="flex shrink-0 items-center gap-2">
          {!isOwner && (
            <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-500">
              {canEdit ? 'Can edit' : 'View only'}
            </span>
          )}
          {canEdit && dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {isOwner && (
            <button onClick={handleDelete} className="rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-50">
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

      <textarea
        value={content}
        readOnly={!canEdit}
        onChange={(e) => {
          setContent(e.target.value)
          setDirty(true)
        }}
        placeholder="Start writing…"
        className="flex-1 resize-none p-5 text-sm leading-relaxed text-stone-800 outline-none placeholder:text-stone-300"
      />

      <div className="border-t border-stone-200 p-5">
        <div className="mb-3">
          <TagBar noteId={note.id} canEdit={canEdit} />
        </div>

        <div className="flex gap-4 text-xs font-medium text-stone-500">
          <button
            onClick={() => toggleSection('attachments')}
            className={openSection === 'attachments' ? 'text-violet-600' : 'hover:text-stone-700'}
          >
            Attachments
          </button>
          {isOwner && (
            <button
              onClick={() => toggleSection('share')}
              className={openSection === 'share' ? 'text-violet-600' : 'hover:text-stone-700'}
            >
              Share
            </button>
          )}
        </div>

        {openSection === 'attachments' && (
          <div className="mt-3">
            <AttachmentPanel noteId={note.id} canEdit={canEdit} />
          </div>
        )}
        {openSection === 'share' && isOwner && (
          <div className="mt-3">
            <ShareDialog noteId={note.id} />
          </div>
        )}
      </div>
    </div>
  )
}
