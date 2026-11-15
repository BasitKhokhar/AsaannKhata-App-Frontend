export const POPUP_COOLDOWN_MS = 5 * 60 * 1000;

export function httpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^https:\/\/([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(?::(\d{1,5}))?(?:[/?#][^\s\\<>"\x00-\x1f]*)?$/i);
  if (!match || (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))) return null;
  return trimmed;
}

export function youtubeId(value) {
  const safe = httpsUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split('/').filter(Boolean);
  let id = null;
  if (host === 'youtu.be') id = parts[0];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
    id = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : null);
  }
  return /^[\w-]{11}$/.test(id || '') ? id : null;
}

export function supportedVideo(value) {
  const url = httpsUrl(value);
  return url && (youtubeId(url) || /\.(mp4|webm)$/i.test(url.split(/[?#]/)[0])) ? url : null;
}

export function normalizePopup(value) {
  if (!value || value.active !== true || value.schemaVersion !== 1 || !value.id) return null;
  if (!['image', 'image_link', 'video'].includes(value.type)) return null;
  const imageUrl = httpsUrl(value.imageUrl);
  const videoUrl = supportedVideo(value.videoUrl);
  const actionUrl = httpsUrl(value.actionUrl);
  if (value.type !== 'video' && !imageUrl) return null;
  if (value.type === 'image_link' && !actionUrl) return null;
  if (value.type === 'video' && !videoUrl) return null;
  return {
    ...value,
    imageUrl,
    videoUrl,
    actionUrl,
    title: typeof value.title === 'string' ? value.title.slice(0, 160) : '',
    message: typeof value.message === 'string' ? value.message.slice(0, 1000) : '',
    buttonLabel: typeof value.buttonLabel === 'string' ? value.buttonLabel.slice(0, 60) : '',
  };
}

export function cooldownReady(lastShown, now = Date.now()) {
  const last = Number(lastShown);
  return !last || (Number.isFinite(last) && now - last >= POPUP_COOLDOWN_MS);
}
