import type { CargoAppraisalItem } from '@/types';

// Common EVE Online items catalog with baseline volumes and average market values
const KNOWN_ITEMS_DB: Record<string, { volume: number; value: number }> = {
  // Ships
  'megathron': { volume: 50000, value: 420000000 },
  'raven': { volume: 50000, value: 430000000 },
  'tempest': { volume: 50000, value: 410000000 },
  'apocalypse': { volume: 50000, value: 440000000 },
  'ferox': { volume: 15000, value: 95000000 },
  'drake': { volume: 15000, value: 105000000 },
  'hurricane': { volume: 15000, value: 98000000 },
  'harbinger': { volume: 15000, value: 110000000 },
  'ishtar': { volume: 10000, value: 240000000 },
  'cerberus': { volume: 10000, value: 250000000 },
  'muninn': { volume: 10000, value: 235000000 },
  'eagle': { volume: 10000, value: 260000000 },
  'tengu': { volume: 5000, value: 550000000 },
  'loki': { volume: 5000, value: 580000000 },
  'legion': { volume: 5000, value: 540000000 },
  'proteus': { volume: 5000, value: 520000000 },
  'rhea': { volume: 1300000, value: 14500000000 },
  'anshar': { volume: 1300000, value: 15200000000 },
  'ark': { volume: 1300000, value: 14800000000 },
  'nomad': { volume: 1300000, value: 14200000000 },
  'charon': { volume: 1300000, value: 4800000000 },
  'obelisk': { volume: 1300000, value: 4900000000 },
  'providence': { volume: 1300000, value: 4700000000 },
  'fenrir': { volume: 1300000, value: 4850000000 },

  // Modules & Weapons
  'heavy neutron blaster ii': { volume: 5, value: 9500000 },
  '1400mm howitzer artillery ii': { volume: 10, value: 12500000 },
  'mega pulse laser ii': { volume: 8, value: 11000000 },
  'cruise missile launcher ii': { volume: 10, value: 8500000 },
  'damage control ii': { volume: 5, value: 1800000 },
  'large armor repairer ii': { volume: 25, value: 5200000 },
  'large shield booster ii': { volume: 25, value: 4800000 },
  'warp disruptor ii': { volume: 5, value: 3400000 },
  '500mn cold-gas endure afterburner': { volume: 30, value: 24000000 },

  // Minerals & PI
  'tritanium': { volume: 0.01, value: 4.8 },
  'pyerite': { volume: 0.01, value: 11.2 },
  'mexallon': { volume: 0.01, value: 78.5 },
  'isogen': { volume: 0.01, value: 410.0 },
  'nocxium': { volume: 0.01, value: 890.0 },
  'zydrine': { volume: 0.01, value: 2150.0 },
  'megacyte': { volume: 0.01, value: 3800.0 },
  'morphite': { volume: 0.01, value: 12400.0 },
  'compressed veldspar': { volume: 0.15, value: 1450.0 },
  'compressed scordite': { volume: 0.15, value: 1950.0 },

  // Fuel & Isotopes
  'helium isotopes': { volume: 0.05, value: 920 },
  'oxygen isotopes': { volume: 0.05, value: 950 },
  'hydrogen isotopes': { volume: 0.05, value: 890 },
  'nitrogen isotopes': { volume: 0.05, value: 870 },
  'caldari navy fuel block': { volume: 5, value: 21500 },
  'gallente fuel block': { volume: 5, value: 22000 },
  'amarr fuel block': { volume: 5, value: 21000 },
  'minmatar fuel block': { volume: 5, value: 20500 },
  'heavy water': { volume: 0.4, value: 320 },
  'liquid ozone': { volume: 0.4, value: 540 },

  // High Value / Injectors
  'large skill injector': { volume: 0.01, value: 920000000 },
  'small skill injector': { volume: 0.01, value: 185000000 },
  'skill extractor': { volume: 0.01, value: 450000000 },
  'plex': { volume: 0.001, value: 5400000 },
};

