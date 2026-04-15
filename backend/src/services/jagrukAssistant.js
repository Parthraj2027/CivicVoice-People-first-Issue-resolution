const OpenAI = require('openai');
const { getKnowledgeReply, getContextSummary } = require('./jagrukKnowledge');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const APP_KNOWLEDGE = [
  'CivicVoice is a public issue platform for civic and social complaints.',
  'Use /report to file a new issue. Civic issues go to departments. Social issues go to NGOs first.',
  'Use /track/:id to view a report timeline and status.',
  'Use /login to choose a role, then sign in as citizen, admin, department, or NGO.',
  'Use /community to browse public reports, /impact to see platform metrics, and /ngos to find NGO partners.',
  'The landing page has a Jagruk button. The chatbot should be concise, practical, and action-oriented.',
].join(' ');

function buildFallbackReply(message = '') {
  const lower = String(message).toLowerCase();

  if (lower.includes('emergency') || lower.includes('help') || lower.includes('danger')) {
    return 'If this is an emergency, call 112 right away. For a report, open /report and choose civic or social so it reaches the right team.';
  }

  if (lower.includes('track') || lower.includes('status')) {
    return 'You can track an existing report from the issue tracker once you are signed in. If you need to file one first, use /report.';
  }

  if (lower.includes('ngo') || lower.includes('social')) {
    return 'Social issues go to NGO support first. Use /report and pick the social track so Jagruk can route it correctly.';
  }

  return 'I am Jagruk, your civic assistant. I can help you choose the right report type, explain the process, or guide you to /report and /track. If you want, tell me your issue in one line.';
}

async function generateJagrukReply({ message = '', history = [], context = '' } = {}) {
  const knowledgeReply = getKnowledgeReply(message);
  if (knowledgeReply) {
    return {
      reply: knowledgeReply,
      sources: ['knowledge-base'],
    };
  }

  if (!openai) {
    return {
      reply: buildFallbackReply(message),
      sources: ['fallback'],
    };
  }

  try {
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-6).map((entry) => ({
          role: entry.role === 'assistant' ? 'assistant' : 'user',
          content: String(entry.content || entry.text || ''),
        }))
      : [];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `You are Jagruk, a concise civic assistant for a public issue reporting app. Reply in plain English, with optional simple Hindi words if natural. Keep answers short, practical, and friendly. Do not mention policy, do not pretend to contact officials, and do not fabricate status updates. ${APP_KNOWLEDGE} ${getContextSummary()} For emergencies, tell them to call 112 immediately. Return only JSON with key reply.`,
        },
        ...(context
          ? [{ role: 'system', content: `Current context: ${context}` }]
          : []),
        ...trimmedHistory,
        { role: 'user', content: message },
      ],
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');
    const reply = String(parsed.reply || '').trim() || buildFallbackReply(message);

    return {
      reply,
      sources: ['openai'],
    };
  } catch (error) {
    console.error('Jagruk assistant fallback:', error.message);
    return {
      reply: buildFallbackReply(message),
      sources: ['fallback'],
    };
  }
}

module.exports = {
  generateJagrukReply,
};