import { t } from '../store/languageStore';

// Uses the imperative `t()` helper (see languageStore.js) so relative
// timestamps respect the app's active language even though this is a plain
// utility, not a component — otherwise every screen showing a timestamp
// (Dashboard, Credit Customers, Customer Detail, Sync Status, Stock) would
// leak English words into an Urdu/Hindi UI.
export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('common.justNow');
  if (minutes < 60) return t('common.minutesAgo').replace('{count}', minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t(hours === 1 ? 'common.hourAgo' : 'common.hoursAgo').replace('{count}', hours);
  const days = Math.floor(hours / 24);
  if (days < 7) return t(days === 1 ? 'common.dayAgo' : 'common.daysAgo').replace('{count}', days);
  const weeks = Math.floor(days / 7);
  return t(weeks === 1 ? 'common.weekAgo' : 'common.weeksAgo').replace('{count}', weeks);
}
