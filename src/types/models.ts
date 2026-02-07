export interface SavedTab {
  url: string;
  title: string;
  pinned: boolean;
  favIconUrl?: string;
}

export interface SavedTabGroup {
  id: string;
  name: string;
  color: chrome.tabGroups.ColorEnum;
  collapsed: boolean;
  tabs: SavedTab[];
  savedAt: string;
  updatedAt: string;
}

export interface ExportPayload {
  version: 1;
  exportedBy: 'tab-group-copy';
  exportedAt: string;
  groups: SavedTabGroup[];
}

export type Message =
  | { action: 'GET_SAVED_GROUPS' }
  | { action: 'SAVE_GROUP'; groupId: number }
  | { action: 'RESTORE_GROUP'; savedGroupId: string; windowId?: number }
  | { action: 'DELETE_GROUP'; savedGroupId: string }
  | { action: 'RENAME_GROUP'; savedGroupId: string; newName: string }
  | { action: 'EXPORT_GROUPS'; groupIds: string[] }
  | { action: 'IMPORT_GROUPS'; payload: ExportPayload }
  | { action: 'SNAPSHOT_GROUP'; groupId: number }
  | { action: 'PASTE_GROUP_DATA'; group: SavedTabGroup }
  | { action: 'GET_ACTIVE_TAB_GROUPS' }
  | { action: 'GET_ALL_TAB_GROUPS' }
  | { action: 'MERGE_GROUPS'; groupIds: number[]; name: string; color: chrome.tabGroups.ColorEnum }
  | { action: 'GET_GROUP_TABS'; groupId: number }
  | { action: 'SPLIT_TABS'; tabIds: number[]; name: string; color: chrome.tabGroups.ColorEnum };

export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string };
