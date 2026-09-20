export const queryKeys = {
    //Session: (publicID: string) => ["Session", publicID] as const,
    //Snapshot: (publicID: string, identifier?: string | null) => ["Snapshot", publicID, identifier ?? "latest"] as const,
    Menu: ["Menu"] as const,
    User: ["User"] as const,
    RoutePresets: ["RoutePresets"] as const,
    Contracts: ["Contracts"] as const,
    RouteSystems: ["RouteSystems"] as const,
    ContractHandlers: ["ContractHandlers"] as const,
};
