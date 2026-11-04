/**
 * NSE and NASDAQ regular-session calendar.
 *
 * Status is derived from exchange time zones, weekday, official holidays, and
 * (for NASDAQ) published early-close days — not from a hardcoded "always live" flag.
 */

const LIVE_QUOTE_MAX_AGE_MS = 5 * 60 * 1000;
const CLOSED_QUOTE_TTL_MS = 6 * 60 * 60 * 1000;

const NSE_HOLIDAYS = {
  '2025-02-26': 'Mahashivratri',
  '2025-03-14': 'Holi',
  '2025-03-31': 'Id-Ul-Fitr',
  '2025-04-10': 'Shri Mahavir Jayanti',
  '2025-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2025-04-18': 'Good Friday',
  '2025-05-01': 'Maharashtra Day',
  '2025-08-15': 'Independence Day',
  '2025-08-27': 'Ganesh Chaturthi',
  '2025-10-02': 'Mahatma Gandhi Jayanti / Dussehra',
  '2025-10-21': 'Diwali Laxmi Pujan',
  '2025-10-22': 'Diwali-Balipratipada',
  '2025-11-05': 'Guru Nanak Jayanti',
  '2025-12-25': 'Christmas',
  '2026-01-26': 'Republic Day',
  '2026-03-03': 'Holi',
  '2026-03-26': 'Shri Ram Navami',
  '2026-03-31': 'Shri Mahavir Jayanti',
  '2026-04-03': 'Good Friday',
  '2026-04-14': 'Dr. Baba Saheb Ambedkar Jayanti',
  '2026-05-01': 'Maharashtra Day',
  '2026-05-28': 'Bakri Id',
  '2026-06-26': 'Muharram',
  '2026-09-14': 'Ganesh Chaturthi',
  '2026-10-02': 'Mahatma Gandhi Jayanti',
  '2026-10-20': 'Dussehra',
  '2026-11-10': 'Diwali-Balipratipada',
  '2026-11-24': 'Guru Nanak Jayanti',
  '2026-12-25': 'Christmas',
};

const NASDAQ_HOLIDAYS = {
  '2025-01-01': "New Year's Day",
  '2025-01-20': 'Martin Luther King Jr. Day',
  '2025-02-17': "Presidents' Day",
  '2025-04-18': 'Good Friday',
  '2025-05-26': 'Memorial Day',
  '2025-06-19': 'Juneteenth',
  '2025-07-04': 'Independence Day',
  '2025-09-01': 'Labor Day',
  '2025-11-27': 'Thanksgiving Day',
  '2025-12-25': 'Christmas',
  '2026-01-01': "New Year's Day",
  '2026-01-19': 'Martin Luther King Jr. Day',
  '2026-02-16': "Presidents' Day",
  '2026-04-03': 'Good Friday',
  '2026-05-25': 'Memorial Day',
  '2026-06-19': 'Juneteenth',
  '2026-07-03': 'Independence Day (observed)',
  '2026-09-07': 'Labor Day',
  '2026-11-26': 'Thanksgiving Day',
  '2026-12-25': 'Christmas',
  '2027-01-01': "New Year's Day",
  '2027-01-18': 'Martin Luther King Jr. Day',
  '2027-02-15': "Presidents' Day",
  '2027-03-26': 'Good Friday',
  '2027-05-31': 'Memorial Day',
  '2027-06-18': 'Juneteenth (observed)',
  '2027-07-05': 'Independence Day (observed)',
  '2027-09-06': 'Labor Day',
  '2027-11-25': 'Thanksgiving Day',
  '2027-12-24': 'Christmas (observed)',
};

const NASDAQ_EARLY_CLOSE = {
  '2025-07-03': true,
  '2025-11-28': true,
  '2025-12-24': true,
  '2026-11-27': true,
  '2026-12-24': true,
  '2027-11-26': true,
};

const MARKETS = {
  IN: {
    id: 'IN',
    exchange: 'NSE',
    timezone: 'Asia/Kolkata',
    openMinutes: 9 * 60 + 15,
    closeMinutes: 15 * 60 + 30,
    hoursLabel: '9:15–15:30 IST, Mon–Fri',
    holidays: NSE_HOLIDAYS,
  },
  US: {
    id: 'US',
    exchange: 'NASDAQ',
    timezone: 'America/New_York',
    openMinutes: 9 * 60 + 30,
    closeMinutes: 16 * 60,
    earlyCloseMinutes: 13 * 60,
    hoursLabel: '9:30–16:00 ET, Mon–Fri',
    holidays: NASDAQ_HOLIDAYS,
    earlyCloseDays: NASDAQ_EARLY_CLOSE,
  },
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function zonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const bag = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') {
      bag[part.type] = part.value;
    }
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: bag.weekday,
  };
}

function dateKey(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function minutesOfDay(parts) {
  return parts.hour * 60 + parts.minute;
}

function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const asZone = zonedParts(new Date(utcGuess), timeZone);
  const asZoneMs = Date.UTC(
    asZone.year,
    asZone.month - 1,
    asZone.day,
    asZone.hour,
    asZone.minute,
    asZone.second
  );
  return new Date(utcGuess - (asZoneMs - utcGuess));
}

