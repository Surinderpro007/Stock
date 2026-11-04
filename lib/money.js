function roundMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function roundPercent(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

function formatVolume(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '—';
  }

  if (amount >= 1_00_00_000) {
    return `${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_00_000) {
    return `${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_000) {
    return `${(amount / 1_00_00_000 * 100).toFixed(2)} L`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }

  return amount.toLocaleString('en-IN');
}

module.exports = {
  roundMoney,
  roundPercent,
  formatVolume,
};
