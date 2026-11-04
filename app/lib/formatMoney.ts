export function formatPrice(value: number | null | undefined, currency: string = 'INR') {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return currency === 'USD' ? '$0.00' : '₹0.00';
  }

  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatSignedPrice(value: number | null | undefined, currency: string = 'INR') {
  const amount = Number(value) || 0;
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatPrice(amount, currency)}`;
}

export function formatRupee(value: number | null | undefined) {
  return formatPrice(value, 'INR');
}

export function formatSignedRupee(value: number | null | undefined) {
  return formatSignedPrice(value, 'INR');
}

export function formatPercent(value: number | null | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0.00%';
  }

  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)}%`;
}

export function formatMarketCap(value: number | null | undefined, currency: string = 'INR') {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }

  if (currency === 'USD') {
    if (amount >= 1_000_000_000_000) {
      return `$${(amount / 1_000_000_000_000).toFixed(2)} T`;
    }
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)} B`;
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)} M`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  }

  const crores = amount / 1_00_00_000;
  return `₹${crores.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
}

export function formatVolume(value: number | null | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }

  if (amount >= 1_00_00_000) {
    return `${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_000) {
    return `${(amount / 1_00_000).toFixed(2)} L`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }

  return amount.toLocaleString('en-IN');
}
