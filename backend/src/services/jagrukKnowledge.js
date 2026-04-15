const ROUTE_KNOWLEDGE = [
  {
    terms: ['report', 'file', 'submit', 'complaint', 'new issue', 'create issue'],
    answer:
      'Use /report to file a new issue. Pick civic for roads, water, drainage, sanitation, transport, or similar public service problems. Pick social for safety, welfare, or support cases.',
  },
  {
    terms: ['track', 'status', 'timeline', 'where is my complaint', 'my complaint'],
    answer:
      'Use /track/:id to open the issue timeline and see the current status. If you only know the report number, open the tracker and paste it in the URL.',
  },
  {
    terms: ['login', 'sign in', 'sign-in', 'access type', 'role'],
    answer:
      'Use /login to choose your access type. Citizen, admin, department, and NGO each have their own sign-in path.',
  },
  {
    terms: ['ngo', 'social issue', 'women safety', 'child labour', 'support case'],
    answer:
      'Social issues are routed to NGO support first. Use /report and choose the social track so Jagruk can route it correctly.',
  },
  {
    terms: ['department', 'civic issue', 'pothole', 'water', 'streetlight', 'garbage', 'sewage'],
    answer:
      'Civic issues are routed to government departments. Use /report and choose the civic track for roads, water, sanitation, and similar services.',
  },
  {
    terms: ['impact', 'metrics', 'statistics', 'how many resolved'],
    answer:
      'Use /impact to see live platform metrics such as resolved issues, active NGOs, and the current resolution rate.',
  },
  {
    terms: ['community', 'feed', 'public reports', 'nearby issues'],
    answer:
      'Use /community to browse public reports and support activity. Nearby issues are also shown in the report flow when you pin a location.',
  },
  {
    terms: ['ngo directory', 'ngo list', 'partners'],
    answer:
      'Use /ngos to find NGO partners, then open /ngos/:id for the profile and social support details.',
  },
  {
    terms: ['jagruk', 'assistant', 'bot', 'chatbot'],
    answer:
      'Jagruk is the CivicVoice assistant. You can open it from the landing page, the app-wide floating button, or /jagruk.',
  },
  {
    terms: ['emergency', 'urgent', 'danger', 'violence', 'rape', 'attack', 'missing', 'suicide'],
    answer:
      'If this is an emergency, call 112 immediately. Then use /report so the case can be routed to the right civic or social response.',
  },
];

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9\s/:?-]/g, ' ');
}

function getKnowledgeReply(message = '') {
  const normalized = normalizeText(message);

  for (const item of ROUTE_KNOWLEDGE) {
    if (item.terms.some((term) => normalized.includes(term))) {
      return item.answer;
    }
  }

  return null;
}

function getContextSummary() {
  return ROUTE_KNOWLEDGE.map((item) => item.answer).join(' ');
}

module.exports = {
  ROUTE_KNOWLEDGE,
  getKnowledgeReply,
  getContextSummary,
};