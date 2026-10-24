// hooks/useSpots.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { spotsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export const useSpots = () => {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['spots', token],
    queryFn: spotsApi.getSpots,
    enabled: !!token,
  });
};

export const useCreateSpot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: spotsApi.createSpot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spots'] }),
  });
};

export const useDeleteSpot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: spotsApi.deleteSpot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['spots'] }),
  });
};
