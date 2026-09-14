import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Note } from '../lib/types'
import NoteList from '../components/NoteList'
import NoteEditor from '../components/NoteEditor'

type View = 'mine' | 'shared'

export default function Notes() {
  const { email, logout } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('mine')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const result =
        view === 'shared' ? await api.listSharedWithMe() : search.trim() ? await api.searchNotes(search) : await api.listNotes()
      setNotes(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (view === 'mine') refresh()
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleCreate() {
    const note = await api.createNote('Untitled', '')
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  function handleSaved(updated: Note) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  function handleDeleted(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId(null)
  }

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  return (
    <div className="flex h-screen flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3">
        <h1 className="text-lg font-semibold text-stone-900">Notes</h1>
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>{email}</span>
          <button onClick={logout} className="text-stone-500 hover:text-stone-800">
            Log out
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-80 shrink-0 flex-col border-r border-stone-200 bg-white">
          <div className="space-y-3 border-b border-stone-200 p-4">
            <div className="flex gap-2">
              <button
                onClick={() => setView('mine')}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                  view === 'mine' ? 'bg-violet-100 text-violet-700' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                My notes
              </button>
              <button
                onClick={() => setView('shared')}
                className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium ${
                  view === 'shared' ? 'bg-violet-100 text-violet-700' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                Shared with me
              </button>
            </div>

            {view === 'mine' && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes…"
                className="w-full rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-violet-500"
              />
            )}

            {view === 'mine' && (
              <button
                onClick={handleCreate}
                className="w-full rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
              >
                + New note
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-stone-400">Loading…</p>
            ) : (
              <NoteList notes={notes} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {selectedNote ? (
            <NoteEditor note={selectedNote} onSaved={handleSaved} onDeleted={handleDeleted} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">
              Select a note, or create a new one
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