export function parseEveClipboard(rawText: string): {
  items: CargoAppraisalItem[];
  totalVolume: number;
  totalEstimatedValue: number;
  parsedLinesCount: number;
} {
  const lines = rawText.split('\n');
  const items: CargoAppraisalItem[] = [];
  let totalVolume = 0;
  let totalEstimatedValue = 0;
  let parsedLinesCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try Tab-delimited (EVE client inventory copy)
    // E.g.: "Heavy Neutron Blaster II\t5\tEnergy Weapon\t25 m3\t\t55,000,000.00 ISK"
    if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t').map((p) => p.trim());
      const name = parts[0];
      let quantity = 1;
      let volume = 0;
      let value = 0;

      // Extract quantity
      if (parts[1] && !isNaN(Number(parts[1].replace(/,/g, '')))) {
        quantity = Number(parts[1].replace(/,/g, ''));
      }

      // Check for explicit volume column (e.g., "50 m3" or "25,000 m3")
      const volumePart = parts.find((p) => p.toLowerCase().includes('m3') || p.toLowerCase().includes('m³'));
      if (volumePart) {
        const num = parseFloat(volumePart.replace(/m3|m³|,/gi, '').trim());
        if (!isNaN(num)) {
          volume = num;
        }
      }

      // Check for explicit ISK price column (e.g., "150,000,000.00 ISK" or pure digits with .00)
      const iskPart = parts.find((p) => p.toUpperCase().includes('ISK') || (p.includes('.') && !isNaN(Number(p.replace(/,/g, '')))));
      if (iskPart) {
        const num = parseFloat(iskPart.replace(/isk|,/gi, '').trim());
        if (!isNaN(num)) {
          value = num;
        }
      }

      // If volume or value missing, fall back to known database lookup
      const lowerName = name.toLowerCase();
      const lookup = KNOWN_ITEMS_DB[lowerName];
      if (volume === 0) {
        volume = lookup ? lookup.volume * quantity : Math.max(1, quantity * 2);
      }
      if (value === 0) {
        value = lookup ? lookup.value * quantity : Math.max(100000, quantity * 250000);
      }

      items.push({
        name,
        quantity,
        volumePerUnit: Number((volume / quantity).toFixed(2)),
        totalVolume: volume,
        estimatedValuePerUnit: Math.round(value / quantity),
        totalValue: Math.round(value),
      });

      totalVolume += volume;
      totalEstimatedValue += value;
      parsedLinesCount++;
      continue;
    }

    // Try space/quantity prefix format:
    // e.g. "5000 Oxygen Isotopes" or "10 Megathron" or "Megathron x2"
    let qty = 1;
    let itemName = trimmed;

    const prefixMatch = trimmed.match(/^([\d,]+)\s+x?\s*(.+)$/i);
    const suffixMatch = trimmed.match(/^(.+?)\s+x\s*([\d,]+)$/i);

    if (prefixMatch) {
      qty = parseInt(prefixMatch[1].replace(/,/g, ''), 10) || 1;
      itemName = prefixMatch[2].trim();
    } else if (suffixMatch) {
      itemName = suffixMatch[1].trim();
      qty = parseInt(suffixMatch[2].replace(/,/g, ''), 10) || 1;
    }

    const lower = itemName.toLowerCase();
    const lookup = KNOWN_ITEMS_DB[lower];
    const unitVol = lookup ? lookup.volume : 10;
    const unitVal = lookup ? lookup.value : 500000;

    const vol = unitVol * qty;
    const val = unitVal * qty;

    items.push({
      name: itemName,
      quantity: qty,
      volumePerUnit: unitVol,
      totalVolume: vol,
      estimatedValuePerUnit: unitVal,
      totalValue: val,
    });

    totalVolume += vol;
    totalEstimatedValue += val;
    parsedLinesCount++;
  }

  return {
    items,
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalEstimatedValue: Math.round(totalEstimatedValue),
    parsedLinesCount,
  };
}
