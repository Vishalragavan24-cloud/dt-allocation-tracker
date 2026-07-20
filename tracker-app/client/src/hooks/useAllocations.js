import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api.js'
import { MONTHS } from '../lib/constants.js'

export function useAllocations(memberId) {
  return useQuery({
    queryKey: ['allocations', memberId],
    queryFn: async () => {
      const params = memberId ? { memberId } : {}
      const { data } = await api.get('/allocations', { params })
      return data
    },
  })
}

export function useAddAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (alloc) => api.post('/allocations', alloc).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allocations'] }),
  })
}

export function useUpdateAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/allocations/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allocations'] }),
  })
}

export function useDeleteAllocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/allocations/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['allocations'] }),
  })
}

export function defaultAllocation(teamMemberId) {
  return {
    team_member_id: teamMemberId,
    project: '',
    project_type: 'New Project',
    sub_project_type: '',
    charge_code: '',
    allocation_hours_per_day: 8,
    start_date: '',
    end_date: '',
    status: 'Active',
    remarks: '',
    backup_resource: '',
    workload_capacity_limit: 8,
    monthly_allocations: MONTHS.map(m => ({ month: m, allocation_percent: 0, hours: 0 })),
  }
}
