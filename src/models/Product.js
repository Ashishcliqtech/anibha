const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  category: {
    type: String,
    trim: true,
    index: true
  },
  material: {
    type: String,
    trim: true
  },
  metalType: {
    type: String,
    trim: true
  },
  // Additional descriptive fields (from product detail view)
  brand: { type: String, trim: true, index: true },
  modelNumber: { type: String, trim: true },
  baseMaterial: { type: String, trim: true },
  color: { type: String, trim: true },
  type: { type: String, trim: true },
  idealFor: { type: String, trim: true },
  plating: { type: String, trim: true },
  certification: { type: String, trim: true },
  netQuantity: { type: Number, min: 0, default: 1 },
  brandColor: { type: String, trim: true },
  warrantySummary: { type: String, trim: true },
  domesticWarranty: { type: String, trim: true },
  internationalWarranty: { type: String, trim: true },
  salesPackage: { type: String, trim: true },
  productCollection: { type: String, trim: true },
  occasion: { type: String, trim: true },
  otherDimensions: { type: String, trim: true },
  chainLength: { type: String, trim: true },
  // Primary main image + additional gallery images
  mainImage: { type: String, trim: true },
  gemstones: [{ type: String, trim: true }],
  images: [{ type: String, trim: true }],
  weightInGrams: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  tags: [{ type: String, trim: true }],
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  suppressReservedKeysWarning: true
});

// Slug generation
productSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Text index for search across name and description
productSchema.index({ name: 'text', description: 'text' });

// Indexes to improve common queries
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });

// MRP / discount fields
productSchema.add({
  mrp: { type: Number, min: 0 },
  discountPercent: { type: Number, min: 0, max: 100 },
  discountAmount: { type: Number, min: 0 }
});

// Virtual: selling price computed from MRP and discount (if provided).
productSchema.virtual('sellingPrice').get(function() {
  const mrp = (this.mrp !== undefined && this.mrp !== null) ? Number(this.mrp) : null;
  const discountPercent = (this.discountPercent !== undefined && this.discountPercent !== null) ? Number(this.discountPercent) : null;
  const discountAmount = (this.discountAmount !== undefined && this.discountAmount !== null) ? Number(this.discountAmount) : null;

  if (mrp !== null) {
    if (discountPercent !== null) {
      return Math.max(0, Math.round((mrp * (1 - discountPercent / 100)) * 100) / 100);
    }
    if (discountAmount !== null) {
      return Math.max(0, Math.round((mrp - discountAmount) * 100) / 100);
    }
    // If only MRP provided, treat selling price as MRP (no discount)
    return Math.round(mrp * 100) / 100;
  }

  // Fallback to explicit price stored on document
  return (this.price !== undefined && this.price !== null) ? Number(this.price) : null;
});

module.exports = mongoose.model('Product', productSchema);
