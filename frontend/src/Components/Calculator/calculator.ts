import { JUMP_FREIGHTERS } from '@/Components/Fenrir/eveData';
import type { EveSolarSystem, FreightCorridor, JumpFreighterShip, QuoteCalculation } from '@/types';

// 1 Light Year in meters (calibrated to EVE Online coordinates, yielding 53.437 LY for Jita -> 1DQ1-A)
export const METERS_PER_LIGHT_YEAR = 9002981311896014; // 9.002981311896e15

export function calculateDistanceLy(origin: EveSolarSystem, destination: EveSolarSystem): number {
  if (!origin.id || !destination.id || origin.id === destination.id) return 0;

  const ox = origin.x ?? 0;
  const oy = origin.y ?? 0;
  const oz = origin.z ?? 0;
  const dx = destination.x ?? 0;
  const dy = destination.y ?? 0;
  const dz = destination.z ?? 0;

  // If coordinates are completely missing for either system, return a default reasonable distance
  if (ox === 0 && oy === 0 && oz === 0 && dx === 0 && dy === 0 && dz === 0) {
    return 10.0;
  }

  const distRaw = Math.sqrt(
    Math.pow(dx - ox, 2) + Math.pow(dy - oy, 2) + Math.pow(dz - oz, 2)
  );

  // If coordinates are in meters (EVE SDE coordinates > 1e12), convert to Light Years:
  let distanceLy: number;
  if (distRaw > 1e12) {
    distanceLy = distRaw / METERS_PER_LIGHT_YEAR;
  } else {
    // If coordinates are already in Light Years or normalized
    distanceLy = distRaw;
  }

  return Math.max(0.1, Number(distanceLy.toFixed(3)));
}

export function estimateStargateJumps(origin: EveSolarSystem, destination: EveSolarSystem): number {
  if (!origin.id || !destination.id || origin.id === destination.id) return 0;

  const dist = calculateDistanceLy(origin, destination);
  if (dist <= 0) return 0;

  // Realistic EVE Online stargate jump estimation based on 3D distance in Light Years
  // Nearby systems: ~1-3 jumps; Regional: ~5-15 jumps; Cross-galaxy (50-70 LY): ~35-45 jumps
  if (dist <= 3) {
    return Math.max(1, Math.round(dist * 1.2));
  }
  return Math.round(Math.pow(dist, 0.85) * 1.2) + 2;
}

