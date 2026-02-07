import { Message, MessageResponse } from '../types/models';
import { StorageService } from '../services/storage-service';
import { TabGroupService } from '../services/tab-group-service';

const storageService = new StorageService();
const tabGroupService = new TabGroupService(storageService);

// --- Context Menus ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-active-tab-group',
    title: "Save this tab's group",
    contexts: ['action', 'page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;

  try {
    if (info.menuItemId === 'save-active-tab-group') {
      if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        await tabGroupService.saveGroup(tab.groupId);
      }
    }
  } catch (err) {
    console.error('[Tab Relay]', err);
  }
});

// --- Message Routing (Popup <-> Service Worker) ---

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
    handleMessage(message)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async response
  },
);

async function handleMessage(message: Message): Promise<unknown> {
  switch (message.action) {
    case 'GET_SAVED_GROUPS':
      return tabGroupService.getSavedGroups();

    case 'SAVE_GROUP':
      return tabGroupService.saveGroup(message.groupId);

    case 'RESTORE_GROUP':
      return tabGroupService.restoreGroup(message.savedGroupId, message.windowId);

    case 'DELETE_GROUP':
      await tabGroupService.deleteGroup(message.savedGroupId);
      return null;

    case 'RENAME_GROUP':
      await tabGroupService.renameGroup(message.savedGroupId, message.newName);
      return null;

    case 'EXPORT_GROUPS': {
      const groups = await tabGroupService.getSavedGroups();
      const toExport = groups.filter(g => message.groupIds.includes(g.id));
      return tabGroupService.exportGroups(toExport);
    }

    case 'IMPORT_GROUPS':
      return tabGroupService.importGroups(message.payload);

    case 'SNAPSHOT_GROUP':
      return tabGroupService.snapshotGroup(message.groupId);

    case 'PASTE_GROUP_DATA':
      return tabGroupService.pasteGroupData(message.group);

    case 'GET_ACTIVE_TAB_GROUPS': {
      const win = await chrome.windows.getCurrent();
      return tabGroupService.getWindowGroups(win.id!);
    }

    case 'GET_ALL_TAB_GROUPS':
      return chrome.tabGroups.query({});

    case 'MERGE_GROUPS':
      return tabGroupService.mergeGroups(message.groupIds, message.name, message.color);

    case 'GET_GROUP_TABS':
      return tabGroupService.getGroupTabs(message.groupId);

    case 'SPLIT_TABS':
      return tabGroupService.splitTabs(message.tabIds, message.name, message.color);

    default:
      throw new Error(`Unknown action: ${(message as { action: string }).action}`);
  }
}
