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
  timestamps: true
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

module.exports = mongoose.model('Product', productSchema);
