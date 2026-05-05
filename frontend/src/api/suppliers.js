import { apiRequest } from './client'

export function listSuppliers({ page = 1, size = 20, search = '', tipo = '' } = {}) {
  const params = new URLSearchParams({ page, size })
  if (search) params.append('search', search)
  if (tipo) params.append('tipo', tipo)
  return apiRequest(`/suppliers/?${params}`)
}

export function getSupplier(id) {
  return apiRequest(`/suppliers/${id}`)
}

export function createSupplier(data) {
  return apiRequest('/suppliers/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateSupplier(id, data) {
  return apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteSupplier(id) {
  return apiRequest(`/suppliers/${id}`, {
    method: 'DELETE',
  })
}
