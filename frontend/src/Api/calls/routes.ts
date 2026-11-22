// Third Party
import { apiErrorMessage } from "aa-geuthur-react";

// AA Fenrir
import { apiClient } from "@/Api/Api";
import type { components } from "@/Api/OpenApi";
import { ProjectName } from "@/constants";
import type { FreightCorridor } from "@/types";

/** Query keys of the routes area: route presets, their cyno coverage, route systems and contract handlers. */
export const routesQueryKeys = {
  presets: ["RoutePresets"] as const,
  presetCoverage: (presetId: number) => ["RoutePresetCoverage", presetId] as const,
  systems: ["RouteSystems"] as const,
  contractHandlers: ["ContractHandlers"] as const,
};

export async function loadRoutePresets(): Promise<FreightCorridor[]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/presets/`);
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load route presets"));
  }
  return data as unknown as FreightCorridor[];
}

export async function loadRoutePresetCoverage(
  presetId: number
): Promise<components["schemas"]["CynoCoverageSystemSchema"][]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/preset/{preset_id}/coverage/`, {
    params: { path: { preset_id: presetId } },
  });
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load route coverage"));
  }
  return data;
}

export async function createRoutePreset(
  presetData: components["schemas"]["CreateRoutePresetSchema"]
): Promise<FreightCorridor> {
  const { data, error } = await apiClient.POST(`/${ProjectName}/api/contract/presets/`, {
    body: presetData,
  });
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to create route preset"));
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
    throw new Error(apiErrorMessage(error, "Failed to update route preset"));
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
    throw new Error(apiErrorMessage(error, "Failed to delete route preset"));
  }
  return data as { success: boolean; message?: string };
}

export async function loadRouteSystems(): Promise<components["schemas"]["RouteSystemSchema"][]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/systems/`);
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load route systems"));
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
    throw new Error(apiErrorMessage(error, "Failed to add route system"));
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
    throw new Error(apiErrorMessage(error, "Failed to delete route system"));
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
    throw new Error(apiErrorMessage(error, "Failed to search solar systems"));
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
    throw new Error(apiErrorMessage(error, "Failed to load contract handlers"));
  }
  return data as unknown as ContractHandlerItem[];
}
