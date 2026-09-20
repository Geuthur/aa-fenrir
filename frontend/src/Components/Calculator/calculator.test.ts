// Third Party
import { describe, expect, it } from 'vitest';

import {
  calculateDistanceLy,
  calculateTransportQuote,
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

