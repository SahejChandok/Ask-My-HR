export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

export function formatHours(value: number): string {
  return value.toFixed(1);
}

export function formatRate(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatPayRate(rate: number): string {
  return `${rate}x`;
}

export function formatShiftHours(daily: number | undefined, weekly: number | undefined): string {
  const d = daily || 8;
  const w = weekly || 40;
  return `${formatHours(d)}h daily / ${formatHours(w)}h weekly`;
}