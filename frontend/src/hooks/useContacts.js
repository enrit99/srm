import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/contacts'

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createContact,
    onSuccess: (_, variables) => {
      // Invalida il fornitore per ricaricare la lista contatti annidata
      qc.invalidateQueries({ queryKey: ['supplier', String(variables.supplier_id)] })
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier'] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier'] })
    },
  })
}
