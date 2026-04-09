// scripts/update-n8n-workflow.js
// Fixes the Product Publisher workflow to use $helpers.httpRequest instead of fetch()

const N8N_URL = 'http://20.193.252.82:567';
const N8N_KEY = process.env.N8N_KEY || 'YOUR_N8N_KEY';
const WF_ID = process.env.WF_ID || 'YOUR_WF_ID';
const GUMROAD_KEY = process.env.GUMROAD_KEY || 'YOUR_GUMROAD_KEY';
const LS_KEY = process.env.LS_KEY || 'YOUR_LS_KEY';
const IM_KEY = process.env.IM_KEY || 'YOUR_IM_KEY';
const IM_TOKEN = process.env.IM_TOKEN || 'YOUR_IM_TOKEN';
const GH_PAT = process.env.GH_PAT || 'YOUR_GH_PAT';
const CHAT_ID = process.env.CHAT_ID || 'YOUR_CHAT_ID';
const TG_CRED_ID = process.env.TG_CRED_ID || 'YOUR_TG_CRED_ID';

const checkChangedCode = `
const payload = $input.first().json;
const body = payload.body || payload;
const commits = body.commits || [];
const changed = commits.flatMap(c => [...(c.added||[]),...(c.modified||[]),...(c.removed||[])]);
if (!changed.some(f => f.includes('src/data/products.json'))) {
  throw new Error('SKIP: products.json not in changeset');
}
return [{ json: { triggered: true, commits: commits.length } }];
`;

const fetchValidateCode = `
const products = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://raw.githubusercontent.com/AyushPoo/Founder-Systems/main/src/data/products.json',
  headers: { 'Authorization': 'token ${GH_PAT}', 'Cache-Control': 'no-cache' },
  returnFullResponse: false
});
if (!Array.isArray(products)) throw new Error('products.json must be an array');
const required = ['slug','title','descriptionBody','priceUsd','priceInr','platformIds','images','features','whatYouGet'];
for (const p of products) {
  for (const f of required) {
    if (p[f] === undefined || p[f] === null) throw new Error('Product ' + p.productId + ' missing: ' + f);
  }
}
return [{ json: { products } }];
`;

const syncAllCode = `
const products = $input.first().json.products;
const GUMROAD_KEY = '${GUMROAD_KEY}';
const LS_KEY = '${LS_KEY}';
const IM_KEY = '${IM_KEY}';
const IM_TOKEN = '${IM_TOKEN}';

function buildDesc(p, fmt) {
  const bullets = fmt === 'md'
    ? p.features.slice(0,3).map(f => '- **' + f.name + '**: ' + f.desc).join('\\n')
    : p.features.slice(0,3).map(f => '- ' + f.name + ': ' + f.desc).join('\\n');
  const gets = p.whatYouGet.map(w => '- ' + w).join('\\n');
  const d = p.descriptionBody + '\\n\\nKey Features:\\n' + bullets + '\\n\\nWhat you get:\\n' + gets;
  return d.length > 2000 ? d.substring(0,1997) + '...' : d;
}

const results = [];

for (const p of products) {
  // GUMROAD
  try {
    const id = p.platformIds.gumroadProductId;
    if (!id) {
      results.push({ slug: p.slug, platform: 'gumroad', status: 'skipped', reason: 'no platformId' });
    } else {
      const thumbUrl = 'https://raw.githubusercontent.com/AyushPoo/Founder-Systems/main/public' + p.images[0];
      const formBody = 'name=' + encodeURIComponent(p.title)
        + '&description=' + encodeURIComponent(buildDesc(p,'plain'))
        + '&price=' + encodeURIComponent(String(p.priceUsd * 100))
        + '&cover_url=' + encodeURIComponent(thumbUrl);
      const r = await $helpers.httpRequest({
        method: 'PUT',
        url: 'https://api.gumroad.com/v2/products/' + id,
        headers: { 'Authorization': 'Bearer ' + GUMROAD_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody,
        returnFullResponse: false
      });
      if (!r.success) throw new Error(JSON.stringify(r.message || r));
      results.push({ slug: p.slug, platform: 'gumroad', status: 'ok' });
    }
  } catch(e) { results.push({ slug: p.slug, platform: 'gumroad', status: 'error', reason: e.message.substring(0,120) }); }

  // LEMONSQUEEZY
  try {
    const pid = p.platformIds.lemonSqueezyProductId;
    const vid = p.platformIds.lemonSqueezyVariantId;
    if (!pid || !vid) {
      results.push({ slug: p.slug, platform: 'lemonsqueezy', status: 'skipped', reason: 'no platformIds' });
    } else {
      const lsHeaders = { 'Authorization': 'Bearer ' + LS_KEY, 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' };
      await $helpers.httpRequest({
        method: 'PATCH',
        url: 'https://api.lemonsqueezy.com/v1/products/' + pid,
        headers: lsHeaders,
        body: { data: { type: 'products', id: pid, attributes: { name: p.title, description: buildDesc(p,'md') } } },
        returnFullResponse: false
      });
      await $helpers.httpRequest({
        method: 'PATCH',
        url: 'https://api.lemonsqueezy.com/v1/variants/' + vid,
        headers: lsHeaders,
        body: { data: { type: 'variants', id: vid, attributes: { price: p.priceUsd * 100 } } },
        returnFullResponse: false
      });
      results.push({ slug: p.slug, platform: 'lemonsqueezy', status: 'ok' });
    }
  } catch(e) { results.push({ slug: p.slug, platform: 'lemonsqueezy', status: 'error', reason: e.message.substring(0,120) }); }

  // INSTAMOJO — IDs not yet mapped, skip gracefully
  results.push({ slug: p.slug, platform: 'instamojo', status: 'skipped', reason: 'platformId pending' });
}

return [{ json: { results } }];
`;

