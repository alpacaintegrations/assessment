// Database types - we vullen dit later aan
export interface Client {
  id: string
  slug: string
  company_name: string
  contact_name?: string
  contact_email?: string
  created_at: string
}

export interface Process {
  id: string
  client_id: string
  name: string
  description?: string
  status: 'draft' | 'in_progress' | 'completed' | 'approved'
  created_at: string
}
