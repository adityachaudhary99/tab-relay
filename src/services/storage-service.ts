import { SavedTabGroup } from '../types/models';

const STORAGE_KEY = 'savedGroups';

export class StorageService {
  async getSavedGroups(): Promise<SavedTabGroup[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return (result[STORAGE_KEY] as SavedTabGroup[]) || [];
  }

  async saveGroup(group: SavedTabGroup): Promise<void> {
    const groups = await this.getSavedGroups();
    groups.push(group);
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
  }

  async updateGroup(id: string, updates: Partial<SavedTabGroup>): Promise<void> {
    const groups = await this.getSavedGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index === -1) throw new Error(`Group ${id} not found`);
    groups[index] = { ...groups[index], ...updates, updatedAt: new Date().toISOString() };
    await chrome.storage.local.set({ [STORAGE_KEY]: groups });
  }

  async deleteGroup(id: string): Promise<void> {
    const groups = await this.getSavedGroups();
    const filtered = groups.filter(g => g.id !== id);
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
  }

  async addGroups(newGroups: SavedTabGroup[]): Promise<number> {
    const existing = await this.getSavedGroups();
    const existingIds = new Set(existing.map(g => g.id));
    const toAdd = newGroups.filter(g => !existingIds.has(g.id));
    if (toAdd.length > 0) {
      await chrome.storage.local.set({ [STORAGE_KEY]: [...existing, ...toAdd] });
    }
    return toAdd.length;
  }
}
