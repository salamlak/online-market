import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '../../../mockData';

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const tokenizeQuery = (query: string) => {
  const raw = normalizeText(query);
  if (!raw) return [];
  return [...new Set(raw.split(' ').filter((token) => token.length > 2))];
};

const synonymMap: Record<string, string[]> = {
  quiet: ['quiet', 'silent', 'low noise', 'soft'],
  keyboard: ['keyboard', 'typing', 'keypad', 'mechanical', 'key', 'input'],
  ergonomic: ['ergonomic', 'comfortable', 'supportive', 'lumbar', 'posture'],
  chair: ['chair', 'seat', 'office chair', 'desk chair'],
  headphones: ['headphones', 'headset', 'earphones', 'audio'],
  travel: ['travel', 'portable', 'commute', 'trip', 'journey'],
  watch: ['watch', 'smartwatch', 'wearable', 'fitness tracker'],
  backpack: ['backpack', 'bag', 'carry', 'commuter'],
  fitness: ['fitness', 'health', 'sport', 'exercise'],
  noise: ['noise', 'cancelling', 'soundproof', 'annoying sound'],
  comfort: ['comfort', 'comfortable', 'cozy', 'ease'],
  desk: ['desk', 'workspace', 'office', 'workstation'],
  long: ['long', 'hours', 'extended', 'all day'],
};

const expandTerms = (queryText: string) => {
  const terms = new Set<string>();
  const tokens = tokenizeQuery(queryText);

  tokens.forEach((token) => {
    terms.add(token);
    Object.entries(synonymMap).forEach(([key, values]) => {
      if (token === key || values.includes(token)) {
        terms.add(key);
        values.forEach((value) => terms.add(value));
      }
    });
  });

  const phrasePatterns = [
    'quiet keyboard',
    'long hours at desk',
    'for travel',
    'comfortable headphones',
    'ergonomic chair',
    'fitness watch',
    'smartwatch',
    'noise cancelling',
    'typing at night',
    'for desk',
    'laptop backpack',
  ];

  phrasePatterns.forEach((phrase) => {
    if (queryText.includes(normalizeText(phrase))) {
      terms.add(phrase);
      phrase.split(' ').forEach((word) => terms.add(word));
    }
  });

  return [...terms].filter(Boolean);
};

const productRules = [
  { id: 'p1', label: 'quiet keyboard', terms: ['keyboard', 'typing', 'quiet', 'silent', 'night', 'mechanical', 'desk'] },
  { id: 'p2', label: 'ergonomic chair', terms: ['chair', 'ergonomic', 'comfort', 'desk', 'office', 'lumbar', 'support', 'long', 'hours'] },
  { id: 'p3', label: 'headphones', terms: ['headphones', 'travel', 'noise', 'audio', 'music', 'wireless', 'bluetooth'] },
  { id: 'p4', label: 'fitness watch', terms: ['watch', 'fitness', 'health', 'sport', 'tracker', 'wearable'] },
  { id: 'p5', label: 'travel backpack', terms: ['backpack', 'travel', 'laptop', 'commuter', 'bag', 'portable'] },
];

