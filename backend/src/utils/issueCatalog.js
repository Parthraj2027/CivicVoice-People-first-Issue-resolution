const SOCIAL_CATEGORIES = [
  'child_labour',
  'womens_safety',
  'homelessness',
  'education',
  'healthcare',
  'environment',
  'elder_neglect',
  'hunger',
  'disability',
  'mental_health',
  'discrimination',
  'substance_abuse',
];

const CIVIC_CATEGORIES = ['pothole', 'streetlight', 'sewage', 'garbage', 'water', 'other'];

const EMERGENCY_KEYWORDS = [
  'child',
  'violence',
  'suicide',
  'abuse',
  'attack',
  'rape',
  'missing',
  'collapsed',
  'emergency',
  'urgent',
  'help now',
  'life threatening',
];

const SOCIAL_CATEGORY_KEYWORDS = [
  ['child_labour', ['child labour', 'child labor', 'underage work', 'minor working', 'children working']],
  ['womens_safety', ['women safety', "women's safety", 'harassment', 'eve teasing', 'assault', 'stalking']],
  ['homelessness', ['homeless', 'shelter', 'sleeping on street', 'street dwelling']],
  ['education', ['school access', 'education access', 'dropout', 'no school', 'school fees', 'tuition']],
  ['healthcare', ['hospital access', 'medical help', 'treatment', 'healthcare', 'medicine', 'ambulance']],
  ['environment', ['pollution', 'environment', 'tree cutting', 'waste dumping', 'smoke', 'contamination']],
  ['elder_neglect', ['elder neglect', 'elderly neglect', 'senior abuse', 'old age neglect']],
  ['hunger', ['hunger', 'food shortage', 'no food', 'starving', 'meal support']],
  ['disability', ['disability', 'wheelchair', 'accessible', 'accessibility', 'disabled']],
  ['mental_health', ['mental health', 'depression', 'suicide', 'panic', 'anxiety', 'counselling']],
  ['discrimination', ['discrimination', 'biased', 'harassment', 'cast discrimination', 'racial discrimination']],
  ['substance_abuse', ['substance abuse', 'drugs', 'alcohol abuse', 'addiction', 'narcotic']],
];

const CIVIC_CATEGORY_KEYWORDS = [
  ['pothole', ['pothole', 'road break', 'road damage', 'broken road', 'crack in road']],
  ['streetlight', ['streetlight', 'street light', 'light not working', 'dark street', 'lamp post']],
  ['sewage', ['sewage', 'drain overflow', 'drainage', 'manhole', 'dirty water']],
  ['garbage', ['garbage', 'trash', 'waste collection', 'overflowing bin', 'dumping']],
  ['water', ['water supply', 'water leak', 'pipe burst', 'low water', 'water shortage']],
];

const HELPLINE_MAP = {
  child_labour: ['1098'],
  womens_safety: ['181', '100'],
  mental_health: ['9152987821', 'iCall'],
  elder_neglect: ['14567'],
  disability: ['1800-180-5999'],
};

const SOCIAL_DEPARTMENT_MAP = {
  child_labour: 'Women & Child Welfare',
  womens_safety: 'Women & Child Welfare',
  homelessness: 'Social Welfare',
  education: 'Education',
  healthcare: 'Health',
  environment: 'Environment',
  elder_neglect: 'Social Welfare',
  hunger: 'Food & Civil Supplies',
  disability: 'Social Welfare',
  mental_health: 'Health',
  discrimination: 'Social Justice',
  substance_abuse: 'Health',
};

const CIVIC_DEPARTMENT_MAP = {
  pothole: 'Roads & Transport',
  streetlight: 'Power',
  sewage: 'Water & Sewage',
  garbage: 'Municipal Services',
  water: 'Water & Sewage',
  other: 'Municipal Services',
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function formatIssueLocation(location) {
  if (!location) {
    return '';
  }

  if (typeof location === 'string') {
    return location;
  }

  if (typeof location === 'object') {
    return [location.address, location.city, location.state, location.pincode].filter(Boolean).join(', ');
  }

  return String(location);
}

function detectKeywordMatch(text, keywordGroups, fallback) {
  const normalizedText = normalizeText(text);
  for (const [category, keywords] of keywordGroups) {
    if (keywords.some((keyword) => normalizedText.includes(keyword))) {
      return category;
    }
  }
  return fallback;
}

function inferSocialCategory(text) {
  return detectKeywordMatch(text, SOCIAL_CATEGORY_KEYWORDS, 'environment');
}

function inferCivicCategory(text) {
  return detectKeywordMatch(text, CIVIC_CATEGORY_KEYWORDS, 'other');
}

function inferIssueTrack(text) {
  return detectKeywordMatch(text, SOCIAL_CATEGORY_KEYWORDS, 'civic') === 'civic' ? 'civic' : 'social';
}

function inferUrgencyLevel(text) {
  const normalizedText = normalizeText(text);
  if (EMERGENCY_KEYWORDS.some((keyword) => normalizedText.includes(keyword))) {
    return 'emergency';
  }
  if (/(urgent|asap|immediately|danger|unsafe|severe|critical)/i.test(normalizedText)) {
    return 'high';
  }
  if (/(soon|important|quickly|badly|serious)/i.test(normalizedText)) {
    return 'medium';
  }
  return 'low';
}

function deriveHelplines({ socialCategory, urgencyLevel, description }) {
  const helplines = new Set();
  const categoryHelplines = HELPLINE_MAP[socialCategory] || [];
  categoryHelplines.forEach((item) => helplines.add(item));

  if (urgencyLevel === 'emergency') {
    helplines.add('Admin Alert');
  }

  const text = normalizeText(description);
  if (text.includes('child')) {
    HELPLINE_MAP.child_labour.forEach((item) => helplines.add(item));
  }
  if (text.includes('women') || text.includes('female') || text.includes('harass')) {
    HELPLINE_MAP.womens_safety.forEach((item) => helplines.add(item));
  }
  if (text.includes('mental') || text.includes('suicide') || text.includes('depress')) {
    HELPLINE_MAP.mental_health.forEach((item) => helplines.add(item));
  }

  return Array.from(helplines);
}

function deriveDepartmentForCivicCategory(civicCategory) {
  return CIVIC_DEPARTMENT_MAP[civicCategory] || CIVIC_DEPARTMENT_MAP.other;
}

function deriveDepartmentForSocialCategory(socialCategory) {
  return SOCIAL_DEPARTMENT_MAP[socialCategory] || SOCIAL_DEPARTMENT_MAP.environment;
}

module.exports = {
  SOCIAL_CATEGORIES,
  CIVIC_CATEGORIES,
  HELPLINE_MAP,
  CIVIC_DEPARTMENT_MAP,
  SOCIAL_DEPARTMENT_MAP,
  formatIssueLocation,
  inferIssueTrack,
  inferSocialCategory,
  inferCivicCategory,
  inferUrgencyLevel,
  deriveHelplines,
  deriveDepartmentForCivicCategory,
  deriveDepartmentForSocialCategory,
  normalizeText,
};
