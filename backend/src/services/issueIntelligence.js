const OpenAI = require('openai');
const {
  inferIssueTrack,
  inferSocialCategory,
  inferCivicCategory,
  inferUrgencyLevel,
  deriveHelplines,
  formatIssueLocation,
} = require('../utils/issueCatalog');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function fallbackAnalysis({ text = '', track = 'mixed', categoryHint = '', locationHint = '' } = {}) {
  const issueTrack = track === 'social' ? 'social' : track === 'civic' ? 'civic' : inferIssueTrack(text);
  const socialCategory = issueTrack === 'social' ? inferSocialCategory(`${text} ${categoryHint}`) : null;
  const civicCategory = issueTrack === 'civic' ? inferCivicCategory(`${text} ${categoryHint}`) : null;
  const urgencyLevel = inferUrgencyLevel(text);
  const title = issueTrack === 'social'
    ? `${socialCategory.replaceAll('_', ' ')} support needed`
    : `${civicCategory.replaceAll('_', ' ')} issue reported`;

  return {
    issueTrack,
    title,
    description: text,
    civicCategory,
    socialCategory,
    severity: urgencyLevel === 'emergency' ? 'high' : urgencyLevel,
    urgencyLevel,
    location: locationHint ? { address: locationHint } : null,
    helplinesTriggered: deriveHelplines({ socialCategory, urgencyLevel, description: text }),
    summary: text.slice(0, 140),
  };
}

async function analyzeIssueText(options = {}) {
  const { text = '', track = 'mixed', categoryHint = '', locationHint = '' } = options;

  if (!openai) {
    return fallbackAnalysis(options);
  }

  try {
    const prompt = `You are classifying an Indian civic/social issue report.
Return ONLY JSON with these keys:
{
  "issueTrack": "civic" or "social",
  "title": "short human-readable title",
  "description": "cleaned full description",
  "civicCategory": "pothole|streetlight|sewage|garbage|water|other or empty",
  "socialCategory": "child_labour|womens_safety|homelessness|education|healthcare|environment|elder_neglect|hunger|disability|mental_health|discrimination|substance_abuse or empty",
  "severity": "low|medium|high|emergency",
  "urgencyLevel": "low|medium|high|emergency",
  "location": { "address": "", "city": "", "state": "", "pincode": "" },
  "summary": "max 140 chars",
  "helplinesTriggered": ["..."]
}

Rules:
- Decide civic vs social from the text.
- Use social categories for people-safety or welfare issues.
- Set urgencyLevel to emergency if text mentions child, violence, suicide, abuse, attack, rape, missing, collapsed.
- Infer helplines based on the category.
- If location is missing, leave fields blank.
- If categoryHint is provided, use it as a strong hint.

Text: ${text}
Category hint: ${categoryHint}
Location hint: ${locationHint}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    const issueTrack = parsed.issueTrack === 'social' ? 'social' : 'civic';
    const socialCategory = issueTrack === 'social'
      ? (parsed.socialCategory || inferSocialCategory(`${text} ${categoryHint}`))
      : null;
    const civicCategory = issueTrack === 'civic'
      ? (parsed.civicCategory || inferCivicCategory(`${text} ${categoryHint}`))
      : null;
    const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(parsed.urgencyLevel)
      ? parsed.urgencyLevel
      : inferUrgencyLevel(text);

    return {
      issueTrack,
      title: parsed.title || fallbackAnalysis(options).title,
      description: parsed.description || text,
      civicCategory,
      socialCategory,
      severity: ['low', 'medium', 'high', 'emergency'].includes(parsed.severity)
        ? parsed.severity
        : urgencyLevel,
      urgencyLevel,
      location: parsed.location || (locationHint ? { address: locationHint } : null),
      summary: parsed.summary || text.slice(0, 140),
      helplinesTriggered: Array.isArray(parsed.helplinesTriggered)
        ? parsed.helplinesTriggered
        : deriveHelplines({ socialCategory, urgencyLevel, description: text }),
    };
  } catch (error) {
    console.error('Issue intelligence fallback:', error.message);
    return fallbackAnalysis(options);
  }
}

module.exports = {
  analyzeIssueText,
  fallbackAnalysis,
  formatIssueLocation,
};
