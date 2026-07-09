import { UIMode, detectGamePage } from './detector';
import { clearPlayerCountCache, fetchPlayerCount } from '../services/playerCountApi';
import {
  createBadge,
  ensureBadgePosition,
  findToolbarRow,
  insertBadgeInRow,
  updateBadgeValue,
} from '../display/badge';
import {
  ACHIEVEMENTS_WAIT_MS,
  BADGE_ID,
  isPluginEnabled,
  REFRESH_INTERVAL_MS,
} from '../constants';

let observer: MutationObserver | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let refreshIntervalId: ReturnType<typeof setInterval> | null = null;
let currentAppId: number | null = null;
let processingAppId: number | null = null;
let panelDoc: Document | null = null;

function clearRefreshInterval(): void {
  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

function clearCurrentBadge(): void {
  panelDoc?.getElementById(BADGE_ID)?.remove();
  panelDoc = null;
  clearRefreshInterval();
}

function resetStateForNoGame(): void {
  clearCurrentBadge();
  currentAppId = null;
  processingAppId = null;
}

function startRefreshLoop(appId: number): void {
  clearRefreshInterval();

  refreshIntervalId = setInterval(async () => {
    if (currentAppId !== appId || !isPluginEnabled()) return;

    const badge = panelDoc?.getElementById(BADGE_ID);
    if (!badge) return;

    const playerCount = await fetchPlayerCount(appId, { bypassCache: true });
    if (currentAppId !== appId || !playerCount) return;

    updateBadgeValue(badge, playerCount);
  }, REFRESH_INTERVAL_MS);
}

export function disconnectObserver(): void {
  observer?.disconnect();
  observer = null;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  clearRefreshInterval();
  panelDoc?.getElementById(BADGE_ID)?.remove();
  currentAppId = null;
  processingAppId = null;
  panelDoc = null;
  clearPlayerCountCache();
}

export function setupObserver(doc: Document, mode: UIMode): void {
  disconnectObserver();

  observer = new MutationObserver(() => handleGamePage(doc, mode));
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  intervalId = setInterval(() => handleGamePage(doc, mode), 500);
  handleGamePage(doc, mode);
}

async function handleGamePage(doc: Document, mode: UIMode): Promise<void> {
  try {
    await _handleGamePage(doc, mode);
  } catch (e) {
    console.error('[PlayerCount] handleGamePage threw:', e);
  }
}

async function _handleGamePage(doc: Document, mode: UIMode): Promise<void> {
  if (!isPluginEnabled()) {
    if (currentAppId !== null) {
      resetStateForNoGame();
    }
    return;
  }

  const info = detectGamePage(doc, mode);
  if (!info) {
    if (currentAppId !== null) {
      resetStateForNoGame();
    }
    return;
  }

  const { appId } = info;

  if (currentAppId !== appId) {
    clearCurrentBadge();
    clearPlayerCountCache(currentAppId ?? undefined);
    currentAppId = appId;
    processingAppId = null;
  }

  const existingBadge = panelDoc?.getElementById(BADGE_ID) as HTMLElement | null;
  if (existingBadge) {
    const row = existingBadge.parentElement;
    if (row) {
      ensureBadgePosition(row, existingBadge);
    }
    if (!refreshIntervalId) {
      startRefreshLoop(appId);
    }
    return;
  }

  if (processingAppId === appId) return;

  processingAppId = appId;

  const target = findToolbarRow();
  if (!target) {
    processingAppId = null;
    return;
  }
  panelDoc = target.doc;

  const playerCount = await fetchPlayerCount(appId);
  if (currentAppId !== appId) {
    processingAppId = null;
    return;
  }
  if (!playerCount) {
    processingAppId = null;
    return;
  }

  const deadline = Date.now() + ACHIEVEMENTS_WAIT_MS;
  while (Date.now() < deadline) {
    const rowNow = target.doc.getElementById(target.row.id as string) ?? target.row;
    const hasAchievements = Array.from(rowNow.children).some(
      el => el.textContent?.includes('Achievements'),
    );
    if (hasAchievements) break;
    await new Promise(r => setTimeout(r, 50));
  }

  if (currentAppId !== appId) {
    processingAppId = null;
    return;
  }

  const freshTarget = findToolbarRow() ?? target;
  panelDoc = freshTarget.doc;

  const badge = createBadge(playerCount, appId, freshTarget.doc);
  insertBadgeInRow(freshTarget.row, badge);
  startRefreshLoop(appId);
  processingAppId = null;
}
