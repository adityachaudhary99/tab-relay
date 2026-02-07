import { StorageService } from '../storage-service';
import { SavedTabGroup } from '../../types/models';

function makeGroup(overrides: Partial<SavedTabGroup> = {}): SavedTabGroup {
  return {
    id: 'test-id-1',
    name: 'Test Group',
    color: 'blue' as chrome.tabGroups.ColorEnum,
    collapsed: false,
    tabs: [{ url: 'https://example.com', title: 'Example', pinned: false }],
    savedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    // Reset mock storage
    (chrome.storage.local.get as jest.Mock).mockImplementation((keys: string | string[]) => {
      return Promise.resolve({});
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation(() => Promise.resolve());
  });

  it('returns empty array when no groups saved', async () => {
    const groups = await service.getSavedGroups();
    expect(groups).toEqual([]);
  });

  it('saves and retrieves a group', async () => {
    const group = makeGroup();
    let stored: SavedTabGroup[] = [];

    (chrome.storage.local.set as jest.Mock).mockImplementation((items: Record<string, unknown>) => {
      stored = items['savedGroups'] as SavedTabGroup[];
      return Promise.resolve();
    });
    (chrome.storage.local.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ savedGroups: stored });
    });

    await service.saveGroup(group);
    const groups = await service.getSavedGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('test-id-1');
  });

  it('deletes a group', async () => {
    const group = makeGroup();
    let stored: SavedTabGroup[] = [group];

    (chrome.storage.local.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ savedGroups: stored });
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation((items: Record<string, unknown>) => {
      stored = items['savedGroups'] as SavedTabGroup[];
      return Promise.resolve();
    });

    await service.deleteGroup('test-id-1');
    expect(stored).toHaveLength(0);
  });

  it('updates a group', async () => {
    const group = makeGroup();
    let stored: SavedTabGroup[] = [group];

    (chrome.storage.local.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ savedGroups: stored });
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation((items: Record<string, unknown>) => {
      stored = items['savedGroups'] as SavedTabGroup[];
      return Promise.resolve();
    });

    await service.updateGroup('test-id-1', { name: 'Renamed' });
    expect(stored[0].name).toBe('Renamed');
  });

  it('throws on update of non-existent group', async () => {
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({ savedGroups: [] });
    await expect(service.updateGroup('nope', { name: 'x' })).rejects.toThrow('not found');
  });

  it('addGroups skips duplicates', async () => {
    const group = makeGroup();
    let stored: SavedTabGroup[] = [group];

    (chrome.storage.local.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ savedGroups: stored });
    });
    (chrome.storage.local.set as jest.Mock).mockImplementation((items: Record<string, unknown>) => {
      stored = items['savedGroups'] as SavedTabGroup[];
      return Promise.resolve();
    });

    const added = await service.addGroups([group, makeGroup({ id: 'test-id-2', name: 'New' })]);
    expect(added).toBe(1);
    expect(stored).toHaveLength(2);
  });
});
