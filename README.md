# Tab Relay

Relay your tabs effortlessly—copy, save, restore, merge, split, and share tab groups across Chromium browsers.

Transfer tab groups between Chrome, Edge, Brave, Opera, Arc, Comet, and any other Chromium-based browser via the OS clipboard — preserving group name, color, and all tabs.

## Features

- **Copy & Paste** — Copy a tab group to the OS clipboard and paste it in any Chromium browser
- **Save & Restore** — Save tab groups locally for later use
- **Merge** — Combine multiple tab groups into one with a custom name and color
- **Split** — Move selected tabs out of a group into a new group
- **Import & Export** — Share tab groups as JSON files
- **Cross-window** — View and manage tab groups from all open windows

## Install

### From source (developer mode)

```bash
git clone https://github.com/adityachaudhary99/tab-relay.git
cd tab-relay
npm install
npm run build
```

1. Open `chrome://extensions` in your browser
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the project root folder (the one containing `manifest.json`)

### From release

1. Download the latest `.zip` from [Releases](https://github.com/adityachaudhary99/tab-relay/releases)
2. Extract it
3. Load it as an unpacked extension (steps above)

## Usage

### Copy a tab group to another browser

1. Click the extension icon in browser A
2. Find the group under **Current Window** and click **Copy**
3. Open browser B, click the extension icon, and click **Paste Group from Clipboard**

The group is recreated with the same name, color, and tabs.

### Merge tab groups

1. Check the boxes next to 2 or more groups in **Current Window**
2. A merge bar appears — enter a name, pick a color, and click **Merge**

### Split a tab group

1. Click **Split** on any group in **Current Window**
2. Select the tabs you want to split off
3. Enter a name and color for the new group, then click **Split**

### Save, restore, import, export

- **Save** — Click **Save** on any group to store it locally
- **Open** — Click **Open** on a saved group to restore it
- **Export All** — Download all saved groups as a JSON file
- **Import File** — Load groups from a JSON file

## Permissions

| Permission | Why |
|---|---|
| `tabGroups` | Read and modify tab group names, colors, membership |
| `tabs` | Query tabs and create new ones on paste/restore |
| `contextMenus` | Right-click context menu for quick save |
| `storage` | Persist saved groups in `chrome.storage.local` |
| `activeTab` | Access the active tab's window for group queries |
| `clipboardRead` | Read tab group data from OS clipboard on paste |
| `clipboardWrite` | Write tab group data to OS clipboard on copy |

## Supported Browsers

Any Chromium-based browser with `chrome.tabGroups` API support (Chrome 89+):

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Arc
- Comet
- Vivaldi

Firefox and Safari do not support tab groups APIs and are not compatible.

## Project Structure

```
tab-relay/
  src/
    background/       Service worker (message routing, context menus)
    popup/            Popup UI (HTML, CSS, TypeScript)
    services/         Storage and tab group business logic
    types/            TypeScript interfaces and message types
    utils/            Helpers (validation, color map, ID generation)
    __mocks__/        Jest mock for Chrome APIs
  scripts/            Packaging script
  icons/              Extension icons (16, 32, 48, 128)
  dist/               Build output (gitignored)
```

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (auto-rebuild on changes)
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint TypeScript
npm run package      # Build + create zip for distribution
```

## License

[MIT](LICENSE)