const buildLocalProductMatch = (query: string, products: Product[]) => {
  const safeProducts = Array.isArray(products) ? products : [];
  const queryText = normalizeText(query);
  const terms = expandTerms(queryText);

  if (!safeProducts.length) {
    return {
      matchedIds: [],
      reasoning: 'No products available to match against.',
      confidence: 0,
    };
  }

  if (!terms.length) {
    return {
      matchedIds: safeProducts.slice(0, 3).map((product) => product.id),
      reasoning: 'Showing the most relevant items because no detailed description was provided.',
      confidence: 68,
    };
  }

  const scored = safeProducts
    .map((product) => {
      const title = normalizeText(product.title || '');
      const description = normalizeText(product.description || '');
      const tags = (product.tags || []).map((tag: string) => normalizeText(tag));
      const combinedText = `${title} ${description} ${tags.join(' ')}`;

      let score = 0;

      terms.forEach((term) => {
        if (!term) return;
        if (title.includes(term)) score += 12;
        if (description.includes(term)) score += 8;
        if (tags.some((tag) => tag.includes(term) || term.includes(tag))) score += 10;
        if (combinedText.includes(term)) score += 4;
      });

      productRules.forEach(({ id, terms: ruleTerms }) => {
        if (product.id !== id) return;
        const activeIntent = ruleTerms.some((term) => queryText.includes(term) || terms.includes(term));
        if (activeIntent) score += 24;
      });

      const phraseBonus = [
        { phrase: 'quiet keyboard', ids: ['p1'] },
        { phrase: 'long hours at desk', ids: ['p2'] },
        { phrase: 'comfortable headphones', ids: ['p3'] },
        { phrase: 'travel headphones', ids: ['p3'] },
        { phrase: 'fitness watch', ids: ['p4'] },
        { phrase: 'laptop backpack', ids: ['p5'] },
        { phrase: 'for travel', ids: ['p3', 'p5'] },
      ];

      phraseBonus.forEach(({ phrase, ids }) => {
        if (queryText.includes(normalizeText(phrase)) && ids.includes(product.id)) {
          score += 30;
        }
      });

      const tagMatches = product.tags?.filter((tag) => {
        const cleaned = normalizeText(tag);
        return terms.some((term) => cleaned.includes(term) || term.includes(cleaned));
      }) || [];

      if (tagMatches.length) score += tagMatches.length * 5;

      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0);

  const topMatches = scored.length ? scored : [{ product: safeProducts[0], score: 1 }];
  const topScore = topMatches[0].score || 1;
  const confidence = Math.min(98, Math.max(62, Math.round((topScore / (topScore + 14)) * 100)));

  const bestProduct = topMatches[0].product;
  const productRule = productRules.find((rule) => rule.id === bestProduct.id);

  return {
    matchedIds: topMatches.slice(0, 3).map((item) => item.product.id),
    reasoning: productRule
      ? `Strongest match for ${productRule.label} based on your description, product attributes, and intent.`
      : 'Matched by the strongest keyword and attribute overlap between your description and the catalog.',
    confidence,
  };
};

export async function POST(req: NextRequest) {
  try {
    const { query, imageBase64, products } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const isPlaceholderKey = !apiKey || apiKey.includes('your_actual') || apiKey.includes('your_');

    if (isPlaceholderKey && !imageBase64) {
      return NextResponse.json(buildLocalProductMatch(query || '', products || []));
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    const promptText = `
You are an intelligent e-commerce product search assistant for Salama Market.
You are given a product catalog in JSON format below:
${JSON.stringify(products, null, 2)}

User Search Query / Request: "${query || 'Identify the product in the image and find matching items'}"

Your Task:
1. Analyze the user query and/or the uploaded image carefully.
2. Select the matching product IDs from the catalog that best fit what the user is looking for.
3. Return ONLY a valid JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "matchedIds": ["p1", "p2"],
  "reasoning": "Brief 1-sentence explanation of why these match",
  "confidence": 87
}
`;

    const contentsParts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentsParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contentsParts.push({ text: promptText });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(buildLocalProductMatch(query || '', products || []));
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      return NextResponse.json(buildLocalProductMatch(query || '', products || []));
    }

    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const result = JSON.parse(cleanedText);
      return NextResponse.json({
        matchedIds: result.matchedIds || [],
        reasoning: result.reasoning || 'Matched based on product relevance.',
        confidence: typeof result.confidence === 'number' ? result.confidence : buildLocalProductMatch(query || '', products || []).confidence,
      });
    } catch {
      return NextResponse.json(buildLocalProductMatch(query || '', products || []));
    }
  } catch (error: any) {
    console.error('AI Search Error:', error);
    return NextResponse.json({ error: 'Failed to process AI search' }, { status: 500 });
  }
}
