export interface User {
  id: number
  email: string
}

export interface Note {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  // Only present on "shared with me" results - absent means it's one of
  // the requester's own notes, always editable.
  permission?: 'read' | 'write'
}

export interface Tag {
  id: number
  name: string
}

export interface Share {
  note_id: number
  shared_with_user_id: number
  permission: 'read' | 'write'
}

export interface Attachment {
  id: number
  filename: string
  content_type: string
  size_bytes: number
}
