import { findClassModule } from '@steambrew/client';
import type { PlayerCount } from '../services/playerCountApi';
import {
  BADGE_ID,
  PROTONDB_BADGE_ID,
  colorForPlayerCount,
  steamDbChartsUrl,
} from '../constants';

const PlayBar = (findClassModule?.(
  (m: any) => !!(m.GameStat && m.PlayBarLabel)
) as Record<string, string> | undefined) ?? null;

const KNOWN: Record<string, string> = {
  GameStat:            '_1kiZKVbDe-9Ikootk57kpA',
  GameStatWithIcon:    '_1aKegVl9_lSdNAyWYZQlr9',
  GameStatIcon:        '_1tIg-QIrwMNtCm7NcYADyi',
  GameStatIconVariant: '_1GZdosVXnfrf69yU8DWASl',
  GameStatRight:       '_3m_zjRTQBqcfzCjXLXUHcR',
  PlayBarLabel:        '_34lrt5-Fc3usZU6trA1P0-',
  PlayBarDetailLabel:  '_2TYVGoD27ZMfjRirKQNLfk',
};

function c(key: string): string {
  return PlayBar?.[key] ?? KNOWN[key] ?? '';
}

export interface ToolbarTarget {
  row: HTMLElement;
  doc: Document;
}

function applyColor(el: HTMLElement, color: string): void {
  if (color) {
    el.style.color = color;
  } else {
    // Empty color means the "No colors" scheme: drop the inline style so
    // Steam's default text color applies.
    el.style.removeProperty('color');
  }
}

let lastOpenMs = 0;

function openSteamDbCharts(appId: number): void {
  const url = steamDbChartsUrl(appId);
  const w = window as any;

  const now = Date.now();
  if (now - lastOpenMs < 800) return;
  lastOpenMs = now;

  const openInSystemBrowser = w.SteamClient?.System?.OpenInSystemBrowser;
  if (typeof openInSystemBrowser === 'function') {
    try {
      openInSystemBrowser(url);
      return;
    } catch {
    }
  }

  try {
    const link = w.document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    w.document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    console.warn('[PlayerCount] Could not open SteamDB URL');
  }
}

function _findInDoc(doc: Document): HTMLElement | null {
  if (PlayBar?.GameStatsSection) {
    const els = doc.querySelectorAll('.' + PlayBar.GameStatsSection);
    if (els.length > 0) {
      return els[els.length - 1] as HTMLElement;
    }
  }

  if (PlayBar?.PlaytimeIcon) {
    const icons = doc.querySelectorAll('.' + PlayBar.PlaytimeIcon);
    if (icons.length > 0) {
      const icon = icons[icons.length - 1];
      const row = PlayBar.GameStatsSection
        ? icon.closest('.' + PlayBar.GameStatsSection) as HTMLElement | null
        : icon.parentElement?.parentElement?.parentElement as HTMLElement | null;
      if (row) return row;
    }
  }

  const svgs = doc.querySelectorAll('[class*="SVGIcon_PlayTime"], .SVGIcon_PlayTime');
  if (svgs.length > 0) {
    const row = svgs[svgs.length - 1].parentElement?.parentElement?.parentElement;
    if (row) return row as HTMLElement;
  }

  return null;
}

export function findToolbarRow(): ToolbarTarget | null {
  const inMain = _findInDoc(document);
  if (inMain) {
    return { row: inMain, doc: document };
  }

  const g_PM = (window as any).g_PopupManager;
  const popups: any[] = g_PM?.GetPopups?.() ?? [];
  for (const popup of popups) {
    let popDoc: Document | null = null;
    try { popDoc = popup?.window?.document; } catch { continue; }
    if (!popDoc || popDoc === document) continue;
    const found = _findInDoc(popDoc);
    if (found) {
      return { row: found, doc: popDoc };
    }
  }

  return null;
}

export function insertBadgeInRow(row: HTMLElement, badge: HTMLElement): void {
  const protonBadge = row.querySelector('#' + PROTONDB_BADGE_ID);
  if (protonBadge) {
    row.insertBefore(badge, protonBadge);
    return;
  }
  row.appendChild(badge);
}

export function ensureBadgePosition(row: HTMLElement, badge: HTMLElement): void {
  const protonBadge = row.querySelector('#' + PROTONDB_BADGE_ID);
  if (protonBadge && badge.nextElementSibling !== protonBadge) {
    row.insertBefore(badge, protonBadge);
  }
}

