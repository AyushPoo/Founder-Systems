function cleanText(value) {
  return String(value || '').trim();
}

function readMemoryText(item = {}) {
  const fromValue = cleanText(item?.value_json?.text || item?.value_json?.value || item?.value_json?.summary);
  if (fromValue) {
    return fromValue;
  }
  return cleanText(item?.summary_text || item?.label);
}

function createCandidate({
  memory_scope = 'product_native',
  type,
  label,
  text,
  summary,
  source_product,
  confidence = 'confirmed',
  visibility = 'workspace_shared',
  selected_products = [],
}) {
  const normalizedText = cleanText(text);
  if (!type || !label || !normalizedText || !source_product) {
    return null;
  }

  return {
    memory_scope,
    type,
    label,
    value_json: { text: normalizedText },
    summary_text: cleanText(summary) || normalizedText,
    source_product,
    confidence,
    visibility,
    selected_products,
  };
}

function compactCandidates(candidates = []) {
  return candidates.filter(Boolean);
}

export function mapMemoryItemsToOutreachDraft(items = []) {
  const byType = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const type = cleanText(item?.type);
    if (!type || byType.has(type)) {
      return;
    }
    byType.set(type, readMemoryText(item));
  });

  return {
    productName: byType.get('venture_summary') || '',
    offer: byType.get('offer') || '',
    targetCustomer: byType.get('target_customer') || '',
    buyerRole: byType.get('buyer_role') || '',
    painPoint: byType.get('problem_statement') || '',
    proof: byType.get('proof_point') || '',
    pricing: byType.get('pricing_hypothesis') || '',
    tone: byType.get('brand_tone') || 'founder-led',
  };
}

export function buildSpecMemoryCandidates(session = {}) {
  const brief = session?.brief || {};
  const recommendation = session?.recommendation || {};
  const actionPlan = session?.actionPlan || {};

  return compactCandidates([
    createCandidate({
      memory_scope: 'canonical',
      type: 'venture_summary',
      label: 'Venture summary',
      text: recommendation.title || recommendation.what || recommendation.summary,
      summary: recommendation.summary,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'target_customer',
      label: 'Target customer',
      text: brief.customer,
      summary: brief.customer,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'buyer_role',
      label: 'Buyer role',
      text: brief.buyerRole,
      summary: brief.buyerRole,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'problem_statement',
      label: 'Problem statement',
      text: brief.problem,
      summary: brief.problem,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'offer',
      label: 'Offer',
      text: brief.solution || recommendation.summary || recommendation.what,
      summary: brief.solution || recommendation.summary,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'pricing_hypothesis',
      label: 'Pricing hypothesis',
      text: brief.pricing,
      summary: brief.pricing,
      source_product: 'founder-spec-generator',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'proof_point',
      label: 'Proof point',
      text: Array.isArray(actionPlan?.proofPoints) ? actionPlan.proofPoints[0] : '',
      summary: session?.verdict?.standing,
      source_product: 'founder-spec-generator',
    }),
  ]);
}

export function buildOutreachMemoryCandidates({ draft = {}, result = null } = {}) {
  const positioningAngle = Array.isArray(result?.positioningAngles) ? result.positioningAngles[0] : null;
  const objectionReply = Array.isArray(result?.objectionReplies) ? result.objectionReplies[0] : null;

  return compactCandidates([
    createCandidate({
      memory_scope: 'canonical',
      type: 'venture_summary',
      label: 'Venture summary',
      text: draft.productName,
      summary: draft.offer,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'offer',
      label: 'Offer',
      text: draft.offer,
      summary: draft.offer,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'target_customer',
      label: 'Target customer',
      text: draft.targetCustomer || result?.icpSnapshot?.customer,
      summary: result?.icpSnapshot?.whyTheyRespond,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'buyer_role',
      label: 'Buyer role',
      text: draft.buyerRole || result?.icpSnapshot?.buyerRole,
      summary: result?.icpSnapshot?.buyerRole,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'problem_statement',
      label: 'Problem statement',
      text: draft.painPoint,
      summary: draft.desiredOutcome,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'proof_point',
      label: 'Proof point',
      text: draft.proof,
      summary: draft.proof,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'pricing_hypothesis',
      label: 'Pricing hypothesis',
      text: draft.pricing,
      summary: draft.pricing,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'canonical',
      type: 'brand_tone',
      label: 'Brand tone',
      text: draft.tone,
      summary: draft.tone,
      source_product: 'founder-outreach-kit',
    }),
    createCandidate({
      memory_scope: 'product_native',
      type: 'messaging_angle',
      label: positioningAngle?.name || 'Messaging angle',
      text: positioningAngle?.angle,
      summary: positioningAngle?.whyItWorks,
      source_product: 'founder-outreach-kit',
      visibility: 'selected_products',
      selected_products: ['founder-spec-generator', 'promptdeck-ai'],
    }),
    createCandidate({
      memory_scope: 'product_native',
      type: 'objection_pattern',
      label: objectionReply?.objection || 'Objection pattern',
      text: objectionReply?.reply,
      summary: objectionReply?.objection,
      source_product: 'founder-outreach-kit',
      visibility: 'selected_products',
      selected_products: ['founder-spec-generator', 'promptdeck-ai'],
    }),
  ]);
}
