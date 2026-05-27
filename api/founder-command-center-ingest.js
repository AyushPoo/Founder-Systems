function cleanText(value) {
  return String(value || '').trim();
}

function getFileName(file = {}) {
  return cleanText(file.filename || file.name) || 'founder material';
}

function buildReadablePreview(file = {}) {
  const name = getFileName(file).toLowerCase();
  const mimeType = cleanText(file.mimeType || file.type).toLowerCase();
  const readable =
    /text\/|csv|json|xml/.test(mimeType) ||
    /\.(csv|tsv|txt|md|json|html|xml)$/i.test(name);
  const fileData = cleanText(file.fileData);

  if (!readable || !fileData.includes(',')) {
    return '';
  }

  try {
    const encoded = fileData.slice(fileData.indexOf(',') + 1);
    const decoded = fileData.includes(';base64,')
      ? Buffer.from(encoded, 'base64').toString('utf8')
      : decodeURIComponent(encoded);
    return cleanText(decoded).replace(/\s*\r?\n\s*/g, ' | ').slice(0, 260);
  } catch {
    return '';
  }
}

function buildFallbackFindings(files = [], notes = '') {
  const uploadedFindings = files.map((file) => {
    const filename = getFileName(file);
    const preview = buildReadablePreview(file);
    return {
      type: 'document',
      label: `Uploaded material: ${filename}`,
      text: preview
        ? `Unverified source preview from ${filename}: ${preview}`
        : `Uploaded ${filename} for review; no readable text preview was available.`,
      area: 'documents',
      confidence: 'inferred',
    };
  });

  return [
    ...uploadedFindings,
    notes
      ? {
          type: 'priority',
          label: 'Founder note',
          text: `Founder-provided note: ${notes}`,
          area: 'strategy',
          confidence: 'confirmed',
        }
      : null,
  ].filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  const notes = cleanText(req.body?.notes);

  if (!files.length && !notes) {
    return res.status(400).json({ error: 'Add at least one file or note.' });
  }

  const findings = buildFallbackFindings(files, notes);
  const memoryCandidates = findings.map((item) => ({
    memory_scope: 'canonical',
    type: item.type,
    label: item.label,
    summary_text: item.text,
    value_json: { text: item.text, area: item.area || 'general' },
    source_product: 'founder-command-center',
    confidence: item.confidence || 'inferred',
    visibility: 'workspace_shared',
  }));

  return res.status(200).json({
    companySummary: findings.map((item) => item.text).join(' '),
    findings,
    memoryCandidates,
  });
}
