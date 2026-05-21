function cleanText(value) {
  return String(value || '').trim();
}

export function normalizeFounderCommandCenterIngestRequest(input = {}) {
  return {
    files: Array.isArray(input.files) ? input.files.filter(Boolean) : [],
    notes: cleanText(input.notes),
  };
}

export function normalizeFounderCommandCenterIngestResponse(payload = {}) {
  return {
    companySummary: cleanText(payload.companySummary),
    findings: Array.isArray(payload.findings) ? payload.findings : [],
    memoryCandidates: Array.isArray(payload.memoryCandidates) ? payload.memoryCandidates : [],
    error: cleanText(payload.error),
  };
}

export function mapIngestResultToMemoryCandidates({
  findings = [],
  sourceProduct = 'founder-command-center',
} = {}) {
  return (Array.isArray(findings) ? findings : [])
    .filter((item) => cleanText(item?.type) && cleanText(item?.label) && cleanText(item?.text))
    .map((item) => ({
      memory_scope: 'canonical',
      type: item.type,
      label: item.label,
      summary_text: item.text,
      value_json: { text: item.text, area: item.area || 'general' },
      source_product: sourceProduct,
      confidence: item.confidence || 'inferred',
      visibility: 'workspace_shared',
    }));
}
