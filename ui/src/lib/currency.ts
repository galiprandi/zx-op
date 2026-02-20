export interface CurrencyFormatOptions {
  symbol?: string;
  compactFrom?: number;
  compactSuffix?: string;
  useCompact?: boolean;
}

const DEFAULT_OPTIONS: Required<CurrencyFormatOptions> = {
  symbol: '$',
  compactFrom: 1_000_000,
  compactSuffix: 'm',
  useCompact: true,
};

function formatIntegerPart(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value: number, options: CurrencyFormatOptions = {}): string {
  const cfg = { ...DEFAULT_OPTIONS, ...options };
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (cfg.useCompact && abs >= cfg.compactFrom) {
    const compactValue = Math.floor(abs / 1_000_000);
    return `${sign}${cfg.symbol} ${compactValue}${cfg.compactSuffix}`;
  }

  return `${sign}${cfg.symbol} ${formatIntegerPart(Math.floor(abs))}`;
}

export function formatCompactCurrency(value: number, symbol = '$'): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(millions);
    return `${sign}${symbol} ${formatted}m`;
  }

  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(thousands);
    return `${sign}${symbol} ${formatted}k`;
  }

  return `${sign}${symbol} ${formatIntegerPart(Math.floor(abs))}`;
}
