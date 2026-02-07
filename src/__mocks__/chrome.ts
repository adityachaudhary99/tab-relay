/* eslint-disable @typescript-eslint/no-explicit-any */

const chromeMock = {
  tabGroups: {
    get: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    move: jest.fn(),
    TAB_GROUP_ID_NONE: -1,
    Color: {
      GREY: 'grey',
      BLUE: 'blue',
      RED: 'red',
      YELLOW: 'yellow',
      GREEN: 'green',
      PINK: 'pink',
      PURPLE: 'purple',
      CYAN: 'cyan',
      ORANGE: 'orange',
    },
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    group: jest.fn(),
    ungroup: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
    session: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
  },
  windows: {
    getCurrent: jest.fn(() => Promise.resolve({ id: 1 })),
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
    },
  },
};

(globalThis as any).chrome = chromeMock;
