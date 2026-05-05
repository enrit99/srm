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
