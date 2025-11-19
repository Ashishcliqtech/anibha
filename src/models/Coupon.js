const mongoose = require('mongoose');

const usedBySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  uses: { type: Number, default: 0 }
}, { _id: false });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true }, // percent (0-100) or fixed amount in currency
  maxDiscount: { type: Number }, // optional cap for percentage coupons
  minOrderAmount: { type: Number, default: 0 },
  applicableProducts: [{ type: mongoose.Schema.ObjectId, ref: 'Product' }],
  applicableCategories: [{ type: String }],
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
  maxUses: { type: Number }, // global usage cap
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [usedBySchema],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' }
}, { timestamps: true });

couponSchema.methods.isValidForUser = function(userId, subtotal, cartItems = []) {
  if (!this.active) return { valid: false, reason: 'Coupon is not active' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, reason: 'Coupon expired' };
  if (this.maxUses && this.usedCount >= this.maxUses) return { valid: false, reason: 'Coupon usage limit reached' };
  if (this.minOrderAmount && subtotal < this.minOrderAmount) return { valid: false, reason: 'Minimum order amount not met' };

  // If coupon targets products or categories, ensure cart contains at least one
  if ((this.applicableProducts && this.applicableProducts.length) || (this.applicableCategories && this.applicableCategories.length)) {
    const cartProductIds = cartItems.map(i => i.product && i.product.toString());
    const intersectsProduct = (this.applicableProducts && this.applicableProducts.some(p => cartProductIds.includes(p.toString())));
    const intersectsCategory = this.applicableCategories && cartItems.some(ci => this.applicableCategories.includes(ci.category));
    if (!intersectsProduct && !intersectsCategory) return { valid: false, reason: 'Coupon not applicable to selected products' };
  }

  const userUsage = this.usedBy && this.usedBy.find(u => u.user.toString() === (userId ? userId.toString() : ''));
  if (userUsage && this.perUserLimit && userUsage.uses >= this.perUserLimit) return { valid: false, reason: 'Coupon usage limit per user reached' };

  return { valid: true };
};

couponSchema.methods.applyDiscount = function(subtotal) {
  let discount = 0;
  if (this.type === 'percentage') {
    discount = subtotal * (this.value / 100);
    if (this.maxDiscount && discount > this.maxDiscount) discount = this.maxDiscount;
  } else if (this.type === 'fixed') {
    discount = this.value;
  }
  if (discount > subtotal) discount = subtotal;
  return discount;
};

module.exports = mongoose.model('Coupon', couponSchema);