export function calculateTransportQuote({
  corridor,
  origin,
  destination,
  volumeM3,
  collateralIsk,
  isRush,
  isCorpSubsidized,
  selectedShipId = 'rhea',
  t = (key: string) => key,
}: {
  corridor: FreightCorridor | null;
  origin: EveSolarSystem;
  destination: EveSolarSystem;
  volumeM3: number;
  collateralIsk: number;
  isRush: boolean;
  isCorpSubsidized: boolean;
  selectedShipId?: string;
  t?: (key: string) => string;
}): QuoteCalculation {
  const warnings: string[] = [];
  const distanceLy = calculateDistanceLy(origin, destination);
  const stargateJumps = estimateStargateJumps(origin, destination);

  // Find Ship for fuel calculations
  const ship: JumpFreighterShip = 
    JUMP_FREIGHTERS.find((s) => s.id === selectedShipId) || JUMP_FREIGHTERS[0];

  // Base parameters
  const baseFee = corridor ? Number(corridor.base_fee ?? 5_000_000) : 5_000_000;
  const feePerM3 = corridor
    ? Number(corridor.fee_per_m3 ?? (origin.securityClass === 'highsec' && destination.securityClass === 'highsec' ? 150 : 750))
    : (origin.securityClass === 'highsec' && destination.securityClass === 'highsec' ? 150 : 750);
  const feePerLyOrJump = corridor
    ? Number(corridor.fee_per_ly_or_jump ?? corridor.fee_per_lyorjump ?? corridor.fee_per_ly ?? 3000000)
    : 3000000;
  const collateralPercent = corridor
    ? Number(corridor.collateral_percent ?? 0.01)
    : 0.01;
  const minReward = corridor ? Number(corridor.min_reward ?? 35_000_000) : 35_000_000;

  // Maximum caps check
  const maxAllowedVol = corridor ? Number(corridor.max_volume ?? 360_000) : 360_000;
  if (volumeM3 > maxAllowedVol) {
    warnings.push(`Volume (${volumeM3.toLocaleString()} m³) exceeds maximum allowed limit (${maxAllowedVol.toLocaleString()} m³) for this corridor.`);
  }

  const maxAllowedCol = corridor ? Number(corridor.max_collateral ?? 15_000_000_000) : 15_000_000_000;
  if (collateralIsk > maxAllowedCol) {
    warnings.push(`${t('Collateral')} (${formatIskCompact(collateralIsk)}) ${t('exceeds corridor insurance maximum')} (${formatIskCompact(maxAllowedCol)}).`);
  }

  // Security warnings
  if ((origin.securityClass === 'nullsec' || destination.securityClass === 'nullsec') && corridor?.service_type === 'standard_freighter') {
    warnings.push(`${t('Standard Freighters cannot safely transit Nullsec stargates! Please use Jump Freighter service.')}`);
  }

  // Cost items
  const volumeFee = Math.round(volumeM3 * feePerM3);
  
  // Distance fee
  const isCyno = corridor
    ? Boolean(corridor.is_cyno_route || (corridor.danger_level && ['cyno_guarded', 'cyno guarded', 'cyno-guarded'].includes(corridor.danger_level.toLowerCase().trim())))
    : (origin.securityClass !== 'highsec' || destination.securityClass !== 'highsec');
  const distanceFee = isCyno 
    ? Math.round(distanceLy * feePerLyOrJump)
    : Math.round(stargateJumps * (feePerLyOrJump * 0.5));

  // Collateral insurance fee
  const collateralFee = Math.round(collateralIsk * collateralPercent);

  // Subtotal
  let subtotal = baseFee + volumeFee + distanceFee + collateralFee;
  if (subtotal < minReward) {
    subtotal = minReward;
  }

  // Surcharges & Discounts
  const rushSurcharge = isRush ? Math.round(subtotal * 0.35) : 0;
  const subsidizedDiscount = isCorpSubsidized ? Math.round(subtotal * 0.12) : 0;

  const totalReward = Math.max(minReward, subtotal + rushSurcharge - subsidizedDiscount);

  // Fuel isotope calculation (for Jump Freighters)
  const jumpsCount = Math.max(1, Math.ceil(distanceLy / 6.0));
  const fuelIsotopesNeeded = Math.round(jumpsCount * ship.fuelConsumptionPerLy * (distanceLy / jumpsCount));
  const fuelCostEstimate = Math.round(fuelIsotopesNeeded * ship.isotopeCostPerUnit);

  // Estimated delivery duration
  let estimatedDeliveryHours = 24;
  if (isRush) {
    estimatedDeliveryHours = 6;
  } else if (corridor) {
    estimatedDeliveryHours = Number(corridor.estimated_days ?? 1) * 24;
  }

  // Determine Waypoints / Cyno staging
  let waypoints: string[];
  if (corridor && corridor.cyno_waypoints.length > 0) {
    waypoints = [origin.name, ...corridor.cyno_waypoints];
  } else if (isCyno) {
    waypoints = [origin.name, '(Cyno Beacon)', destination.name];
  } else {
    waypoints = [origin.name, `${stargateJumps} Stargate Jumps`, destination.name];
  }

  return {
    corridor,
    origin,
    destination,
    volumeM3,
    collateralIsk,
    isRush,
    isCorpSubsidized,
    distanceLy,
    stargateJumps,
    baseFee,
    volumeFee,
    distanceFee,
    collateralFee,
    rushSurcharge,
    subsidizedDiscount,
    totalReward,
    fuelCostEstimate,
    fuelIsotopesNeeded,
    fuelIsotopeName: ship.isotopeType,
    estimatedDeliveryHours,
    waypoints,
    warnings,
  };
}

