// Third Party
import { apiErrorMessage } from "aa-geuthur-react";

// AA Fenrir
import { apiClient } from "@/Api/Api";
import type { components } from "@/Api/OpenApi";
import { ProjectName } from "@/constants";

/** Query keys of the contracts area. */
export const contractsQueryKeys = {
  queue: ["Contracts"] as const,
};

export async function loadContractQueue(): Promise<components["schemas"]["ContractSchema"][]> {
  const { data, error } = await apiClient.GET(`/${ProjectName}/api/contract/queue/`);
  if (error || !data) {
    throw new Error(apiErrorMessage(error, "Failed to load contracts queue"));
  }
  return data;
}
