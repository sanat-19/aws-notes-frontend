import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Tag } from '../lib/types'

export default function TagBar({ noteId, canEdit }: { noteId: number; canEdit: boolean }) {
  const [tags, setTags] = useState<Tag[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    api.listTagsForNote(noteId).then(setTags).catch(() => setTags([]))
  }, [noteId])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    const tag = await api.addTag(noteId, name)
    setTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]))
    setInput('')
  }

  async function handleRemove(tagId: number) {
    await api.removeTag(noteId, tagId)
    setTags((prev) => prev.filter((t) => t.id !== tagId))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
        >
          {tag.name}
          {canEdit && (
            <button
              onClick={() => handleRemove(tag.id)}
              className="text-violet-400 hover:text-violet-700"
              aria-label={`Remove tag ${tag.name}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {canEdit && (
        <form onSubmit={handleAdd} className="inline-flex items-center gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="add tag…"
            className="w-24 rounded-full border border-stone-300 px-2.5 py-1 text-xs outline-none focus:border-violet-500"
          />
          {input.trim() && (
            <button
              type="submit"
              className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-200"
            >
              Add
            </button>
          )}
        </form>
      )}
    </div>
  )
}
