import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/communications'

export function useCommunications(supplierId) {
  return useQuery({
    queryKey: ['communications', supplierId],
    queryFn: () => api.listCommunicationsBySupplier(supplierId),
    enabled: !!supplierId,
  })
}

export function useCreateCommunication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCommunication,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['communications', variables.supplier_id] })
    },
  })
}
