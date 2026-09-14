import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../lib/api'
import type { Share } from '../lib/types'

export default function ShareDialog({ noteId }: { noteId: number }) {
  const [shares, setShares] = useState<Share[]>([])
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'read' | 'write'>('read')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listShares(noteId).then(setShares).catch(() => setShares([]))
  }, [noteId])

  async function handleShare(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const share = await api.shareNote(noteId, email, permission)
      setShares((prev) => [...prev.filter((s) => s.shared_with_user_id !== share.shared_with_user_id), share])
      setEmail('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not share note')
    }
  }

  async function handleRevoke(userId: number) {
    await api.revokeShare(noteId, userId)
    setShares((prev) => prev.filter((s) => s.shared_with_user_id !== userId))
  }

  return (
    <div className="space-y-3">
      {shares.map((s) => (
        <div
          key={s.shared_with_user_id}
          className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          <span className="text-stone-700">User #{s.shared_with_user_id}</span>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{s.permission}</span>
            <button
              onClick={() => handleRevoke(s.shared_with_user_id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Revoke
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={handleShare} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          className="min-w-0 flex-1 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm outline-none focus:border-violet-500"
        />
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-violet-500"
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
        >
          Share
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
