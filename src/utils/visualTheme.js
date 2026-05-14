export function getVisualThemeFromCategory(category = '') {
    const normalized = category.toLowerCase();
    if (normalized.includes('finance')) {
        return 'finance';
    }
    if (normalized.includes('marketing')) {
        return 'marketing';
    }
    if (normalized.includes('strategy')) {
        return 'strategy';
    }
    return 'finance';
}
