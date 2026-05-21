function cleanText(value) {
  return String(value || '').trim();
}

function buildFallbackFindings(files = [], notes = '') {
  const names = files.map((file) => file?.name).filter(Boolean);
  return [
    {
      type: 'document',
      label: 'Uploaded materials',
      text: names.length ? `Uploaded ${names.join(', ')}` : 'Uploaded founder materials',
      area: 'documents',
      confidence: 'confirmed',
    },
    notes
      ? {
          type: 'priority',
          label: 'Founder note',
          text: notes,
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
