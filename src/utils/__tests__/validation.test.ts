import { validateExportPayload, isRestrictedUrl } from '../validation';

describe('isRestrictedUrl', () => {
  it('blocks chrome:// URLs', () => {
    expect(isRestrictedUrl('chrome://settings')).toBe(true);
  });

  it('blocks chrome-extension:// URLs', () => {
    expect(isRestrictedUrl('chrome-extension://abc/popup.html')).toBe(true);
  });

  it('blocks file:// URLs', () => {
    expect(isRestrictedUrl('file:///home/user/doc.html')).toBe(true);
  });

  it('blocks about: URLs', () => {
    expect(isRestrictedUrl('about:blank')).toBe(true);
  });

  it('allows https URLs', () => {
    expect(isRestrictedUrl('https://example.com')).toBe(false);
  });

  it('allows http URLs', () => {
    expect(isRestrictedUrl('http://localhost:3000')).toBe(false);
  });
});

describe('validateExportPayload', () => {
  const validPayload = {
    version: 1,
    exportedBy: 'tab-group-copy',
    exportedAt: '2026-01-01T00:00:00.000Z',
    groups: [
      {
        id: 'abc-123',
        name: 'Research',
        color: 'blue',
        collapsed: false,
        tabs: [
          { url: 'https://example.com', title: 'Example', pinned: false },
        ],
        savedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  };

  it('accepts a valid payload', () => {
    const result = validateExportPayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.payload?.groups).toHaveLength(1);
  });

  it('rejects null input', () => {
    const result = validateExportPayload(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid JSON structure');
  });

  it('rejects wrong version', () => {
    const result = validateExportPayload({ ...validPayload, version: 99 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Unsupported version');
  });

  it('rejects wrong exportedBy', () => {
    const result = validateExportPayload({ ...validPayload, exportedBy: 'other' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not a Tab Group Copy export file');
  });

  it('rejects empty groups array', () => {
    const result = validateExportPayload({ ...validPayload, groups: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No groups found in file');
  });

  it('rejects invalid group (missing name)', () => {
    const result = validateExportPayload({
      ...validPayload,
      groups: [{ id: 'x', color: 'blue', tabs: [{ url: 'https://a.com', title: 'A' }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid group');
  });

  it('rejects invalid color', () => {
    const result = validateExportPayload({
      ...validPayload,
      groups: [{
        ...validPayload.groups[0],
        color: 'neon',
      }],
    });
    expect(result.valid).toBe(false);
  });

  it('strips restricted URLs from tabs', () => {
    const payload = {
      ...validPayload,
      groups: [{
        ...validPayload.groups[0],
        tabs: [
          { url: 'https://example.com', title: 'Good', pinned: false },
          { url: 'chrome://settings', title: 'Bad', pinned: false },
        ],
      }],
    };
    const result = validateExportPayload(payload);
    expect(result.valid).toBe(true);
    expect(result.payload?.groups[0].tabs).toHaveLength(1);
    expect(result.payload?.groups[0].tabs[0].url).toBe('https://example.com');
  });

  it('rejects when all tabs are restricted', () => {
    const payload = {
      ...validPayload,
      groups: [{
        ...validPayload.groups[0],
        tabs: [
          { url: 'chrome://settings', title: 'Bad', pinned: false },
        ],
      }],
    };
    const result = validateExportPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No importable tabs (all URLs are restricted)');
  });
});
