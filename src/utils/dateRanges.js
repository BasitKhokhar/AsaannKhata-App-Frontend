export const DATE_RANGE_PRESETS = [
  ['today', 'yesterday'],
  ['thisWeek', 'lastWeek'],
  ['thisMonth', 'lastMonth'],
  ['thisYear', 'lastYear'],
];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export function dateRangeForPreset(id, now = new Date()) {
  if (id === 'allTime') return { startDate: null, endDate: null };

  const startDate = startOfDay(now);
  const endDate = endOfDay(now);

  switch (id) {
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      break;
    case 'thisWeek': {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day + (day === 0 ? -6 : 1));
      break;
    }
    case 'lastWeek': {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day + (day === 0 ? -13 : -6));
      endDate.setTime(startDate.getTime());
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'thisMonth':
      startDate.setDate(1);
      break;
    case 'lastMonth':
      startDate.setMonth(startDate.getMonth() - 1, 1);
      endDate.setDate(0);
      break;
    case 'thisYear':
      startDate.setMonth(0, 1);
      break;
    case 'lastYear':
      startDate.setFullYear(startDate.getFullYear() - 1, 0, 1);
      endDate.setFullYear(endDate.getFullYear() - 1, 11, 31);
      break;
    default:
      break;
  }

  return { startDate, endDate };
}

export function normalizeCustomDateRange(startDate, endDate) {
  return { startDate: startOfDay(startDate), endDate: endOfDay(endDate) };
}

export function dateIsInRange(value, range) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  if (range?.startDate && time < new Date(range.startDate).getTime()) return false;
  if (range?.endDate && time > new Date(range.endDate).getTime()) return false;
  return true;
}

export function rangeQueryKey(range) {
  return [
    range?.startDate ? new Date(range.startDate).toISOString() : null,
    range?.endDate ? new Date(range.endDate).toISOString() : null,
  ];
}

export function dateRangeLabel(range, label, translate) {
  if (label !== 'customRange') return translate(`dateFilter.${label}`);
  const format = (value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${format(range.startDate)} — ${format(range.endDate)}`;
}
