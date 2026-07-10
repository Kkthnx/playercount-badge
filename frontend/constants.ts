export const BADGE_ID = 'playercount-badge';
export const PROTONDB_BADGE_ID = 'protondb-status-badge';
export const STORAGE_KEY_SHOW = 'playercount-badge.show';
export const REFRESH_INTERVAL_MS = 30_000;
export const ACHIEVEMENTS_WAIT_MS = 400;

export const STEAM_PLAYER_COUNT_API =
  'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';

export function steamDbChartsUrl(appId: number): string {
  return `https://steamdb.info/app/${appId}/charts/`;
}

export function formatPlayerCount(count: number): string {
  return new Intl.NumberFormat('en-US').format(count);
}

export const PLAYER_THRESHOLDS = {
  VERY_HIGH: 50_000,
  HIGH: 10_000,
  MEDIUM: 5_000,
  LOW: 1_000,
} as const;

export function colorForPlayerCount(count: number): string {
  if (count > PLAYER_THRESHOLDS.VERY_HIGH) return '#e80e0e';
  if (count > PLAYER_THRESHOLDS.HIGH) return '#cfb53b';
  if (count > PLAYER_THRESHOLDS.MEDIUM) return '#a6a6a6';
  if (count > PLAYER_THRESHOLDS.LOW) return '#cd7f32';
  return '#4b9eea';
}

export function isPluginEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY_SHOW) !== 'false';
}
