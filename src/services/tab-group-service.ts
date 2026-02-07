import { SavedTabGroup, SavedTab, ExportPayload } from '../types/models';
import { StorageService } from './storage-service';
import { generateId } from '../utils/id-generator';
import { isRestrictedUrl, validateExportPayload } from '../utils/validation';

export class TabGroupService {
  constructor(private storage: StorageService) {}

  async snapshotGroup(groupId: number): Promise<SavedTabGroup> {
    const group = await chrome.tabGroups.get(groupId);
    const tabs = await chrome.tabs.query({ groupId });

    const savedTabs: SavedTab[] = tabs.map(tab => ({
      url: tab.url || tab.pendingUrl || '',
      title: tab.title || '',
      pinned: tab.pinned || false,
      favIconUrl: tab.favIconUrl,
    }));

    const now = new Date().toISOString();
    return {
      id: generateId(),
      name: group.title || 'Untitled',
      color: group.color,
      collapsed: group.collapsed,
      tabs: savedTabs,
      savedAt: now,
      updatedAt: now,
    };
  }

  async saveGroup(groupId: number): Promise<SavedTabGroup> {
    const tabs = await chrome.tabs.query({ groupId });
    if (tabs.length === 0) throw new Error('Cannot save an empty group');

    const snapshot = await this.snapshotGroup(groupId);
    await this.storage.saveGroup(snapshot);
    return snapshot;
  }

  async restoreGroup(savedGroupId: string, windowId?: number): Promise<number> {
    const groups = await this.storage.getSavedGroups();
    const savedGroup = groups.find(g => g.id === savedGroupId);
    if (!savedGroup) throw new Error(`Group ${savedGroupId} not found`);

    const targetWindowId = windowId ?? (await chrome.windows.getCurrent()).id!;
    return this.createGroupInWindow(savedGroup, targetWindowId);
  }

  async pasteGroupData(group: SavedTabGroup): Promise<number> {
    const win = await chrome.windows.getCurrent();
    return this.createGroupInWindow(group, win.id!);
  }

  async deleteGroup(savedGroupId: string): Promise<void> {
    await this.storage.deleteGroup(savedGroupId);
  }

  async renameGroup(savedGroupId: string, newName: string): Promise<void> {
    await this.storage.updateGroup(savedGroupId, { name: newName });
  }

  async getSavedGroups(): Promise<SavedTabGroup[]> {
    return this.storage.getSavedGroups();
  }

  async getWindowGroups(windowId: number): Promise<chrome.tabGroups.TabGroup[]> {
    return chrome.tabGroups.query({ windowId });
  }

  exportGroups(groups: SavedTabGroup[]): ExportPayload {
    return {
      version: 1,
      exportedBy: 'tab-group-copy',
      exportedAt: new Date().toISOString(),
      groups,
    };
  }

  async importGroups(raw: unknown): Promise<{ imported: number; error?: string }> {
    const result = validateExportPayload(raw);
    if (!result.valid || !result.payload) {
      return { imported: 0, error: result.error };
    }
    const count = await this.storage.addGroups(result.payload.groups);
    return { imported: count };
  }

  async mergeGroups(groupIds: number[], name: string, color: chrome.tabGroups.ColorEnum): Promise<number> {
    if (groupIds.length < 2) throw new Error('Select at least 2 groups to merge');

    // Collect all tab IDs from all groups
    const allTabIds: number[] = [];
    for (const gid of groupIds) {
      const tabs = await chrome.tabs.query({ groupId: gid });
      for (const tab of tabs) {
        if (tab.id) allTabIds.push(tab.id);
      }
    }

    if (allTabIds.length === 0) throw new Error('No tabs to merge');

    // Move all tabs into one group (using the first group as target)
    const targetGroupId = groupIds[0];
    await chrome.tabs.group({ tabIds: allTabIds, groupId: targetGroupId });
    await chrome.tabGroups.update(targetGroupId, { title: name, color });

    return targetGroupId;
  }

  async splitTabs(tabIds: number[], name: string, color: chrome.tabGroups.ColorEnum): Promise<number> {
    if (tabIds.length === 0) throw new Error('No tabs selected to split');

    const newGroupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(newGroupId, { title: name, color });

    return newGroupId;
  }

  async getGroupTabs(groupId: number): Promise<chrome.tabs.Tab[]> {
    return chrome.tabs.query({ groupId });
  }

  async createGroupInWindow(savedGroup: SavedTabGroup, windowId: number): Promise<number> {
    const validTabs = savedGroup.tabs.filter(t => t.url && !isRestrictedUrl(t.url));
    if (validTabs.length === 0) throw new Error('No valid tabs to create');

    const createdTabIds: number[] = [];
    for (const tab of validTabs) {
      const created = await chrome.tabs.create({
        url: tab.url,
        windowId,
        pinned: tab.pinned,
        active: false,
      });
      if (created.id) createdTabIds.push(created.id);
    }

    const newGroupId = await chrome.tabs.group({
      tabIds: createdTabIds,
      createProperties: { windowId },
    });

    await chrome.tabGroups.update(newGroupId, {
      title: savedGroup.name,
      color: savedGroup.color,
      collapsed: savedGroup.collapsed,
    });

    return newGroupId;
  }
}
