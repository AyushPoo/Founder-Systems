/**
 * Lightweight web research for Founder Strategy Copilot.
 * Searches for market intelligence, competitor info, and community discussions
 * to ground strategy recommendations in real signals.
 */

function cleanText(value) {
  return String(value ?? '').trim();
}

/**
 * Extract key terms from the founder's context to build search queries.
 */
function extractSearchTerms(conversationText, productName) {
  const name = cleanText(productName);
  const context = cleanText(conversationText).toLowerCase();

  // Extract domain/industry keywords
  const keywords = [];
  if (name) keywords.push(name);

  // Common industry signals
  const industryTerms = [
    'edtech', 'fintech', 'healthtech', 'saas', 'marketplace', 'ecommerce',
    'ai', 'machine learning', 'grading', 'assessment', 'education',
    'payments', 'lending', 'insurance', 'logistics', 'food', 'delivery',
    'hr', 'recruitment', 'crm', 'analytics', 'automation',
  ];

  industryTerms.forEach((term) => {
    if (context.includes(term)) keywords.push(term);
  });

  return keywords.slice(0, 5);
}

/**
 * Build search queries for different research angles.
 */
function buildSearchQueries(terms, productName) {
  const name = cleanText(productName);
  const industry = terms.filter((t) => t !== name).slice(0, 2).join(' ');

  return [
    `${name} ${industry} startup competitors`.trim(),
    `${industry} market size India 2024 2025`.trim(),
    `${name || industry} reddit feedback users`.trim(),
    `${industry} startup challenges pricing strategy`.trim(),
  ].filter((q) => q.length > 5);
}

/**
 * Perform a web search using DuckDuckGo's HTML endpoint.
 * Returns text snippets from search results.
 */
async function searchWeb(query, maxResults = 5) {
  try {
    const encoded = encodeURIComponent(query);
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encoded}`,
      {
        headers: {
          'User-Agent': 'FounderSystems/1.0 (Strategy Research)',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) return [];

    const html = await response.text();

    // Extract result snippets from DuckDuckGo HTML response
    const results = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<a class="result__a"[^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    while ((match = snippetRegex.exec(html)) !== null && results.length < maxResults) {
      const snippet = match[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .trim();
      if (snippet.length > 20) {
        results.push(snippet);
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Run market research for the premium strategy plan.
 * Returns a formatted context string with web research findings.
 */
export async function runMarketResearch({ conversationText, productName }) {
  const terms = extractSearchTerms(conversationText, productName);
  if (terms.length === 0) return '';

  const queries = buildSearchQueries(terms, productName);
  const allResults = [];

  // Run searches in parallel with a timeout
  const searchPromises = queries.map(async (query) => {
    const results = await searchWeb(query, 4);
    return { query, results };
  });

  try {
    const settled = await Promise.allSettled(searchPromises);
    settled.forEach((outcome) => {
      if (outcome.status === 'fulfilled' && outcome.value.results.length > 0) {
        allResults.push(outcome.value);
      }
    });
  } catch {
    // If all searches fail, return empty — the plan will still generate from conversation context
    return '';
  }

  if (allResults.length === 0) return '';

  // Format results as context for the AI model
  const lines = ['WEB RESEARCH FINDINGS (use these to ground your strategy in real market signals):'];
  allResults.forEach(({ query, results }) => {
    lines.push(`\nSearch: "${query}"`);
    results.forEach((snippet, i) => {
      lines.push(`  ${i + 1}. ${snippet.slice(0, 300)}`);
    });
  });

  return lines.join('\n').slice(0, 3000); // Cap total research context
}
