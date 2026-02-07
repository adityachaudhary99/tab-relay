import { Message, MessageResponse, SavedTabGroup, ExportPayload } from '../types/models';
import { colorToHex } from '../utils/color-map';
import { validateExportPayload } from '../utils/validation';

// --- DOM References ---

const currentGroupsEl = document.getElementById('current-groups')!;
const allGroupsEl = document.getElementById('all-groups')!;
const allGroupsSection = document.getElementById('all-groups-section')!;
const savedGroupsEl = document.getElementById('saved-groups')!;
const mergeBar = document.getElementById('merge-bar')!;
const mergeNameInput = document.getElementById('merge-name') as HTMLInputElement;
const mergeColorSelect = document.getElementById('merge-color') as HTMLSelectElement;
const mergeBtn = document.getElementById('merge-btn') as HTMLButtonElement;
const pasteBtn = document.getElementById('paste-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const exportAllBtn = document.getElementById('export-all-btn') as HTMLButtonElement;
const importFileInput = document.getElementById('import-file') as HTMLInputElement;
const toastEl = document.getElementById('toast')!;

// --- Messaging ---

function sendMessage(msg: Message): Promise<MessageResponse> {
  return chrome.runtime.sendMessage(msg);
}

// --- Toast ---

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(text: string, isError = false) {
  toastEl.textContent = text;
  toastEl.className = isError ? 'toast error' : 'toast';
  toastEl.style.display = 'block';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = 'none'; }, 2500);
}

// --- OS Clipboard Helpers ---

async function copyToClipboard(group: SavedTabGroup): Promise<void> {
  const payload: ExportPayload = {
    version: 1,
    exportedBy: 'tab-group-copy',
    exportedAt: new Date().toISOString(),
    groups: [group],
  };
  await navigator.clipboard.writeText(JSON.stringify(payload));
}

async function readFromClipboard(): Promise<ExportPayload | null> {
  try {
    const text = await navigator.clipboard.readText();
    const parsed = JSON.parse(text);
    const result = validateExportPayload(parsed);
    if (result.valid && result.payload) return result.payload;
    return null;
  } catch {
    return null;
  }
}

// --- Merge selection state ---

const mergeSelection = new Set<number>();

function updateMergeBar() {
  if (mergeSelection.size >= 2) {
    mergeBar.style.display = 'flex';
    mergeBtn.textContent = `Merge ${mergeSelection.size} groups`;
  } else {
    mergeBar.style.display = 'none';
  }
}

mergeBtn.addEventListener('click', async () => {
  const name = mergeNameInput.value.trim();
  if (!name) {
    showToast('Enter a name for the merged group', true);
    mergeNameInput.focus();
    return;
  }
  const color = mergeColorSelect.value as chrome.tabGroups.ColorEnum;
  const groupIds = Array.from(mergeSelection);

  const res = await sendMessage({ action: 'MERGE_GROUPS', groupIds, name, color });
  if (res.success) {
    showToast(`Merged into "${name}"`);
    mergeSelection.clear();
    updateMergeBar();
    mergeNameInput.value = '';
    await renderCurrentGroups();
    renderAllGroups();
  } else {
    showToast(res.error, true);
  }
});

// --- Shared: bind copy/save/split buttons on a group card list ---

function bindGroupCardButtons(container: HTMLElement, showMergeCheckbox: boolean) {
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupId = Number((btn as HTMLElement).dataset.groupId);
      const res = await sendMessage({ action: 'SNAPSHOT_GROUP', groupId });
      if (res.success) {
        const snapshot = res.data as SavedTabGroup;
        try {
          await copyToClipboard(snapshot);
          showToast(`Copied "${snapshot.name}" to clipboard`);
          (btn as HTMLElement).textContent = 'Copied!';
          setTimeout(() => { (btn as HTMLElement).textContent = 'Copy'; }, 1500);
        } catch {
          showToast('Failed to write to clipboard', true);
        }
      } else {
        showToast(res.error, true);
      }
    });
  });

  container.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupId = Number((btn as HTMLElement).dataset.groupId);
      const res = await sendMessage({ action: 'SAVE_GROUP', groupId });
      if (res.success) {
        showToast('Group saved');
        renderSavedGroups();
      } else {
        showToast(res.error, true);
      }
    });
  });

  // Merge checkboxes
  if (showMergeCheckbox) {
    container.querySelectorAll('.merge-checkbox').forEach(cb => {
      (cb as HTMLInputElement).checked = mergeSelection.has(Number((cb as HTMLElement).dataset.groupId));
      cb.addEventListener('change', () => {
        const groupId = Number((cb as HTMLElement).dataset.groupId);
        if ((cb as HTMLInputElement).checked) {
          mergeSelection.add(groupId);
        } else {
          mergeSelection.delete(groupId);
        }
        updateMergeBar();
      });
    });
  }

  // Split buttons
  container.querySelectorAll('.split-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupId = Number((btn as HTMLElement).dataset.groupId);
      const card = (btn as HTMLElement).closest('.group-card')!;
      const existing = card.querySelector('.split-panel');
      if (existing) {
        existing.remove();
        return;
      }
      await showSplitPanel(card as HTMLElement, groupId);
    });
  });
}

