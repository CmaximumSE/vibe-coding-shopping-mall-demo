const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '상품명은 필수입니다'],
    trim: true,
    maxlength: [100, '상품명은 100자 이하여야 합니다']
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [2000, '상품 설명은 2000자 이하여야 합니다']
  },
  price: {
    type: Number,
    required: [true, '가격은 필수입니다'],
    min: [0, '가격은 0 이상이어야 합니다']
  },
  originalPrice: {
    type: Number,
    min: [0, '원가는 0 이상이어야 합니다']
  },
  discount: {
    type: Number,
    min: [0, '할인율은 0 이상이어야 합니다'],
    max: [100, '할인율은 100 이하여야 합니다'],
    default: 0
  },
  images: [{
    type: String,
    required: [true, '상품 이미지는 필수입니다'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: '유효한 이미지 URL을 입력해주세요'
    }
  }],
  category: {
    type: String,
    required: [true, '카테고리는 필수입니다'],
    enum: {
      values: ['상의', '하의', '악세사리'],
      message: '카테고리는 상의, 하의, 악세사리 중 하나여야 합니다'
    }
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, '브랜드명은 50자 이하여야 합니다']
  },
  stock: {
    type: Number,
    required: [true, '재고는 필수입니다'],
    min: [0, '재고는 0 이상이어야 합니다'],
    default: 0
  },
  sizes: [{
    size: {
      type: String,
      required: true,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    stock: {
      type: Number,
      required: true,
      min: [0, '재고는 0 이상이어야 합니다'],
      default: 0
    }
  }],
  colors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    hex: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: '컬러는 유효한 hex 코드여야 합니다'
      }
    },
    stock: {
      type: Number,
      required: true,
      min: [0, '재고는 0 이상이어야 합니다'],
      default: 0
    }
  }],
  sku: {
    type: String,
    unique: true,
    required: [true, 'SKU는 필수입니다'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9-]+$/.test(v);
      },
      message: 'SKU는 영문 대문자, 숫자, 하이픈만 사용할 수 있습니다'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    weight: {
      type: String,
      trim: true
    },
    dimensions: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    warranty: {
      type: String,
      trim: true
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: [0, '평점은 0 이상이어야 합니다'],
      max: [5, '평점은 5 이하여야 합니다']
    },
    count: {
      type: Number,
      default: 0,
      min: [0, '평점 개수는 0 이상이어야 합니다']
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, '리뷰는 500자 이하여야 합니다']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNewProduct: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ sku: 1 }, { unique: true });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for savings amount
productSchema.virtual('savings').get(function() {
  if (this.discount > 0) {
    return this.price * (this.discount / 100);
  }
  return 0;
});

// Method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.stock > 0;
};

// Method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock += quantity;
  return this.save();
};

// Method to add review
productSchema.methods.addReview = function(userId, rating, comment) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(review => review.user.toString() === userId.toString());
  if (existingReview) {
    throw new Error('이미 리뷰를 작성하셨습니다');
  }

  this.reviews.push({ user: userId, rating, comment });
  
  // Update average rating
  this.updateAverageRating();
  
  return this.save();
};

// Method to update average rating
productSchema.methods.updateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings.average = sum / this.reviews.length;
    this.ratings.count = this.reviews.length;
  }
};

// Static method to find featured products
productSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, isActive: true })
    .populate('category', 'name')
    .sort({ createdAt: -1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId, isActive: true })
    .populate('category', 'name')
    .sort({ createdAt: -1 });
};

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.sku = `SKU-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Pre-save middleware to update average rating
productSchema.pre('save', function(next) {
  if (this.isModified('reviews')) {
    this.updateAverageRating();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
