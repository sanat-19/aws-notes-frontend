import type { Note } from '../lib/types'

interface Props {
  notes: Note[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export default function NoteList({ notes, selectedId, onSelect }: Props) {
  if (notes.length === 0) {
    return <p className="p-4 text-sm text-stone-400">No notes yet</p>
  }

  return (
    <ul className="divide-y divide-stone-100">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            onClick={() => onSelect(note.id)}
            className={`block w-full px-4 py-3 text-left transition ${
              selectedId === note.id ? 'bg-violet-50' : 'hover:bg-stone-50'
            }`}
          >
            <p className="truncate text-sm font-medium text-stone-900">{note.title || 'Untitled'}</p>
            <p className="mt-0.5 truncate text-xs text-stone-500">{note.content || 'No content'}</p>
          </button>
        </li>
      ))}
    </ul>
  )
}
