import { apiClient } from "@/Api/Api";
import type { components } from "@/Api/OpenApi";
import { ProjectName } from "@/App";
import type { FreightCorridor } from "@/types";

export async function loadUserData(): Promise<{ user: components["schemas"]["UserData"] }> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/user/`);
  if (error || !data) {
    throw new Error("Failed to load user data");
  }
  return { user: data };
}

export async function loadMenu(): Promise<components["schemas"]["MenuSchema"]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/menu/`);
  if (error || !data) {
    throw new Error("Failed to load menu");
  }
  return data;
}

export async function updateUserSettings(settings: {
  disable_notifications?: boolean;
  quick_select_presets?: number[];
}): Promise<{ success: boolean; message?: string }> {
  const body = new FormData();
  if (settings.disable_notifications !== undefined) {
    if (settings.disable_notifications) {
      body.append("disable_notifications", "on");
    }
  }
  if (settings.quick_select_presets !== undefined) {
    body.append("quick_select_presets", JSON.stringify(settings.quick_select_presets));
  }

  const { data, error } = await apiClient.POST(`/${ProjectName}/api/modify/user/settings/`, {
    body: body as never,
  });

  if (error || !data || (data as { success?: boolean }).success !== true) {
    throw new Error((data as { message?: string } | undefined)?.message ?? "Failed to update user settings");
  }
  return data as { success: boolean; message?: string };
}

export async function loadRoutePresets(): Promise<FreightCorridor[]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/presets/`);
  if (error || !data) {
    throw new Error("Failed to load route presets");
  }
  return data as unknown as FreightCorridor[];
}

export async function createRoutePreset(
  presetData: components["schemas"]["CreateRoutePresetSchema"]
): Promise<FreightCorridor> {
  const { data, error } = await apiClient.POST(`/${ProjectName}/api/contract/presets/`, {
    body: presetData,
  });
  if (error || !data) {
    throw new Error(
      (error as { error?: string } | undefined)?.error ?? "Failed to create route preset"
    );
  }
  return data as unknown as FreightCorridor;
}

export async function updateRoutePreset(
  presetId: number,
  presetData: components["schemas"]["CreateRoutePresetSchema"]
): Promise<FreightCorridor> {
  const { data, error } = await apiClient.PUT(
    `/${ProjectName}/api/contract/preset/{preset_id}/`,
    {
      params: {
        path: { preset_id: presetId },
      },
      body: presetData,
    }
  );
  if (error || !data) {
    throw new Error(
      (error as { error?: string; detail?: string } | undefined)?.error ??
        (error as { error?: string; detail?: string } | undefined)?.detail ??
        "Failed to update route preset"
    );
  }
  return data as unknown as FreightCorridor;
}

export async function deleteRoutePreset(
  presetId: number
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await apiClient.DELETE(
    `/${ProjectName}/api/contract/preset/{preset_id}/`,
    {
      params: {
        path: { preset_id: presetId },
      },
    }
  );
  if (error || !data) {
    throw new Error(
      (error as { detail?: string; error?: string } | undefined)?.detail ??
        (error as { detail?: string; error?: string } | undefined)?.error ??
        "Failed to delete route preset"
    );
  }
  return data as { success: boolean; message?: string };
}

export async function loadContractQueue(): Promise<components["schemas"]["ContractSchema"][]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/queue/`);
  if (error || !data) {
    throw new Error("Failed to load contracts queue");
  }
  return data;
}

export async function loadRouteSystems(): Promise<components["schemas"]["RouteSystemSchema"][]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/systems/`);
  if (error || !data) {
    throw new Error("Failed to load route systems");
  }
  return data;
}

export async function addRouteSystem(
  systemId: number
): Promise<components["schemas"]["RouteSystemSchema"]> {
  const { data, error } = await apiClient.POST(`/${ProjectName}/api/contract/systems/`, {
    body: { system_id: systemId },
  });
  if (error || !data) {
    throw new Error(
      (error as { error?: string } | undefined)?.error ?? "Failed to add route system"
    );
  }
  return data;
}

export async function deleteRouteSystem(
  systemId: number
): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await apiClient.DELETE(
    `/${ProjectName}/api/contract/system/{system_id}/`,
    {
      params: {
        path: { system_id: systemId },
      },
    }
  );
  if (error || !data) {
    throw new Error(
      (error as { detail?: string; error?: string } | undefined)?.detail ??
        (error as { detail?: string; error?: string } | undefined)?.error ??
        "Failed to delete route system"
    );
  }
  return data as { success: boolean; message?: string };
}

export async function searchSolarSystems(
  query: string
): Promise<components["schemas"]["SolarSystemSearchSchema"][]> {
  const { data, error } = await apiClient.GET(
    `/${ProjectName}/api/eve_sde/solar-systems/search/`,
    {
      params: {
        query: { query },
      },
    }
  );
  if (error || !data) {
    throw new Error("Failed to search solar systems");
  }
  return data;
}

export interface ContractHandlerItem {
  id: number;
  name: string;
}

export async function loadContractHandlers(): Promise<ContractHandlerItem[]> {
  const { data, error } = await apiClient.GET(
    `/${ProjectName}/api/contract/handlers/` as never
  );
  if (error || !data) {
    throw new Error("Failed to load contract handlers");
  }
  return data as unknown as ContractHandlerItem[];
}




type AdministrationMessage = { success: boolean; message: string };

function getApiError(error: unknown, fallback: string): string {
  const e = error as { detail?: string; error?: string } | undefined;
  return e?.detail ?? e?.error ?? fallback;
}

export async function loadAdministrationHandlers(): Promise<
  components["schemas"]["AdministrationHandlerSchema"][]
> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/administration/handlers/`);
  if (error || !data) {
    throw new Error(getApiError(error, "Failed to load handlers"));
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
    throw new Error(getApiError(error, "Failed to load handler"));
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
    throw new Error(getApiError(error, "Failed to queue update"));
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
    throw new Error(getApiError(error, "Failed to delete handler"));
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
    throw new Error(getApiError(error, "Failed to queue update"));
  }
  return data as AdministrationMessage;
}