// --- Split Panel ---

async function showSplitPanel(card: HTMLElement, groupId: number) {
  const res = await sendMessage({ action: 'GET_GROUP_TABS', groupId });
  if (!res.success) {
    showToast(res.error, true);
    return;
  }

  const tabs = res.data as chrome.tabs.Tab[];
  if (tabs.length < 2) {
    showToast('Need at least 2 tabs to split', true);
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'split-panel';

  let tabListHtml = '';
  for (const tab of tabs) {
    tabListHtml += `
      <label class="tab-row">
        <input type="checkbox" class="split-tab-cb" data-tab-id="${tab.id}" />
        <img class="tab-favicon" src="${tab.favIconUrl || ''}" alt="" />
        <span class="tab-title">${escapeHtml(tab.title || tab.url || '')}</span>
      </label>
    `;
  }

  panel.innerHTML = `
    <div class="split-header">Select tabs to split off:</div>
    <div class="split-tabs">${tabListHtml}</div>
    <div class="split-controls">
      <input type="text" class="split-name-input" placeholder="New group name" />
      <select class="split-color-select">
        <option value="grey">Grey</option>
        <option value="blue" selected>Blue</option>
        <option value="red">Red</option>
        <option value="yellow">Yellow</option>
        <option value="green">Green</option>
        <option value="pink">Pink</option>
        <option value="purple">Purple</option>
        <option value="cyan">Cyan</option>
        <option value="orange">Orange</option>
      </select>
      <button class="btn do-split-btn">Split</button>
    </div>
  `;

  card.appendChild(panel);

  panel.querySelector('.do-split-btn')!.addEventListener('click', async () => {
    const checked = panel.querySelectorAll('.split-tab-cb:checked');
    if (checked.length === 0) {
      showToast('Select tabs to split off', true);
      return;
    }
    if (checked.length === tabs.length) {
      showToast('Cannot split all tabs — leave at least one', true);
      return;
    }

    const tabIds = Array.from(checked).map(cb => Number((cb as HTMLElement).dataset.tabId));
    const name = (panel.querySelector('.split-name-input') as HTMLInputElement).value.trim() || 'Split';
    const color = (panel.querySelector('.split-color-select') as HTMLSelectElement).value as chrome.tabGroups.ColorEnum;

    const splitRes = await sendMessage({ action: 'SPLIT_TABS', tabIds, name, color });
    if (splitRes.success) {
      showToast(`Split ${tabIds.length} tab(s) into "${name}"`);
      await renderCurrentGroups();
      renderAllGroups();
    } else {
      showToast(splitRes.error, true);
    }
  });
}

function renderGroupCard(group: chrome.tabGroups.TabGroup, tabCount: number, showMerge: boolean): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'group-card';
  const checkboxHtml = showMerge
    ? `<input type="checkbox" class="merge-checkbox" data-group-id="${group.id}" />`
    : '';
  card.innerHTML = `
    ${checkboxHtml}
    <span class="color-dot" style="background: ${colorToHex(group.color)}"></span>
    <div class="group-info">
      <div class="group-name">${escapeHtml(group.title || 'Untitled')}</div>
      <div class="group-meta">${tabCount} tabs</div>
    </div>
    <div class="group-actions">
      <button class="btn copy-btn" data-group-id="${group.id}">Copy</button>
      <button class="btn save-btn" data-group-id="${group.id}">Save</button>
      ${showMerge ? `<button class="btn split-btn" data-group-id="${group.id}">Split</button>` : ''}
    </div>
  `;
  return card;
}

// --- Render Current Window Groups ---

let currentWindowGroupIds = new Set<number>();

async function renderCurrentGroups() {
  const res = await sendMessage({ action: 'GET_ACTIVE_TAB_GROUPS' });
  if (!res.success) {
    currentGroupsEl.innerHTML = '<p class="empty-state">Failed to load groups</p>';
    return;
  }

  const groups = res.data as chrome.tabGroups.TabGroup[];
  currentWindowGroupIds = new Set(groups.map(g => g.id));

  // Clean stale merge selections
  for (const id of mergeSelection) {
    if (!currentWindowGroupIds.has(id)) mergeSelection.delete(id);
  }
  updateMergeBar();

  if (groups.length === 0) {
    currentGroupsEl.innerHTML = '<p class="empty-state">No tab groups in this window</p>';
    return;
  }

  const tabCounts = new Map<number, number>();
  for (const group of groups) {
    const tabs = await chrome.tabs.query({ groupId: group.id });
    tabCounts.set(group.id, tabs.length);
  }

  currentGroupsEl.innerHTML = '';
  for (const group of groups) {
    currentGroupsEl.appendChild(renderGroupCard(group, tabCounts.get(group.id) || 0, true));
  }
  bindGroupCardButtons(currentGroupsEl, true);
}

// --- Render All Tab Groups (from other windows) ---

