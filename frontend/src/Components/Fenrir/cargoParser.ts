import type { CargoAppraisalItem } from '@/types';

export function parseEveNumber(str: string): number {
  if (!str) return 0;
  // Clean units and normalize non-breaking spaces (\u00A0, \u202F)
  let clean = str.replace(/m3|m³|isk/gi, '').replace(/[\u00A0\u202F]/g, ' ').trim();
  if (!clean) return 0;

  // If there are spaces as thousands separators (e.g. "18 500 000" or "4 202 254 237,29")
  if (clean.includes(' ')) {
    clean = clean.replace(/ /g, '');
  }

  // If there is both dot and comma (e.g. "1.234.567,89" or "1,234,567.89")
  if (clean.includes('.') && clean.includes(',')) {
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');
    if (lastComma > lastDot) {
      // European format: 1.234.567,89
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234,567.89
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Only comma: either decimal separator (e.g. "5,04" or "237,29") or thousands separator ("1,000,000")
    if (/,\d{1,2}$/.test(clean)) {
      clean = clean.replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

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
    if (line.includes('\t')) {
      const parts = line.split('\t');
      const rawName = parts[0]?.trim();
      if (!rawName) continue;

      const group = parts[2]?.trim();
      const displayName = group && group !== rawName ? `${rawName} (${group})` : rawName;

      let quantity = 1;
      if (parts[1]?.trim()) {
        const q = parseEveNumber(parts[1]);
        if (q > 0) quantity = q;
      }

      const volumePart = parts.find((p) => /m3|m³/i.test(p));
      const iskPart = parts.find((p) => /isk/i.test(p));

      const volume = volumePart ? parseEveNumber(volumePart) : 0;
      const value = iskPart ? parseEveNumber(iskPart) : 0;

      items.push({
        name: displayName,
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

    items.push({
      name: itemName,
      quantity: qty,
      volumePerUnit: 0,
      totalVolume: 0,
      estimatedValuePerUnit: 0,
      totalValue: 0,
    });

    parsedLinesCount++;
  }

  return {
    items,
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalEstimatedValue: Math.round(totalEstimatedValue),
    parsedLinesCount,
  };
}
