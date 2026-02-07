const TAB_GROUP_COLORS: chrome.tabGroups.ColorEnum[] = [
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange',
] as chrome.tabGroups.ColorEnum[];

export function isValidColor(color: string): color is chrome.tabGroups.ColorEnum {
  return TAB_GROUP_COLORS.includes(color as chrome.tabGroups.ColorEnum);
}

const COLOR_HEX_MAP: Record<string, string> = {
  grey: '#5F6368',
  blue: '#1A73E8',
  red: '#D93025',
  yellow: '#F9AB00',
  green: '#188038',
  pink: '#D01884',
  purple: '#A142F4',
  cyan: '#007B83',
  orange: '#FA903E',
};

export function colorToHex(color: chrome.tabGroups.ColorEnum): string {
  return COLOR_HEX_MAP[color] || COLOR_HEX_MAP['grey'];
}
