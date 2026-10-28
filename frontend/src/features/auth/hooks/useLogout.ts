import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/app/store";
import { authApi } from "../api/authApi";

/**
 * Ends the session: clears the stored user and token, drops every cached query
 * and the breadcrumb path so nothing from this session shows to whoever signs in
 * next, then returns to the login page.
 */
export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await authApi.logout();
    queryClient.clear();
    useAppStore.setState({ nodePath: [] });
    navigate("/login", { replace: true });
  }, [navigate, queryClient]);
}
