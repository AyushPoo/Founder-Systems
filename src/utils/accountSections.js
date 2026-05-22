export const ACCOUNT_SECTIONS = [
  { key: 'overview', label: 'Overview', queryAliases: ['overview'] },
  { key: 'workspace', label: 'Workspace', queryAliases: ['workspace', 'memory'] },
  { key: 'products', label: 'Products', queryAliases: ['products'] },
  { key: 'operators', label: 'Operators', queryAliases: ['operators'] },
  { key: 'connections', label: 'Connections', queryAliases: ['connections'] },
  { key: 'billing', label: 'Billing', queryAliases: ['billing', 'credits'] },
  { key: 'activity', label: 'Activity', queryAliases: ['activity', 'history'] },
  { key: 'settings', label: 'Settings', queryAliases: ['settings'] },
];

export const DEFAULT_ACCOUNT_SECTION = 'overview';

export function getAccountSectionFromQuery(value) {
  const normalized = String(value || '').toLowerCase();
  const match = ACCOUNT_SECTIONS.find((section) => section.queryAliases.includes(normalized));
  return match?.key || DEFAULT_ACCOUNT_SECTION;
}

export function getAccountSectionMeta(key) {
  return ACCOUNT_SECTIONS.find((section) => section.key === key) || ACCOUNT_SECTIONS[0];
}