// SteamDB's single-player silhouette, recolored to Steam's neutral icon gray.
// Bundled as a data URI so the badge never depends on the network or on
// Steam's version-dependent icon classes.
const PLAYERS_ICON_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAgCAYAAABdP1tmAAABdElEQVR42u3YTytEURjH8Y8/NQpbKymJUMq/LKxkoSwVKwsSCy/AeyDKTkRR8gJkZ0WJlIXJgndgoWxsKQt3oUlj7sw9M3OHX93FPefXqe85z3N6zlO3vXukllSvxlRzQI0B1+7CEibQHo29IItjXKQJaAxnaMsZ78BIBLqGrTSEXAYHP8DkahNDaQAaxUCB3tk0AA3E8PalAaglhrf5/9quANBzIG/FgMZieLuTDrsQQL0xvZlqB7qO4X3Ca7UDXcbw3qUhh65wUuDprKcB6D2C+k2Pabnl4CFmuDVUO9BtVG3nAz789v9R7UDv2Mgzvx8i3CpZ+mRCLRwSaDjP3GCox2aSL9Zm9KAfk5jL451HZ5RnWdwnFYJJAE1jEePfegeFaDz64A032MNpKZdEY4l5sIeFBDalFVPRyZ5hudiSqJQc2kkIJneDZ3BebBVeLNCEr85NKI1gtZxAq8JrpZw51JV02f+DmsoJNPqXegr/QEnqE32eNGmBn48cAAAAAElFTkSuQmCC';

function createPlayersIcon(doc: Document): HTMLImageElement {
  const img = doc.createElement('img');
  img.src = PLAYERS_ICON_DATA_URI;
  img.alt = '';
  img.draggable = false;
  img.style.width = '28px';
  img.style.height = 'auto';
  img.style.display = 'block';
  img.style.flexShrink = '0';
  return img;
}

export function updateBadgeValue(badge: HTMLElement, playerCount: PlayerCount): void {
  const color = colorForPlayerCount(playerCount.count);
  applyColor(badge, color);

  const valueSpan = badge.querySelector('[data-playercount-value="true"]') as HTMLElement | null;
  if (valueSpan) {
    valueSpan.textContent = playerCount.formatted;
    applyColor(valueSpan, color);
  }
}

export function createBadge(playerCount: PlayerCount, appId: number, doc: Document): HTMLElement {
  const color = colorForPlayerCount(playerCount.count);

  const tile = doc.createElement('div');
  tile.id = BADGE_ID;
  tile.className = [c('GameStat'), c('GameStatWithIcon')].filter(Boolean).join(' ');
  applyColor(tile, color);
  tile.style.cursor = 'pointer';
  tile.style.pointerEvents = 'auto';
  tile.title = 'Open SteamDB charts';
  tile.setAttribute('role', 'button');
  tile.setAttribute('tabindex', '0');
  tile.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    openSteamDbCharts(appId);
  });
  tile.addEventListener('mousedown', (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
  });
  tile.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      openSteamDbCharts(appId);
    }
  });

  const iconDiv = doc.createElement('div');
  // Style the icon container ourselves instead of reusing Steam's icon
  // classes. Those classes are version-dependent: on newer Steam clients they
  // paint the wrong glyph (a clock) instead of our people icon.
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.style.alignSelf = 'stretch';
  iconDiv.style.width = '32px';
  iconDiv.style.marginRight = '8px';
  iconDiv.style.flexShrink = '0';
  iconDiv.appendChild(createPlayersIcon(doc));

  const rightDiv = doc.createElement('div');
  rightDiv.className = c('GameStatRight');

  const labelSpan = doc.createElement('span');
  labelSpan.className = c('PlayBarLabel');
  labelSpan.textContent = 'PLAYERS';

  const valueSpan = doc.createElement('span');
  valueSpan.className = c('PlayBarDetailLabel');
  valueSpan.setAttribute('data-playercount-value', 'true');
  valueSpan.textContent = playerCount.formatted;
  applyColor(valueSpan, color);

  rightDiv.appendChild(labelSpan);
  rightDiv.appendChild(valueSpan);

  tile.appendChild(iconDiv);
  tile.appendChild(rightDiv);

  return tile;
}
