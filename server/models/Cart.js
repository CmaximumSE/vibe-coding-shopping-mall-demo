const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 ID는 필수입니다']
  },
  quantity: {
    type: Number,
    required: [true, '수량은 필수입니다'],
    min: [1, '수량은 1개 이상이어야 합니다'],
    max: [999, '수량은 999개 이하여야 합니다'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, '가격은 필수입니다'],
    min: [0, '가격은 0 이상이어야 합니다']
  },
  size: {
    type: String,
    trim: true,
    maxlength: [10, '사이즈는 10자 이하여야 합니다']
  },
  color: {
    type: String,
    trim: true,
    maxlength: [20, '컬러는 20자 이하여야 합니다']
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, '메모는 200자 이하여야 합니다']
  }
}, {
  _id: true,
  timestamps: false
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 ID는 필수입니다'],
    unique: true
  },
  items: [cartItemSchema],
  totalItems: {
    type: Number,
    default: 0,
    min: [0, '총 아이템 수는 0 이상이어야 합니다']
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, '총 가격은 0 이상이어야 합니다']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ lastUpdated: -1 });
cartSchema.index({ isActive: 1 });

// Virtual for cart summary
cartSchema.virtual('summary').get(function() {
  return {
    totalItems: this.totalItems,
    totalPrice: this.totalPrice,
    itemCount: this.items.length,
    isEmpty: this.items.length === 0
  };
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  this.lastUpdated = new Date();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity = 1, options = {}) {
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() &&
    item.size === options.size &&
    item.color === options.color
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].addedAt = new Date();
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      size: options.size,
      color: options.color,
      price: options.price || 0,
      notes: options.notes
    });
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId.toString());
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }
    item.quantity = quantity;
    item.addedAt = new Date();
  }
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Method to check if product exists in cart
cartSchema.methods.hasProduct = function(productId, size = null, color = null) {
  return this.items.some(item => 
    item.product.toString() === productId.toString() &&
    (size === null || item.size === size) &&
    (color === null || item.color === color)
  );
};

// Method to get item by product ID
cartSchema.methods.getItemByProduct = function(productId, size = null, color = null) {
  return this.items.find(item => 
    item.product.toString() === productId.toString() &&
    (size === null || item.size === size) &&
    (color === null || item.color === color)
  );
};

// Method to calculate shipping cost
cartSchema.methods.calculateShipping = function() {
  const FREE_SHIPPING_THRESHOLD = 50000; // 50,000원 이상 무료배송
  const SHIPPING_COST = 3000; // 기본 배송비 3,000원
  
  if (this.totalPrice >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return SHIPPING_COST;
};

// Method to get cart with populated products
cartSchema.methods.getCartWithProducts = function() {
  return this.populate({
    path: 'items.product',
    select: 'name price images category stock sizes specifications brand'
  });
};

// Static method to find cart by user
cartSchema.statics.findByUser = function(userId) {
  return this.findOne({ user: userId, isActive: true })
    .populate({
      path: 'items.product',
      select: 'name price images category stock sizes specifications brand'
    });
};

// Static method to create or get cart for user
cartSchema.statics.createOrGetCart = async function(userId) {
  let cart = await this.findOne({ user: userId, isActive: true });
  
  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }
  
  return cart;
};

// Static method to merge carts (useful for guest to user conversion)
cartSchema.statics.mergeCarts = async function(guestCart, userId) {
  const userCart = await this.createOrGetCart(userId);
  
  for (const item of guestCart.items) {
    await userCart.addItem(
      item.product,
      item.quantity,
      {
        size: item.size,
        color: item.color,
        price: item.price,
        notes: item.notes
      }
    );
  }
  
  return userCart;
};

// Pre-remove middleware to clean up related data
cartSchema.pre('remove', function(next) {
  // Add any cleanup logic here if needed
  next();
});

// Post-save middleware to update user's last activity
cartSchema.post('save', function() {
  // Update user's last activity if needed
  // This could be handled by a separate service
});

module.exports = mongoose.model('Cart', cartSchema);
