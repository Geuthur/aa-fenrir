// Third Party
import { apiErrorMessage } from "aa-geuthur-react";

// AA Fenrir
import { apiClient } from "@/Api/Api";
import type { components } from "@/Api/OpenApi";
import { ProjectName } from "@/constants";

/** Query keys of the administration area. */
export const administrationQueryKeys = {
  handlers: ["AdministrationHandlers"] as const,
  handler: (corporationId: number) => ["AdministrationHandler", corporationId] as const,
};

type AdministrationMessage = { success: boolean; message: string };

export async function loadAdministrationHandlers(): Promise<
  components["schemas"]["AdministrationHandlerSchema"][]
> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/administration/handlers/`);
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load handlers"));
  }
  return data;
}

export async function loadAdministrationHandler(
  corporationId: number
): Promise<components["schemas"]["AdministrationHandlerDetailSchema"]> {
  const { data, error } = await apiClient.GET(
    `/${ProjectName}/api/administration/handlers/{corporation_id}/`,
    { params: { path: { corporation_id: corporationId } } }
  );
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load handler"));
  }
  return data;
}

export async function updateAdministrationHandler(
  corporationId: number,
  forceRefresh: boolean
): Promise<AdministrationMessage> {
  const { data, error } = await apiClient.POST(
    `/${ProjectName}/api/administration/handlers/{corporation_id}/update/`,
    {
      params: {
        path: { corporation_id: corporationId },
        query: { force_refresh: forceRefresh },
      },
    }
  );
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to queue update"));
  }
  return data as AdministrationMessage;
}

export async function deleteAdministrationHandler(
  corporationId: number
): Promise<AdministrationMessage> {
  const { data, error } = await apiClient.DELETE(
    `/${ProjectName}/api/administration/handlers/{corporation_id}/`,
    { params: { path: { corporation_id: corporationId } } }
  );
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to delete handler"));
  }
  return data as AdministrationMessage;
}

export async function updateAdministrationAll(
  forceRefresh: boolean
): Promise<AdministrationMessage> {
  const { data, error } = await apiClient.POST(`/${ProjectName}/api/administration/update/`, {
    params: { query: { force_refresh: forceRefresh } },
  });
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to queue update"));
  }
  return data as AdministrationMessage;
}
