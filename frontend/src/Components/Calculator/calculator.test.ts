// Third Party
import { describe, expect, it } from 'vitest';

import {
  calculateDistanceLy,
  calculateTransportQuote,
  doesCorridorMatch,
  estimateStargateJumps,
} from '@/Components/Calculator/calculator';
import type { EveSolarSystem } from '@/types';

describe('Calculator Distance & Stargate Calculations', () => {
  // Real coordinates from EVE SDE (in meters, represented as floats)
  const jita: EveSolarSystem = {
    id: 30000142,
    name: 'Jita',
    security: 0.95,
    securityClass: 'highsec',
    region: 'The Forge',
    x: -1.29064861735e17,
    y: 6.075530691e16,
    z: 1.1746922706e17,
  };

  const dq: EveSolarSystem = {
    id: 30004759,
    name: '1DQ1-A',
    security: -0.1,
    securityClass: 'nullsec',
    region: 'Delve',
    x: -4.479528526262969e17,
    y: 4.156489157570637e16,
    z: -2.4224175447954845e17,
  };

  it('should return 0 distance and 0 jumps for identical systems', () => {
    expect(calculateDistanceLy(jita, jita)).toBe(0);
    expect(estimateStargateJumps(jita, jita)).toBe(0);
  });

  it('should calculate exactly 53.437 Light Years for Jita to 1DQ1-A from EVE SDE coordinates', () => {
    const distanceLy = calculateDistanceLy(jita, dq);
    expect(distanceLy).toBe(53.437);
  });

  it('should calculate realistic stargate jumps for Jita to 1DQ1-A', () => {
    const jumps = estimateStargateJumps(jita, dq);
    // Long cross-galaxy route is ~30 - 50 gates
    expect(jumps).toBeGreaterThan(25);
    expect(jumps).toBeLessThan(55);
  });

  it('should calculate realistic transport quote without astronomical numbers', () => {
    const quote = calculateTransportQuote({
      corridor: null,
      origin: jita,
      destination: dq,
      volumeM3: 350000,
      collateralIsk: 5000000000, // 5B
      isRush: false,
      isCorpSubsidized: false,
      selectedShipId: 'rhea',
    });

    // Total reward should be in realistic millions of ISK, not quintillions
    expect(quote.totalReward).toBeGreaterThan(50000000); // > 50M
    expect(quote.totalReward).toBeLessThan(2000000000); // < 2B
    expect(quote.distanceLy).toBeGreaterThan(25);
    expect(quote.distanceLy).toBeLessThan(75);
    expect(quote.stargateJumps).toBeGreaterThan(25);
    expect(quote.stargateJumps).toBeLessThan(55);
  });
});

describe('Calculator doesCorridorMatch (Bidirectional Preset Matching)', () => {
  const jita: EveSolarSystem = {
    id: 30000142,
    name: 'Jita',
    security: 0.95,
    securityClass: 'highsec',
    region: 'The Forge',
  };

  const dq: EveSolarSystem = {
    id: 30004759,
    name: '1DQ1-A',
    security: -0.1,
    securityClass: 'nullsec',
    region: 'Delve',
  };

  const amarr: EveSolarSystem = {
    id: 30002187,
    name: 'Amarr',
    security: 1.0,
    securityClass: 'highsec',
    region: 'Domain',
  };

  const testCorridor = {
    id: 1,
    name: 'Jita ↔ 1DQ1-A Express',
    origin_system: 'Jita',
    origin_system_id: 30000142,
    destination_system: '1DQ1-A',
    destination_system_id: 30004759,
    origin_station: 'Jita IV - Moon 4',
    destination_station: '1DQ1-A 1-Keepstar',
    service_type: 'jump_freighter' as const,
    base_fee: 10000000,
    fee_per_m3: 650,
    fee_per_ly_or_jump: 2500000,
    collateral_percent: 0.01,
    min_reward: 35000000,
    max_volume: 350000,
    max_collateral: 15000000000,
    estimated_days: 1,
    is_cyno_route: true,
    cyno_waypoints: [],
    description: '',
    danger_level: 'Safe',
  };

  it('should match direct route (Jita -> 1DQ1-A)', () => {
    expect(doesCorridorMatch(testCorridor, jita, dq)).toBe(true);
  });

  it('should match reverse route (1DQ1-A -> Jita) because both directions are equal', () => {
    expect(doesCorridorMatch(testCorridor, dq, jita)).toBe(true);
  });

  it('should match by system names when IDs are missing', () => {
    const corridorWithoutIds = {
      ...testCorridor,
      origin_system_id: undefined,
      destination_system_id: undefined,
    };
    expect(doesCorridorMatch(corridorWithoutIds, jita, dq)).toBe(true);
    expect(doesCorridorMatch(corridorWithoutIds, dq, jita)).toBe(true);
  });

  it('should not match when systems do not belong to the corridor', () => {
    expect(doesCorridorMatch(testCorridor, jita, amarr)).toBe(false);
    expect(doesCorridorMatch(testCorridor, amarr, dq)).toBe(false);
  });

  it('should return false for null corridor or identical systems', () => {
    expect(doesCorridorMatch(null, jita, dq)).toBe(false);
    expect(doesCorridorMatch(testCorridor, jita, jita)).toBe(false);
  });
});