function addDaysToKey(key, days) {
  const [year, month, day] = key.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function weekdayFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function resolveMarket(market) {
  const key = String(market || 'IN').toUpperCase();
  return MARKETS[key] || MARKETS.IN;
}

function closeMinutesFor(config, key) {
  if (config.earlyCloseDays && config.earlyCloseDays[key]) {
    return config.earlyCloseMinutes;
  }
  return config.closeMinutes;
}

function isWeekendKey(key) {
  const day = weekdayFromKey(key);
  return day === 0 || day === 6;
}

function holidayName(config, key) {
  return config.holidays[key] || null;
}

function isTradingDay(config, key) {
  return !isWeekendKey(key) && !holidayName(config, key);
}

function sessionBounds(config, key) {
  const [year, month, day] = key.split('-').map(Number);
  const closeMins = closeMinutesFor(config, key);
  return {
    open: zonedTimeToUtc(
      year,
      month,
      day,
      Math.floor(config.openMinutes / 60),
      config.openMinutes % 60,
      config.timezone
    ),
    close: zonedTimeToUtc(
      year,
      month,
      day,
      Math.floor(closeMins / 60),
      closeMins % 60,
      config.timezone
    ),
  };
}

function findTradingDay(config, startKey, direction) {
  let key = startKey;
  for (let i = 0; i < 21; i += 1) {
    if (isTradingDay(config, key)) {
      return key;
    }
    key = addDaysToKey(key, direction);
  }
  return startKey;
}

function getMarketStatus(market, at = new Date()) {
  const now = at instanceof Date ? at : new Date(at);
  const config = resolveMarket(market);
  const parts = zonedParts(now, config.timezone);
  const key = dateKey(parts);
  const weekend = isWeekendKey(key);
  const holiday = holidayName(config, key);
  const mins = minutesOfDay(parts);
  const closeMins = closeMinutesFor(config, key);
  const tradingDay = isTradingDay(config, key);
  const inHours = tradingDay && mins >= config.openMinutes && mins < closeMins;

  let state = 'closed';
  if (weekend) {
    state = 'weekend';
  } else if (holiday) {
    state = 'holiday';
  } else if (inHours) {
    state = 'open';
  } else {
    state = 'closed';
  }

  const previousKey = findTradingDay(
    config,
    tradingDay && mins < config.openMinutes ? addDaysToKey(key, -1) : tradingDay ? key : addDaysToKey(key, -1),
    -1
  );
  const nextKey = findTradingDay(
    config,
    inHours || (tradingDay && mins < config.openMinutes) ? key : addDaysToKey(key, 1),
    1
  );
  const lastBounds = sessionBounds(config, previousKey);
  const nextBounds = sessionBounds(config, nextKey);
  const lastSessionEnd = inHours ? lastBounds.close : tradingDay && mins >= closeMins ? sessionBounds(config, key).close : lastBounds.close;
  const nextSessionStart = inHours ? sessionBounds(config, key).open : tradingDay && mins < config.openMinutes ? sessionBounds(config, key).open : nextBounds.open;

  const exchange = config.exchange;
  let label;
  if (state === 'open') {
    label = `${exchange} Open`;
  } else if (state === 'weekend') {
    label = `Weekend · ${exchange} Closed`;
  } else if (state === 'holiday') {
    label = `${exchange} Closed · ${holiday}`;
  } else {
    label = `${exchange} Market Closed`;
  }

  return {
    market: config.id,
    exchange,
    timezone: config.timezone,
    hoursLabel: config.hoursLabel,
    isOpen: state === 'open',
    state,
    label,
    holidayName: holiday,
    asOf: now.toISOString(),
    lastSessionEnd: lastSessionEnd.toISOString(),
    nextSessionStart: nextSessionStart.toISOString(),
  };
}

function isMarketOpen(market, at) {
  return getMarketStatus(market, at).isOpen;
}

function isAnyMarketOpen(at) {
  return isMarketOpen('IN', at) || isMarketOpen('US', at);
}

function isQuoteLive({ priceTime, quoteUpdatedAt, now = new Date() } = {}) {
  const stamps = [priceTime, quoteUpdatedAt]
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((value) => Number.isFinite(value));

  if (!stamps.length) {
    return false;
  }

  const newest = Math.max(...stamps);
  return now.getTime() - newest <= LIVE_QUOTE_MAX_AGE_MS;
}

function isFeedLive(market, quoteTimes, at) {
  const now = at ? new Date(at) : new Date();
  return getMarketStatus(market, now).isOpen && isQuoteLive({ ...quoteTimes, now });
}

function needsQuoteRefresh(
  quoteUpdatedAt,
  market,
  at = new Date(),
  { openTtlMs = 30 * 1000, closedTtlMs = CLOSED_QUOTE_TTL_MS } = {}
) {
  const now = at instanceof Date ? at : new Date(at);
  const status = getMarketStatus(market, now);

  if (status.isOpen) {
    if (!quoteUpdatedAt) {
      return true;
    }
    return now.getTime() - new Date(quoteUpdatedAt).getTime() >= openTtlMs;
  }

  if (!quoteUpdatedAt) {
    return true;
  }

  const fetchedAt = new Date(quoteUpdatedAt);
  const lastClose = new Date(status.lastSessionEnd);
  if (fetchedAt < lastClose && now >= lastClose) {
    return true;
  }

  return now.getTime() - fetchedAt.getTime() >= closedTtlMs;
}

function liveLabel(status, isLive) {
  if (isLive) {
    return `Live ${status.exchange}`;
  }
  if (status.isOpen) {
    return `${status.exchange} Open · delayed`;
  }
  return status.label;
}

module.exports = {
  MARKETS,
  LIVE_QUOTE_MAX_AGE_MS,
  CLOSED_QUOTE_TTL_MS,
  getMarketStatus,
  isMarketOpen,
  isAnyMarketOpen,
  isQuoteLive,
  isFeedLive,
  needsQuoteRefresh,
  liveLabel,
};