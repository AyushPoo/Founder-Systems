function cleanArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return String(value ?? '').trim();
}

function toNonNegativeNumber(value, fallback = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.max(0, numericValue);
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildOutreachCsvRows(output = {}) {
  const emailRows = cleanArray(output.emails).map((entry, index) => ({
    step: `email_${entry?.step ?? index + 1}`,
    channel: 'email',
    subject: cleanText(entry?.subject),
    body: cleanText(entry?.body),
    delay_days: toNonNegativeNumber(entry?.delayDays),
    goal: cleanText(entry?.title) || 'Get reply',
  }));

  const linkedinRows = cleanArray(output.linkedinMessages).map((entry, index) => ({
    step: cleanText(entry?.step) || `linkedin_${index + 1}`,
    channel: 'linkedin',
    subject: '',
    body: cleanText(entry?.body),
    delay_days: index,
    goal: 'Start conversation',
  }));

  return [...emailRows, ...linkedinRows];
}

export function buildOutreachCsvString(rows = []) {
  const headers = ['step', 'channel', 'subject', 'body', 'delay_days', 'goal'];
  const lines = [headers.join(',')];

  cleanArray(rows).forEach((row) => {
    lines.push(headers.map((key) => escapeCsvCell(row?.[key])).join(','));
  });

  return lines.join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
