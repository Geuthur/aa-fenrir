// React
import { useState } from "react";

// Third Party
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteAdministrationHandler,
  loadAdministrationHandler,
  loadAdministrationHandlers,
  loadUserData,
  updateAdministrationAll,
  updateAdministrationHandler,
} from "@/Api/ApiCalls";
import { queryKeys } from "@/Api/query";

export interface TaskFeedback {
  variant: "success" | "danger";
  message: string;
}

/** Loads the permissions of the current user (admin access, superuser). */
export function useAdministrationAccess() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.User,
    queryFn: loadUserData,
    refetchOnWindowFocus: false,
  });
  return {
    isLoading,
    hasAdminAccess: data?.user.has_admin_access ?? false,
    isSuperuser: data?.user.is_superuser ?? false,
  };
}

/** Loads all contract handlers of the Administration. */
export function useAdministrationHandlers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.AdministrationHandlers,
    queryFn: loadAdministrationHandlers,
    refetchOnWindowFocus: false,
    enabled,
  });
}

/** Loads one handler with its contract statistics for the inspection view. */
export function useAdministrationHandler(corporationId: number | null) {
  return useQuery({
    queryKey: queryKeys.AdministrationHandler(corporationId ?? 0),
    queryFn: () => loadAdministrationHandler(corporationId as number),
    refetchOnWindowFocus: false,
    enabled: corporationId !== null,
  });
}

/**
 * Handler update, global update and delete for the Administration,
 * including the task feedback message.
 * @param onDeleted Called after a handler was deleted successfully
 */
export function useAdministrationActions(onDeleted?: () => void) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<TaskFeedback | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.AdministrationHandlers });

  const onError = (err: Error) => setTaskFeedback({ variant: "danger", message: err.message });

  const updateMutation = useMutation({
    mutationFn: ({ corporationId, forceRefresh }: { corporationId: number; forceRefresh: boolean }) =>
      updateAdministrationHandler(corporationId, forceRefresh),
    onMutate: ({ corporationId }) => setUpdatingId(corporationId),
    onSuccess: (data) => {
      setTaskFeedback({ variant: "success", message: data.message });
      refresh();
    },
    onError,
    onSettled: () => setUpdatingId(null),
  });

  const updateAllMutation = useMutation({
    mutationFn: (forceRefresh: boolean) => updateAdministrationAll(forceRefresh),
    onSuccess: (data) => {
      setTaskFeedback({ variant: "success", message: data.message });
      refresh();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (corporationId: number) => deleteAdministrationHandler(corporationId),
    onSuccess: (data) => {
      setTaskFeedback({ variant: "success", message: data.message });
      onDeleted?.();
      refresh();
    },
    onError,
  });

  return {
    taskFeedback,
    clearTaskFeedback: () => setTaskFeedback(null),
    updatingId,
    isQueuing: updateAllMutation.isPending,
    isDeleting: deleteMutation.isPending,
    triggerUpdate: updateMutation.mutate,
    queueUpdateAll: updateAllMutation.mutate,
    deleteHandler: deleteMutation.mutate,
  };
}
