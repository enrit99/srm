import { apiRequest } from './client'

export function listCommunicationsBySupplier(supplierId) {
  return apiRequest(`/communications/supplier/${supplierId}`)
}

export function createCommunication(data) {
  return apiRequest('/communications/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCommunication(id, data) {
  return apiRequest(`/communications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCommunication(id) {
  return apiRequest(`/communications/${id}`, { method: 'DELETE' })
}
