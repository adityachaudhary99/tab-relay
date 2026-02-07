# Contributing to Tab Relay

Thanks for your interest in contributing! Here's how to get started.

## Reporting Bugs

1. Check [existing issues](https://github.com/adityachaudhary99/tab-relay/issues) to avoid duplicates
2. Open a new issue with:
   - Browser name and version (e.g., Chrome 120, Brave 1.62)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

## Suggesting Features

Open an issue describing:
- The use case
- How it might work from a user's perspective
- Any technical considerations

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- A Chromium-based browser

### Getting started

```bash
git clone https://github.com/adityachaudhary99/tab-relay.git
cd tab-relay
npm install
npm run build
```

Load the extension in developer mode:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the project root

### Development workflow

```bash
npm run dev          # Watch mode — rebuilds on file changes
npm test             # Run Jest tests
npm run lint         # Lint TypeScript
npm run build        # Production build
```

After making changes, go to `chrome://extensions` and click the refresh icon on the extension card.

## Code Style

- **TypeScript** — strict mode, no `any` unless unavoidable
- **No runtime dependencies** — only Chrome APIs and Web APIs
- **ESLint** — run `npm run lint` before committing

## Project Architecture

```
src/
  types/models.ts          Interfaces, message types (change here first)
  services/
    tab-group-service.ts   Core business logic (snapshot, copy, paste, merge, split)
    storage-service.ts     Chrome storage CRUD
  background/
    service-worker.ts      Message routing, context menus
  popup/
    popup.ts               Popup UI logic
    popup.html             Popup markup
    popup.css              Popup styles
  utils/                   Helpers (validation, color map, IDs)
```

### Adding a new action

1. Add the message type to `src/types/models.ts`
2. Implement the logic in the appropriate service
3. Add the handler in `src/background/service-worker.ts`
4. Add UI controls in `src/popup/popup.ts` and `popup.html`/`popup.css`
5. Write tests
6. Update `CHANGELOG.md`

## Pull Request Process

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Ensure `npm test` and `npm run lint` pass
5. Ensure `npm run build` succeeds
6. Commit with a clear message
7. Push and open a PR against `main`

### PR guidelines

- Keep PRs focused — one feature or fix per PR
- Update `CHANGELOG.md` under an `[Unreleased]` section
- Add tests for new functionality
- Don't bump the version number — maintainers handle releases

## Testing

Tests live alongside the code they test:

```
src/services/__tests__/storage-service.test.ts
src/utils/__tests__/validation.test.ts
```

We use Jest with ts-jest. The Chrome API mock is in `src/__mocks__/chrome.ts`.

```bash
npm test                    # Run all tests
npx jest --watch            # Watch mode
npx jest --coverage         # With coverage report
```

## Release Process (Maintainers)

1. Update `CHANGELOG.md` — move `[Unreleased]` items under a new version heading
2. Bump version in `package.json` and `manifest.json`
3. Commit: `git commit -m "v1.x.x: description"`
4. Tag: `git tag -a v1.x.x -m "v1.x.x: description"`
5. Push: `git push origin main && git push origin v1.x.x`
6. GitHub Actions builds the zip and creates a release automatically
