function cleanText(value) {
  return String(value || '').trim();
}

function toCountMap(items = []) {
  const counts = new Map();

  items.forEach((item) => {
    const label = cleanText(item);
    if (!label) {
      return;
    }

    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, campaignCount]) => ({ label, campaignCount }))
    .sort((left, right) => right.campaignCount - left.campaignCount || left.label.localeCompare(right.label));
}

export function buildOutreachMemorySummary(records = []) {
  const campaigns = Array.isArray(records) ? records : [];

  const totals = campaigns.reduce(
    (accumulator, record) => {
      const results = record?.results || {};
      return {
        totalSentCount: accumulator.totalSentCount + Number(results.sentCount || 0),
        totalReplyCount: accumulator.totalReplyCount + Number(results.replyCount || 0),
        totalPositiveReplyCount:
          accumulator.totalPositiveReplyCount + Number(results.positiveReplyCount || 0),
        totalCallsBooked: accumulator.totalCallsBooked + Number(results.callsBooked || 0),
      };
    },
    {
      totalSentCount: 0,
      totalReplyCount: 0,
      totalPositiveReplyCount: 0,
      totalCallsBooked: 0,
    }
  );

  return {
    totalCampaigns: campaigns.length,
    ...totals,
    topOffers: toCountMap(campaigns.map((record) => record?.productName)).slice(0, 3),
    topAudiences: toCountMap(campaigns.map((record) => record?.targetCustomer)).slice(0, 3),
    topWinningAssets: toCountMap(campaigns.map((record) => record?.results?.winningAsset)).slice(0, 3),
  };
}
