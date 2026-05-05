import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/suppliers'

// La "query key" è l'identificativo univoco di una query in cache.
// Cambiando i parametri (es. page, search) cambia anche la key e React
// Query rifà fetch automaticamente.
export function useSuppliers(filters = {}) {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => api.listSuppliers(filters),
    keepPreviousData: true,  // mantiene i vecchi dati durante la transizione di pagina
  })
}

export function useSupplier(id) {
  return useQuery({
    queryKey: ['supplier', String(id)],
    queryFn: () => api.getSupplier(id),
    enabled: !!id,  // non fare fetch se id è null/undefined
  })
}

// useMutation: per operazioni di scrittura (POST/PUT/DELETE)
export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createSupplier,
    onSuccess: () => {
      // Dopo il create, invalida la cache della lista → refetch automatico
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateSupplier(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier', String(id)] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteSupplier,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
