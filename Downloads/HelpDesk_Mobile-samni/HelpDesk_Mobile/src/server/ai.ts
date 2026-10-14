// AI problem triage. The customer describes a problem in their own words and we suggest
// the trade, a job title, urgency, a cost range and safety tips.
// Gemini is used when GEMINI_API_KEY is set; otherwise (or if the call fails) a keyword
// classifier answers so the booking flow never depends on the AI being available.

import { GoogleGenAI, Type } from '@google/genai';
import type { AiClassification, CategorySlug, PricingRule, Urgency } from '../types/index.ts';
import { SERVICE_CATEGORIES } from '../types/index.ts';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

const SLUGS = SERVICE_CATEGORIES.map((c) => c.slug) as CategorySlug[];

const KEYWORDS: Record<CategorySlug, string[]> = {
  plumbing: ['leak', 'pipe', 'tap', 'drain', 'sink', 'toilet', 'water', 'tank', 'pump', 'shower', 'blocked', 'clog'],
  electrical: ['socket', 'wire', 'wiring', 'power', 'breaker', 'trip', 'light', 'switch', 'spark', 'fan', 'electric', 'fuse', 'shock'],
  'ac-refrigeration': ['ac', 'air con', 'aircon', 'air-con', 'cooling', 'fridge', 'refrigerator', 'freezer', 'gas refill'],
  carpentry: ['door', 'window', 'cupboard', 'wardrobe', 'wood', 'furniture', 'hinge', 'drawer', 'termite'],
  masonry: ['wall', 'crack', 'tile', 'plaster', 'cement', 'brick', 'floor', 'roof'],
  painting: ['paint', 'repaint', 'damp', 'peeling', 'waterproof'],
  'appliance-repair': ['washing machine', 'oven', 'microwave', 'tv', 'television', 'blender', 'iron', 'heater', 'appliance'],
  cleaning: ['clean', 'dust', 'sofa', 'carpet', 'mould', 'mold', 'deep clean', 'move out'],
  gardening: ['garden', 'grass', 'lawn', 'hedge', 'tree', 'plant', 'weed'],
  other: [],
};

const URGENT_WORDS = ['spark', 'smoke', 'burning', 'fire', 'flood', 'shock', 'gas smell', 'burst', 'urgent', 'emergency', 'no power', 'overflow'];

const SAFETY_TIPS: Record<CategorySlug, string[]> = {
  plumbing: ['Close the main water valve if the leak is getting worse.', 'Keep electrical appliances away from standing water.'],
  electrical: ['Switch off the circuit at the breaker before touching anything.', 'Do not use the faulty socket or switch until it has been checked.'],
  'ac-refrigeration': ['Switch the unit off at the wall to stop it straining.', 'Keep the area around the outdoor unit clear.'],
  carpentry: ['Keep children away from loose doors or broken glass.'],
  masonry: ['Stay clear of walls with new or widening cracks.'],
  painting: ['Ventilate the room and keep paint away from children.'],
  'appliance-repair': ['Unplug the appliance before inspecting it.', 'Do not open the back cover of TVs or microwaves yourself.'],
  cleaning: ['Do not mix bleach with other cleaning products.'],
  gardening: ['Keep pets away from freshly treated lawns.'],
  other: ['If anything feels unsafe, switch off power or water at the mains.'],
};

function costRange(slug: CategorySlug, urgency: Urgency, rules: { slug: CategorySlug; rule: PricingRule }[]) {
  const rule = rules.find((r) => r.slug === slug)?.rule;
  const base = rule?.baseFee ?? 1500;
  const hourlyMin = rule?.minHourlyRate ?? 1200;
  const hourlyMax = rule?.maxHourlyRate ?? 2500;
  const multiplier = urgency === 'URGENT' ? 1.25 : 1;
  return {
    min: Math.round(((base + hourlyMin) * multiplier) / 100) * 100,
    max: Math.round(((base + hourlyMax * 3) * multiplier) / 100) * 100,
  };
}

/** Keyword-based classification, used without an API key or when Gemini fails. */
export function classifyWithKeywords(
  description: string,
  rules: { slug: CategorySlug; rule: PricingRule }[],
): AiClassification {
  const text = ` ${description.toLowerCase()} `;
  let best: CategorySlug = 'other';
  let bestScore = 0;
  for (const slug of SLUGS) {
    // Short words ("ac", "tv") must match whole words; longer ones may have suffixes ("leaking").
    const score = KEYWORDS[slug].filter((word) => new RegExp(word.length <= 3 ? `\\b${word}\\b` : `\\b${word}`).test(text)).length;
    if (score > bestScore) {
      best = slug;
      bestScore = score;
    }
  }
  const urgency: Urgency = URGENT_WORDS.some((w) => text.includes(w)) ? 'URGENT' : 'NORMAL';
  const name = SERVICE_CATEGORIES.find((c) => c.slug === best)!.name;
  const firstSentence = description.trim().split(/[.!?\n]/)[0].slice(0, 60);
  return {
    categorySlug: best,
    title: firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1) || `${name} job`,
    summary:
      best === 'other'
        ? 'We could not match this to a specific trade. A general handyman can take a look.'
        : `This looks like a ${name.toLowerCase()} job.${urgency === 'URGENT' ? ' It sounds urgent, so we will prioritise it.' : ''}`,
    urgency,
    estimatedCostRange: costRange(best, urgency, rules),
    safetyTips: SAFETY_TIPS[best],
    source: 'fallback',
  };
}

export async function classifyProblem(
  description: string,
  rules: { slug: CategorySlug; rule: PricingRule }[],
): Promise<AiClassification> {
  const ai = getClient();
  if (!ai) return classifyWithKeywords(description, rules);

  const prompt = `You are the triage assistant for HelpDesk, a home-services marketplace in Sri Lanka.
A customer described a problem. Classify it into exactly one trade and help them book.

Trades (use the slug): ${SERVICE_CATEGORIES.map((c) => `${c.slug} (${c.name})`).join(', ')}.

Return:
- categorySlug: the best trade slug
- title: a short job title (max 60 characters)
- summary: 1-2 sentences in plain English explaining the likely cause, for the customer
- urgency: URGENT if there is a safety risk (fire, electric shock, flooding, gas) or the home is unusable, LOW if cosmetic, otherwise NORMAL
- safetyTips: up to 3 short, practical things the customer can do safely before the provider arrives

Customer's description:
"""${description}"""`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categorySlug: { type: Type.STRING, enum: SLUGS },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['LOW', 'NORMAL', 'URGENT'] },
            safetyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['categorySlug', 'title', 'summary', 'urgency', 'safetyTips'],
        },
      },
    });
    const parsed = JSON.parse(response.text ?? '{}') as Partial<AiClassification>;
    const slug = SLUGS.includes(parsed.categorySlug as CategorySlug) ? (parsed.categorySlug as CategorySlug) : 'other';
    const urgency: Urgency = parsed.urgency === 'URGENT' || parsed.urgency === 'LOW' ? parsed.urgency : 'NORMAL';
    return {
      categorySlug: slug,
      title: (parsed.title ?? '').slice(0, 60) || 'Home service request',
      summary: parsed.summary ?? '',
      urgency,
      estimatedCostRange: costRange(slug, urgency, rules),
      safetyTips: (parsed.safetyTips ?? []).slice(0, 3),
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[ai] Gemini classification failed, using keyword fallback:', (err as Error).message);
    return classifyWithKeywords(description, rules);
  }
}
