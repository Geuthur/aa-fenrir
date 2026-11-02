// React
import { useMemo } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';

import { loadContractHandlers, loadRouteSystems } from '@/Api/ApiCalls';
import { queryKeys } from '@/Api/query';
import type { EveSolarSystem, SecurityClass } from '@/types';

/** Loads the selectable systems and contract handlers for the route preset forms. */
export function useRouteFormOptions() {
  // Configured RouteSystems from the backend
  const { data: routeSystems = [] } = useQuery({
    queryKey: queryKeys.RouteSystems,
    queryFn: loadRouteSystems,
    refetchOnWindowFocus: false,
  });

  // Available ContractHandlers from the backend
  const { data: contractHandlers = [] } = useQuery({
    queryKey: queryKeys.ContractHandlers,
    queryFn: loadContractHandlers,
    refetchOnWindowFocus: false,
  });

  const availableSystems: EveSolarSystem[] = useMemo(() => {
    return routeSystems.map((rs) => ({
      id: rs.system_id,
      name: rs.name,
      security: rs.security_status,
      securityClass:
        (rs.security_class as SecurityClass) ||
        (rs.security_status >= 0.45 ? 'highsec' : rs.security_status > 0 ? 'lowsec' : 'nullsec'),
      region: rs.region_name || 'Unknown',
      defaultStation: `${rs.name} - Upwell Citadel`,
      x: rs.x,
      y: rs.y,
      z: rs.z,
    }));
  }, [routeSystems]);

  return { availableSystems, contractHandlers };
}
