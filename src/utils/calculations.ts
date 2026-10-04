import { LineItem, QuoteCalculations, ServiceQuote } from '../types';

export function calculateItemsTotals(
  items: LineItem[],
  taxRatePercent: number,
  discountType: 'none' | 'percent' | 'fixed' = 'none',
  discountValue: number = 0,
  depositPercent: number = 25
): QuoteCalculations {
  let baseSubtotal = 0;
  let optionalAddonsTotal = 0;
  let selectedOptionalTotal = 0;
  let taxableBase = 0;
  let estimatedCost = 0;

  for (const item of items) {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const itemCost = (item.quantity || 0) * (item.unitCost || 0);

    if (item.isOptional) {
      optionalAddonsTotal += itemTotal;
      if (item.selected) {
        selectedOptionalTotal += itemTotal;
        baseSubtotal += itemTotal;
        estimatedCost += itemCost;
        if (item.taxable) {
          taxableBase += itemTotal;
        }
      }
    } else {
      baseSubtotal += itemTotal;
      estimatedCost += itemCost;
      if (item.taxable) {
        taxableBase += itemTotal;
      }
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (discountType === 'percent' && discountValue > 0) {
    discountAmount = (baseSubtotal * Math.min(100, Math.max(0, discountValue))) / 100;
  } else if (discountType === 'fixed' && discountValue > 0) {
    discountAmount = Math.min(baseSubtotal, discountValue);
  }

  // Net taxable subtotal proportionally reduced by discount
  const discountRatio = baseSubtotal > 0 ? (baseSubtotal - discountAmount) / baseSubtotal : 1;
  const netTaxableSubtotal = Math.max(0, taxableBase * discountRatio);
  const taxAmount = (netTaxableSubtotal * (taxRatePercent || 0)) / 100;

  const total = Math.max(0, baseSubtotal - discountAmount + taxAmount);
  const depositRequired = (total * Math.min(100, Math.max(0, depositPercent))) / 100;
  const balanceDue = Math.max(0, total - depositRequired);

  const grossProfit = total - taxAmount - estimatedCost;
  const grossMarginPercent = (total - taxAmount) > 0 ? (grossProfit / (total - taxAmount)) * 100 : 0;

  return {
    subtotal: round2(baseSubtotal),
    optionalAddonsTotal: round2(optionalAddonsTotal),
    selectedOptionalTotal: round2(selectedOptionalTotal),
    discountAmount: round2(discountAmount),
    netTaxableSubtotal: round2(netTaxableSubtotal),
    taxAmount: round2(taxAmount),
    total: round2(total),
    depositRequired: round2(depositRequired),
    balanceDue: round2(balanceDue),
    estimatedCost: round2(estimatedCost),
    grossProfit: round2(grossProfit),
    grossMarginPercent: round2(grossMarginPercent),
  };
}

export function calculateQuote(quote: ServiceQuote, defaultTaxRate: number): QuoteCalculations {
  const taxRate = quote.customTaxRate !== undefined ? quote.customTaxRate : defaultTaxRate;

  let activeItems: LineItem[] = [];
  if (quote.isTiered && quote.tiers && quote.tiers.length > 0) {
    const selectedTier = quote.tiers.find((t) => t.id === quote.selectedTierId) || quote.tiers[0];
    activeItems = selectedTier?.items || [];
  } else {
    activeItems = quote.singleItems || [];
  }

  return calculateItemsTotals(
    activeItems,
    taxRate,
    quote.discountType,
    quote.discountValue,
    quote.depositRequiredPercent
  );
}

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
