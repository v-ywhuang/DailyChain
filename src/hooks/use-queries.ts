'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as habitsApi from '@/lib/api/client/habits'
import * as userApi from '@/lib/api/client/user'
import * as statsApi from '@/lib/api/client/stats'
import * as checkInsApi from '@/lib/api/client/check-ins'

// ============================================
// Habits Hooks
// ============================================

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const result = await habitsApi.getUserHabits()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: async () => {
      const result = await habitsApi.getHabitById(id)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!id,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (params: { templateId: string; customizations?: any }) =>
      habitsApi.createHabit(params.templateId, params.customizations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: habitsApi.deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })
}

// ============================================
// User Hooks
// ============================================

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const result = await userApi.getUserProfile()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
  })
}

// ============================================
// Stats Hooks
// ============================================

export function useAllHabitsStats() {
  return useQuery({
    queryKey: ['stats', 'all'],
    queryFn: async () => {
      const result = await statsApi.getAllHabitsStats()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

// ============================================
// Check-ins Hooks
// ============================================

export function useCheckIn() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: checkInsApi.createCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useHabitCheckIns(habitId: string) {
  return useQuery({
    queryKey: ['checkIns', habitId],
    queryFn: async () => {
      const result = await checkInsApi.getHabitCheckIns(habitId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!habitId,
  })
}
