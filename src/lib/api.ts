import type { Attachment, Note, Share, Tag, User } from './types'

const BASE_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let token: string | null = localStorage.getItem('token')

export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem('token', t)
  else localStorage.removeItem('token')
}

export function getToken() {
  return token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!(options.body instanceof FormData) && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  signup: (email: string, password: string) =>
    request<User>('/api/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),

  login: (email: string, password: string) =>
    request<{ token: string }>('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  listNotes: () => request<Note[]>('/api/notes'),

  listSharedWithMe: () => request<Note[]>('/api/notes/shared-with-me'),

  searchNotes: (q: string) => request<Note[]>(`/api/notes/search?q=${encodeURIComponent(q)}`),

  getNote: (id: number) => request<Note>(`/api/notes/${id}`),

  createNote: (title: string, content: string) =>
    request<Note>('/api/notes', { method: 'POST', body: JSON.stringify({ title, content }) }),

  updateNote: (id: number, title: string, content: string) =>
    request<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify({ title, content }) }),

  deleteNote: (id: number) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),

  listTagsForNote: (noteId: number) => request<Tag[]>(`/api/notes/${noteId}/tags`),

  listAllTags: () => request<Tag[]>('/api/tags'),

  addTag: (noteId: number, name: string) =>
    request<Tag>(`/api/notes/${noteId}/tags`, { method: 'POST', body: JSON.stringify({ name }) }),

  removeTag: (noteId: number, tagId: number) =>
    request<void>(`/api/notes/${noteId}/tags/${tagId}`, { method: 'DELETE' }),

  listShares: (noteId: number) => request<Share[]>(`/api/notes/${noteId}/shares`),

  shareNote: (noteId: number, email: string, permission: 'read' | 'write') =>
    request<Share>(`/api/notes/${noteId}/shares`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    }),

  revokeShare: (noteId: number, userId: number) =>
    request<void>(`/api/notes/${noteId}/shares/${userId}`, { method: 'DELETE' }),

  listAttachments: (noteId: number) => request<Attachment[]>(`/api/notes/${noteId}/attachments`),

  uploadAttachment: (noteId: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<Attachment>(`/api/notes/${noteId}/attachments`, { method: 'POST', body: form })
  },

  deleteAttachment: (id: number) => request<void>(`/api/attachments/${id}`, { method: 'DELETE' }),

  async downloadAttachment(id: number, filename: string) {
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(`${BASE_URL}/api/attachments/${id}`, { headers })
    if (!res.ok) throw new ApiError(res.status, res.statusText)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
