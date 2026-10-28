import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi, type LoginRequest, type LoginResponse } from "../api/authApi";
import { getAuthToken } from "../utils";

export function useAuth() {
  const [user, setUser] = useState(authApi.getCurrentUser());

  useEffect(() => {
    setUser(authApi.getCurrentUser());
  }, []);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (res: LoginResponse) => {
      setUser(res.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      setUser(null);
    },
  });

  return {
    user,
    isAuthenticated: Boolean(user || getAuthToken()),
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
}