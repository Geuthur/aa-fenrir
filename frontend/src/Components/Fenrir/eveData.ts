import type { JumpFreighterShip } from '@/types';

export const JUMP_FREIGHTERS: JumpFreighterShip[] = [
  {
    id: 'rhea',
    name: 'Rhea',
    race: 'Caldari',
    capacityM3: 360000,
    maxLyRange: 10.0,
    isotopeType: 'Helium Isotopes',
    isotopeCostPerUnit: 920,
    fuelConsumptionPerLy: 4250,
    icon: 'Shield',
  },
  {
    id: 'anshar',
    name: 'Anshar',
    race: 'Gallente',
    capacityM3: 375000,
    maxLyRange: 10.0,
    isotopeType: 'Oxygen Isotopes',
    isotopeCostPerUnit: 950,
    fuelConsumptionPerLy: 4100,
    icon: 'Armor',
  },
  {
    id: 'ark',
    name: 'Ark',
    race: 'Amarr',
    capacityM3: 350000,
    maxLyRange: 10.0,
    isotopeType: 'Hydrogen Isotopes',
    isotopeCostPerUnit: 890,
    fuelConsumptionPerLy: 4400,
    icon: 'Zap',
  },
  {
    id: 'nomad',
    name: 'Nomad',
    race: 'Minmatar',
    capacityM3: 340000,
    maxLyRange: 10.0,
    isotopeType: 'Nitrogen Isotopes',
    isotopeCostPerUnit: 870,
    fuelConsumptionPerLy: 3950,
    icon: 'Wind',
  },
];

export const POPULAR_CARGO_PRESETS = [
  { label: 'Packaged Battleship (1x)', volume: 50000, value: 450000000, desc: 'Single battleship hull (Megathron/Raven/Tempest)' },
  { label: 'Fleet Cruisers Crate (5x)', volume: 50000, value: 750000000, desc: '5 packaged HAC / Cruiser hulls' },
  { label: 'Full Jump Freighter (350k m³)', volume: 350000, value: 5000000000, desc: 'Full JF cargo hold, alliance logistics load' },
  { label: 'DST Pi & Fuel Cargo (55k m³)', volume: 55000, value: 1200000000, desc: 'Planetary interaction commodities & isotopes' },
  { label: 'Blockade Runner High-Value (10k m³)', volume: 10000, value: 8000000000, desc: 'Skill injectors, deadspace & BPOs' },
  { label: 'Standard Freighter Bulk (850k m³)', volume: 850000, value: 3000000000, desc: 'Highsec bulk compressed ore & minerals' },
];

