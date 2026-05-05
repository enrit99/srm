import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/communications'

export function useCommunications(supplierId) {
  return useQuery({
    queryKey: ['communications', String(supplierId)],
    queryFn: () => api.listCommunicationsBySupplier(supplierId),
    enabled: !!supplierId,
  })
}

export function useCreateCommunication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCommunication,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['communications', String(variables.supplier_id)] })
    },
  })
}

export function useUpdateCommunication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCommunication(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communications'] })
    },
  })
}

export function useDeleteCommunication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteCommunication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communications'] })
    },
  })
}
