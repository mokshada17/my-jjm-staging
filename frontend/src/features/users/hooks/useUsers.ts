import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type User } from "../api/usersApi";

export function useUsers(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["users", page, pageSize],
    queryFn: ({ signal }) => usersApi.list({ page, pageSize }, { signal }),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: ({ signal }) => usersApi.get(id, { signal }),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => usersApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}