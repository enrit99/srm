import { apiRequest } from './client'

export function createContact(data) {
  return apiRequest('/contacts/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateContact(id, data) {
  return apiRequest(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteContact(id) {
  return apiRequest(`/contacts/${id}`, { method: 'DELETE' })
}
