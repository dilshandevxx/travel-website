/**
 * DRAFT seeder — written by Member 3 (Backend). Owned by Member 4 (Database).
 * Inserts the nine launch service categories.
 */
'use strict';

const CATEGORIES = [
  ['Plumbing', 'plumbing', 'Leaks, blocked drains, pipe and fixture installation'],
  ['Electrical', 'electrical', 'Wiring, sockets, lighting and electrical faults'],
  ['Carpentry', 'carpentry', 'Furniture, doors, windows and woodwork repairs'],
  ['Masonry', 'masonry', 'Brickwork, plastering, tiling and concrete repairs'],
  ['Painting', 'painting', 'Interior and exterior painting'],
  ['AC/Refrigeration Repair', 'ac-refrigeration-repair', 'Air conditioner and refrigerator servicing and repair'],
  ['Appliance Repair', 'appliance-repair', 'Washing machines, ovens and other household appliances'],
  ['Cleaning', 'cleaning', 'Home, deep and post-construction cleaning'],
  ['Gardening', 'gardening', 'Lawn care, trimming and garden maintenance'],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'service_categories',
      CATEGORIES.map(([name, slug, description]) => ({
        name,
        slug,
        description,
        is_active: true,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true } // safe to run more than once
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('service_categories', {
      slug: CATEGORIES.map(([, slug]) => slug),
    });
  },
};
