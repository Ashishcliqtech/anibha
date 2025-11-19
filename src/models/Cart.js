const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot price
  name: { type: String }, // snapshot name
  image: { type: String } // snapshot main image
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0 },
  updatedAt: { type: Date }
}, { timestamps: true });

cartSchema.methods.recalculate = function() {
  this.totalPrice = this.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  this.updatedAt = new Date();
};

module.exports = mongoose.model('Cart', cartSchema);
