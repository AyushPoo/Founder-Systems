function cleanText(value) {
  return String(value || '').trim();
}

function replyRate(sent, replies) {
  const s = Number(sent);
  const r = Number(replies);
  if (!s || s <= 0) return null;
  return `${Math.round((r / s) * 100)}%`;
}

/**
 * Given a list of saved campaigns and the current draft input, find the most
 * recent campaign that has logged results for the same product/audience and
 * return a short human-readable summary suitable for injecting into a prompt.
 *
 * Returns an empty string when no useful prior outcomes exist.
 */
export function buildPreviousOutcomesSummary(savedCampaigns = [], currentDraft = {}) {
  if (!Array.isArray(savedCampaigns) || savedCampaigns.length === 0) {
    return '';
  }

  const currentProduct = cleanText(currentDraft.productName).toLowerCase();
  const currentCustomer = cleanText(currentDraft.targetCustomer).toLowerCase();

  // Find the most recent saved campaign that has any logged result data
  // and shares the same product name or target customer as the current draft.
  const relevant = savedCampaigns.find((campaign) => {
    const results = campaign.results || {};
    const hasAnyResult =
      results.emailMetrics?.length > 0 ||
      results.topObjection ||
      results.whatWouldYouChange ||
      results.verdict ||
      results.winningAsset ||
      results.notes;

    if (!hasAnyResult) return false;

    const campaignProduct = cleanText(campaign.productName).toLowerCase();
    const campaignCustomer = cleanText(campaign.targetCustomer).toLowerCase();

    // Match if product name overlaps or if target customer overlaps (at least 4 chars)
    const productMatch =
      currentProduct.length >= 4 &&
      campaignProduct.length >= 4 &&
      (currentProduct.includes(campaignProduct.slice(0, 8)) ||
        campaignProduct.includes(currentProduct.slice(0, 8)));

    const customerMatch =
      currentCustomer.length >= 6 &&
      campaignCustomer.length >= 6 &&
      (currentCustomer.includes(campaignCustomer.slice(0, 10)) ||
        campaignCustomer.includes(currentCustomer.slice(0, 10)));

    return productMatch || customerMatch;
  });

  if (!relevant) return '';

  const results = relevant.results || {};
  const lines = ['Previous campaign outcomes (use these to improve this campaign):'];

  // Per-email reply rates
  if (Array.isArray(results.emailMetrics) && results.emailMetrics.length > 0) {
    const emailLines = results.emailMetrics
      .filter((m) => m.sent > 0)
      .map((m) => {
        const rate = replyRate(m.sent, m.replies);
        return `  - Email ${m.step}: ${m.sent} sent, ${m.replies} replies${rate ? ` (${rate} reply rate)` : ''}`;
      });
    if (emailLines.length > 0) {
      lines.push('Email performance:');
      emailLines.forEach((l) => lines.push(l));
    }
  } else if (results.sentCount > 0) {
    // Legacy flat metrics fallback
    const rate = replyRate(results.sentCount, results.replyCount);
    lines.push(
      `Overall: ${results.sentCount} sent, ${results.replyCount} replies${rate ? ` (${rate} reply rate)` : ''}`
    );
  }

  // LinkedIn
  const li = results.linkedinMetrics || {};
  if (li.connectionsSent > 0) {
    lines.push(
      `LinkedIn: ${li.connectionsSent} connections sent, ${li.accepted} accepted, ${li.replied} replied`
    );
  }

  // Best asset
  if (results.winningAsset) {
    lines.push(`Best-performing asset: ${results.winningAsset}`);
  }

  // Top objection
  if (results.topObjection) {
    lines.push(`Top objection that came up: "${results.topObjection}"`);
  }

  // What would you change
  if (results.whatWouldYouChange) {
    lines.push(`What didn't work / founder's note: "${results.whatWouldYouChange}"`);
  }

  // Verdict
  const verdictMap = { yes: 'Would run again', modified: 'Would run with modifications', no: 'Would not run again' };
  if (verdictMap[results.verdict]) {
    lines.push(`Founder verdict: ${verdictMap[results.verdict]}`);
  }

  // Notes
  if (results.notes && results.notes !== results.whatWouldYouChange) {
    lines.push(`Additional notes: "${results.notes}"`);
  }

  if (lines.length <= 1) return '';

  return lines.join('\n');
}
