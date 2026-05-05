import { apiRequest } from './client'

export function createContact(data) {
  return apiRequest('/contacts/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function deleteContact(id) {
  return apiRequest(`/contacts/${id}`, { method: 'DELETE' })
}
