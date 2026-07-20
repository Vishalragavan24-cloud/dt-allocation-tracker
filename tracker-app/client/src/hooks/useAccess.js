import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'

export function useAccess() {
  return useQuery({
    queryKey: ['access'],
    queryFn: async () => {
      const { data } = await api.get('/access')
      return data
    },
  })
}

export function useUpdateAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, ...data }) =>
      api.put(`/access/${memberId}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access'] }),
  })
}
