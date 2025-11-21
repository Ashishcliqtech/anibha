// Sample product seed data for testing MRP/discount + mainImage + gallery images
module.exports = {
  name: 'Sample Alloy Gold-plated Necklace',
  description: 'Beautiful alloy gold-plated necklace with black beads. Ideal for ethnic wear.',
  mrp: 999.00,
  discountPercent: 81,
  // discountAmount: 811, // alternative to percent
  // price will be computed by server when using create endpoint
  currency: 'INR',
  sku: 'BULSENK-NECK-001',
  category: 'Jewellery',
  material: 'Alloy',
  metalType: 'Gold-plated',
  mainImage: 'https://example.com/main-image.jpg',
  images: [
    'https://example.com/gallery-1.jpg',
    'https://example.com/gallery-2.jpg'
  ],
  stock: 25,
  tags: ['ethnic', 'necklace'],
  weightInGrams: 45,
  dimensions: { length: 30 },
  brand: 'bulsenk',
  modelNumber: 'b-gk1-sp',
  plating: 'Gold-plated',
  collection: 'Ethnic',
  occasion: 'Everyday, Love, Workwear'
};
