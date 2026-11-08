// Third Party
import { queryKeys as baseQueryKeys } from "aa-geuthur-react";

export const queryKeys = {
    ...baseQueryKeys,
    RoutePresets: ["RoutePresets"] as const,
    RoutePresetCoverage: (presetId: number) => ["RoutePresetCoverage", presetId] as const,
    Contracts: ["Contracts"] as const,
    RouteSystems: ["RouteSystems"] as const,
    ContractHandlers: ["ContractHandlers"] as const,
    AdministrationHandlers: ["AdministrationHandlers"] as const,
    AdministrationHandler: (corporationId: number) => ["AdministrationHandler", corporationId] as const,
};