const formatReportCode = `
const results = $input.first().json.results;
const byProduct = {};
for (const r of results) {
  if (!byProduct[r.slug]) byProduct[r.slug] = {};
  const emoji = r.status === 'ok' ? '✅' : r.status === 'skipped' ? '⚠️' : '❌';
  const detail = r.status === 'ok' ? '' : ' — ' + (r.reason || 'error');
  byProduct[r.slug][r.platform] = '  ' + emoji + ' ' + r.platform + detail;
}
let msg = '📦 *Product Sync Complete*\\n\\n';
for (const [slug, platforms] of Object.entries(byProduct)) {
  msg += '*' + slug + '*\\n' + Object.values(platforms).join('\\n') + '\\n\\n';
}
const now = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour:'2-digit', minute:'2-digit' });
msg += 'Sync finished at ' + now + ' IST';
return [{ json: { chatId: '${CHAT_ID}', text: msg } }];
`;

const updatedWorkflow = {
  name: "Product Publisher",
  settings: { executionOrder: "v1" },
  nodes: [
    {
      id: "node-webhook",
      name: "GitHub Push Webhook",
      type: "n8n-nodes-base.webhook",
      typeVersion: 1,
      position: [250, 300],
      webhookId: "product-publisher-webhook",
      parameters: {
        httpMethod: "POST",
        path: "product-publisher",
        responseMode: "onReceived",
        responseData: "firstEntryJson"
      }
    },
    {
      id: "node-check",
      name: "Check products.json Changed",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [470, 300],
      parameters: { jsCode: checkChangedCode }
    },
    {
      id: "node-fetch",
      name: "Fetch & Validate products.json",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [690, 300],
      parameters: { jsCode: fetchValidateCode }
    },
    {
      id: "node-sync",
      name: "Sync All Platforms",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [910, 300],
      parameters: { jsCode: syncAllCode }
    },
    {
      id: "node-format",
      name: "Format Report",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1110, 300],
      parameters: { jsCode: formatReportCode }
    },
    {
      id: "node-telegram",
      name: "Send Telegram Summary",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1,
      position: [1310, 300],
      credentials: {
        telegramApi: { id: TG_CRED_ID, name: "Telegram account 2" }
      },
      parameters: {
        chatId: "={{ $json.chatId }}",
        text: "={{ $json.text }}",
        additionalFields: { parse_mode: "Markdown" }
      }
    }
  ],
  connections: {
    "GitHub Push Webhook": { main: [[{ node: "Check products.json Changed", type: "main", index: 0 }]] },
    "Check products.json Changed": { main: [[{ node: "Fetch & Validate products.json", type: "main", index: 0 }]] },
    "Fetch & Validate products.json": { main: [[{ node: "Sync All Platforms", type: "main", index: 0 }]] },
    "Sync All Platforms": { main: [[{ node: "Format Report", type: "main", index: 0 }]] },
    "Format Report": { main: [[{ node: "Send Telegram Summary", type: "main", index: 0 }]] }
  }
};

async function main() {
  // First deactivate
  const deact = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}/deactivate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  console.log('Deactivated:', deact.status);

  // Update via PUT
  const res = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': N8N_KEY },
    body: JSON.stringify(updatedWorkflow)
  });
  const text = await res.text();
  if (!res.ok) { console.error('Update failed:', res.status, text.substring(0,400)); return; }
  const data = JSON.parse(text);
  console.log('Updated! versionId:', data.versionId);

  // Reactivate
  const act = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}/activate`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const actData = await act.json();
  console.log('Activated:', actData.active);
}

main().catch(console.error);
