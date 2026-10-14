// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: The 10 service trades offered on the platform
// TODO: Add icon names once the design is final; keep slugs in sync with the categories seeder

export const SERVICE_CATEGORIES = [
  { slug: 'plumbing', name: 'Plumbing' },
  { slug: 'electrical', name: 'Electrical' },
  { slug: 'ac-refrigeration', name: 'AC & Refrigeration' },
  { slug: 'carpentry', name: 'Carpentry' },
  { slug: 'masonry', name: 'Masonry' },
  { slug: 'painting', name: 'Painting' },
  { slug: 'appliance-repair', name: 'Appliance Repair' },
  { slug: 'cleaning', name: 'Cleaning' },
  { slug: 'gardening', name: 'Gardening' },
  { slug: 'other', name: 'Other' },
] as const;

export type CategorySlug = (typeof SERVICE_CATEGORIES)[number]['slug'];
