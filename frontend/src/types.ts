import type { components } from '@/Api/OpenApi';

export type SecurityClass = 'highsec' | 'lowsec' | 'nullsec' | 'wh' | 'pochven';

export type ServiceType = 
  | 'jump_freighter' 
  | 'standard_freighter' 
  | 'deep_space_transport' 
  | 'blockade_runner';

export interface EveSolarSystem {
  id: number;
  name: string;
  security: number; // e.g. 1.0, 0.4, -0.2
  securityClass: SecurityClass;
  region: string;
  isTradeHub?: boolean;
  hasKeepstar?: boolean;
  hasCynoBeacon?: boolean;
  defaultStation?: string;
  x?: number; // Coordinates for 2D/3D jump math
  y?: number;
  z?: number;
}

export interface FreightCorridor {
  id: string | number;
  name: string;
  origin_system: string;
  origin_system_id?: number;
  destination_system: string;
  destination_system_id?: number;
  origin_station: string;
  destination_station: string;
  service_type: ServiceType;
  max_volume: number; // m3
  max_collateral: number; // ISK
  base_fee: number; // ISK
  fee_per_m3: number; // ISK per m3
  fee_per_ly?: number; // ISK per LY
  fee_per_ly_or_jump: number; // ISK per LY or per Stargate jump
  fee_per_lyorjump?: number;
  collateral_percent: number; // e.g. 1.0%
  min_reward: number; // Minimum ISK
  estimated_time?: number; // minutes
  estimated_days: number;
  is_cyno_route: boolean;
  cyno_waypoints: string[];
  cyno_waypoint_ids?: number[];
  description: string;
  danger_level: 'Safe' | 'Low' | 'Moderate' | 'Dangerous' | 'Cyno-Guarded' | 'Cyno Guarded' | 'cyno_guarded' | string;
  has_alliance_subsidy?: boolean;
  assign_corp_id?: number | null;
  assign_corp_name?: string;
  expiration_days?: number;
  days_to_complete?: number;
}

export interface JumpFreighterShip {
  id: string;
  name: string;
  race: 'Caldari' | 'Gallente' | 'Amarr' | 'Minmatar';
  capacityM3: number;
  maxLyRange: number;
  isotopeType: 'Helium Isotopes' | 'Oxygen Isotopes' | 'Hydrogen Isotopes' | 'Nitrogen Isotopes';
  isotopeCostPerUnit: number; // Current EVE market average ISK
  fuelConsumptionPerLy: number;
  icon: string;
}

export interface QuoteCalculation {
  corridor: FreightCorridor | null;
  origin: EveSolarSystem;
  destination: EveSolarSystem;
  volumeM3: number;
  collateralIsk: number;
  isRush: boolean;
  isCorpSubsidized: boolean;
  distanceLy: number;
  stargateJumps: number;
  baseFee: number;
  volumeFee: number;
  distanceFee: number;
  collateralFee: number;
  rushSurcharge: number;
  subsidizedDiscount: number;
  totalReward: number;
  fuelCostEstimate: number;
  fuelIsotopesNeeded: number;
  fuelIsotopeName: string;
  estimatedDeliveryHours: number;
  waypoints: string[];
  warnings: string[];
}

export interface AllianceAuthUser {
  characterName: string;
  characterId: number;
  corporationName: string;
  corporationTicker: string;
  allianceName: string;
  allianceTicker: string;
  avatarUrl: string;
  roles: string[];
  mainCharacter: string;
}

export type ContractItem = components['schemas']['ContractSchema'];
export type ActiveCourierContract = ContractItem;

export interface CargoAppraisalItem {
  name: string;
  quantity: number;
  volumePerUnit: number;
  totalVolume: number;
  estimatedValuePerUnit: number;
  totalValue: number;
}