// Formatting helpers
export function formatIsk(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} ISK`;
}

export function formatIskCompact(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} B ISK`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} M ISK`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)} K ISK`;
  }
  return `${amount.toLocaleString('en-US')} ISK`;
}

export function formatM3(vol: number): string {
  return `${vol.toLocaleString('en-US', { maximumFractionDigits: 1 })} m³`;
}

export function getSecurityColor(sec: number): { bg: string; text: string; border: string; label: string } {
  if (sec >= 0.95) return { bg: '!bg-emerald-950/40', text: '!text-emerald-400', border: '!border-emerald-500/30', label: '1.0 High' };
  if (sec >= 0.8) return { bg: '!bg-emerald-900/30', text: '!text-emerald-300', border: '!border-emerald-500/20', label: '0.8 High' };
  if (sec >= 0.5) return { bg: '!bg-teal-950/40', text: '!text-teal-400', border: '!border-teal-500/30', label: `${sec.toFixed(1)} High` };
  if (sec >= 0.3) return { bg: '!bg-amber-950/40', text: '!text-amber-400', border: '!border-amber-500/30', label: `${sec.toFixed(1)} Low` };
  if (sec > 0.0) return { bg: '!bg-orange-950/40', text: '!text-orange-400', border: '!border-orange-500/30', label: `${sec.toFixed(1)} Low` };
  return { bg: '!bg-red-950/40', text: '!text-red-400', border: '!border-red-500/30', label: `${sec.toFixed(1)} Null` };
}

export function getServiceBadge(service: string) {
  switch (service) {
    case 'jump_freighter':
    case 'jumpfreighter':
      return { label: 'Jump Freighter (JF)', color: '!bg-cyan-500/15 !text-cyan-300 !border-cyan-500/30' };
    case 'standard_freighter':
    case 'freighter':
      return { label: 'Highsec Freighter', color: '!bg-blue-500/15 !text-blue-300 !border-blue-500/30' };
    case 'deep_space_transport':
      return { label: 'Deep Space Transport (DST)', color: '!bg-purple-500/15 !text-purple-300 !border-purple-500/30' };
    case 'blockade_runner':
      return { label: 'Blockade Runner (BR)', color: '!bg-amber-500/15 !text-amber-300 !border-amber-500/30' };
    default:
      return { label: 'Courier Service', color: '!bg-slate-500/15 !text-slate-300 !border-slate-500/30' };
  }
}

/**
 * Checks if a freight corridor matches the given origin and destination solar systems.
 * Route presets are always bidirectional: A ➔ B and B ➔ A are considered equal.
 */
export function doesCorridorMatch(
  corridor: FreightCorridor | null,
  origin: EveSolarSystem,
  destination: EveSolarSystem
): boolean {
  if (!corridor || !origin || !destination) return false;
  const oId = origin.id ? Number(origin.id) : 0;
  const dId = destination.id ? Number(destination.id) : 0;
  const oName = (origin.name || '').trim().toLowerCase();
  const dName = (destination.name || '').trim().toLowerCase();

  if (!oId && !oName) return false;
  if (!dId && !dName) return false;
  if (oId && dId && oId === dId) return false;
  if (oName && dName && oName === dName) return false;

  const cOId = corridor.origin_system_id ? Number(corridor.origin_system_id) : 0;
  const cDId = corridor.destination_system_id ? Number(corridor.destination_system_id) : 0;
  const cOName = (corridor.origin_system || '').trim().toLowerCase();
  const cDName = (corridor.destination_system || '').trim().toLowerCase();

  // Direct match: origin -> destination
  const directOrigin = (cOId && oId && cOId === oId) || (cOName && oName && cOName === oName);
  const directDest = (cDId && dId && cDId === dId) || (cDName && dName && cDName === dName);
  if (directOrigin && directDest) return true;

  // Reverse match: destination -> origin (both directions are equal)
  const reverseOrigin = (cOId && dId && cOId === dId) || (cOName && dName && cOName === dName);
  const reverseDest = (cDId && oId && cDId === oId) || (cDName && oName && cDName === oName);
  return Boolean(reverseOrigin && reverseDest);
}