async function renderAllGroups() {
  const res = await sendMessage({ action: 'GET_ALL_TAB_GROUPS' });
  if (!res.success) {
    allGroupsSection.style.display = 'none';
    return;
  }

  const allGroups = res.data as chrome.tabGroups.TabGroup[];
  const otherGroups = allGroups.filter(g => !currentWindowGroupIds.has(g.id));

  if (otherGroups.length === 0) {
    allGroupsSection.style.display = 'none';
    return;
  }

  allGroupsSection.style.display = '';
  const tabCounts = new Map<number, number>();
  for (const group of otherGroups) {
    const tabs = await chrome.tabs.query({ groupId: group.id });
    tabCounts.set(group.id, tabs.length);
  }

  allGroupsEl.innerHTML = '';
  for (const group of otherGroups) {
    const card = renderGroupCard(group, tabCounts.get(group.id) || 0, false);
    const meta = card.querySelector('.group-meta')!;
    meta.textContent = `${tabCounts.get(group.id) || 0} tabs · Window ${group.windowId}`;
    allGroupsEl.appendChild(card);
  }
  bindGroupCardButtons(allGroupsEl, false);
}

// --- Render Saved Groups ---

async function renderSavedGroups() {
  const res = await sendMessage({ action: 'GET_SAVED_GROUPS' });
  if (!res.success) {
    savedGroupsEl.innerHTML = '<p class="empty-state">Failed to load saved groups</p>';
    return;
  }

  const groups = res.data as SavedTabGroup[];
  if (groups.length === 0) {
    savedGroupsEl.innerHTML = '<p class="empty-state">No saved groups yet</p>';
    exportAllBtn.style.display = 'none';
    return;
  }

  exportAllBtn.style.display = '';
  savedGroupsEl.innerHTML = '';

  for (const group of groups) {
    const date = new Date(group.savedAt).toLocaleDateString();
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
      <span class="color-dot" style="background: ${colorToHex(group.color)}"></span>
      <div class="group-info">
        <div class="group-name" data-id="${group.id}">${escapeHtml(group.name)}</div>
        <div class="group-meta">${group.tabs.length} tabs · ${date}</div>
      </div>
      <div class="group-actions">
        <button class="btn restore-btn" data-id="${group.id}">Open</button>
        <button class="btn copy-saved-btn" data-id="${group.id}">Copy</button>
        <button class="btn danger delete-btn" data-id="${group.id}">Del</button>
      </div>
    `;
    savedGroupsEl.appendChild(card);
  }

  savedGroupsEl.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id!;
      const res = await sendMessage({ action: 'RESTORE_GROUP', savedGroupId: id });
      if (res.success) {
        showToast('Group opened');
        renderCurrentGroups();
      } else {
        showToast(res.error, true);
      }
    });
  });

  savedGroupsEl.querySelectorAll('.copy-saved-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id!;
      const group = groups.find(g => g.id === id);
      if (group) {
        try {
          await copyToClipboard(group);
          showToast(`Copied "${group.name}" to clipboard`);
        } catch {
          showToast('Failed to write to clipboard', true);
        }
      }
    });
  });

  savedGroupsEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id!;
      const res = await sendMessage({ action: 'DELETE_GROUP', savedGroupId: id });
      if (res.success) {
        showToast('Deleted');
        renderSavedGroups();
      } else {
        showToast(res.error, true);
      }
    });
  });
}

// --- Paste from OS Clipboard ---

pasteBtn.addEventListener('click', async () => {
  const payload = await readFromClipboard();
  if (!payload || payload.groups.length === 0) {
    showToast('No tab group data in clipboard', true);
    return;
  }

  for (const group of payload.groups) {
    const res = await sendMessage({ action: 'PASTE_GROUP_DATA', group });
    if (res.success) {
      showToast(`Pasted "${group.name}"`);
    } else {
      showToast(res.error, true);
    }
  }
  renderCurrentGroups();
});

// --- Import / Export ---

importBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const res = await sendMessage({ action: 'IMPORT_GROUPS', payload });
    if (res.success) {
      const result = res.data as { imported: number; error?: string };
      if (result.error) {
        showToast(result.error, true);
      } else {
        showToast(`Imported ${result.imported} group(s)`);
        renderSavedGroups();
      }
    } else {
      showToast(res.error, true);
    }
  } catch {
    showToast('Invalid JSON file', true);
  }

  importFileInput.value = '';
});

exportAllBtn.addEventListener('click', async () => {
  const res = await sendMessage({ action: 'GET_SAVED_GROUPS' });
  if (!res.success) {
    showToast(res.error, true);
    return;
  }
  const groups = res.data as SavedTabGroup[];
  const ids = groups.map(g => g.id);
  const exportRes = await sendMessage({ action: 'EXPORT_GROUPS', groupIds: ids });
  if (exportRes.success) {
    downloadJson(exportRes.data as ExportPayload);
    showToast('All groups exported');
  } else {
    showToast(exportRes.error, true);
  }
});

// --- Helpers ---

function downloadJson(payload: ExportPayload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tab-groups-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
  await renderCurrentGroups();
  renderAllGroups();
  renderSavedGroups();
});
