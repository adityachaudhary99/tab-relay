import { ExportPayload, SavedTabGroup, SavedTab } from '../types/models';
import { isValidColor } from './color-map';

const RESTRICTED_PROTOCOLS = ['chrome://', 'chrome-extension://', 'file://', 'about:'];

export function isRestrictedUrl(url: string): boolean {
  return RESTRICTED_PROTOCOLS.some(p => url.startsWith(p));
}

function isValidTab(tab: unknown): tab is SavedTab {
  if (!tab || typeof tab !== 'object') return false;
  const t = tab as Record<string, unknown>;
  return typeof t.url === 'string' && typeof t.title === 'string';
}

function isValidGroup(group: unknown): group is SavedTabGroup {
  if (!group || typeof group !== 'object') return false;
  const g = group as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    typeof g.name === 'string' &&
    typeof g.color === 'string' &&
    isValidColor(g.color) &&
    Array.isArray(g.tabs) &&
    g.tabs.length > 0 &&
    g.tabs.every(isValidTab)
  );
}

export interface ValidationResult {
  valid: boolean;
  payload?: ExportPayload;
  error?: string;
}

export function validateExportPayload(data: unknown): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON structure' };
  }

  const d = data as Record<string, unknown>;

  if (d.version !== 1) {
    return { valid: false, error: 'Unsupported version' };
  }

  if (d.exportedBy !== 'tab-group-copy') {
    return { valid: false, error: 'Not a Tab Group Copy export file' };
  }

  if (!Array.isArray(d.groups) || d.groups.length === 0) {
    return { valid: false, error: 'No groups found in file' };
  }

  for (let i = 0; i < d.groups.length; i++) {
    if (!isValidGroup(d.groups[i])) {
      return { valid: false, error: `Invalid group at index ${i}` };
    }
  }

  // Strip restricted URLs from tabs
  const sanitizedGroups: SavedTabGroup[] = (d.groups as SavedTabGroup[]).map(group => ({
    ...group,
    tabs: group.tabs.filter(tab => !isRestrictedUrl(tab.url)),
  })).filter(group => group.tabs.length > 0);

  if (sanitizedGroups.length === 0) {
    return { valid: false, error: 'No importable tabs (all URLs are restricted)' };
  }

  return {
    valid: true,
    payload: {
      version: 1,
      exportedBy: 'tab-group-copy',
      exportedAt: typeof d.exportedAt === 'string' ? d.exportedAt : new Date().toISOString(),
      groups: sanitizedGroups,
    },
  };
}
