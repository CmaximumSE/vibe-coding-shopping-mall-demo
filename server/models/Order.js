const mongoose = require('mongoose');

/**
 * Order Schema
 * 주문 정보를 저장하는 스키마
 * 
 * 주요 필드:
 * - user: 주문한 사용자
 * - items: 주문 상품 목록
 * - addresses: 배송 및 청구 주소
 * - pricing: 금액 정보
 * - payment: 결제 정보
 * - status: 주문 및 배송 상태
 */
const orderSchema = new mongoose.Schema({
  // ==================== 사용자 정보 ====================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 정보는 필수입니다'],
    index: true
  },

  // ==================== 주문 번호 ====================
  orderNumber: {
    type: String,
    unique: true,
    required: false, // pre-save에서 자동 생성
    index: true
  },

  // ==================== 주문 상품 ====================
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 정보는 필수입니다']
    },
    name: {
      type: String,
      required: [true, '상품명은 필수입니다']
    },
    quantity: {
      type: Number,
      required: [true, '수량은 필수입니다'],
      min: [1, '수량은 1 이상이어야 합니다']
    },
    price: {
      type: Number,
      required: [true, '가격은 필수입니다'],
      min: [0, '가격은 0 이상이어야 합니다']
    },
    total: {
      type: Number,
      required: true,
      min: [0, '총액은 0 이상이어야 합니다']
    },
    size: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    }
  }],

  // ==================== 금액 정보 ====================
  pricing: {
  subtotal: {
    type: Number,
    required: [true, '소계는 필수입니다'],
    min: [0, '소계는 0 이상이어야 합니다']
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: [0, '배송비는 0 이상이어야 합니다']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, '세금은 0 이상이어야 합니다']
  },
  discount: {
    amount: {
      type: Number,
      default: 0,
      min: [0, '할인금액은 0 이상이어야 합니다']
    },
    code: {
        type: String,
        trim: true
      },
      description: {
      type: String,
      trim: true
    }
  },
  totalAmount: {
    type: Number,
    required: [true, '총액은 필수입니다'],
    min: [0, '총액은 0 이상이어야 합니다']
    }
  },

  // ==================== 배송 주소 ====================
  shippingAddress: {
    name: {
      type: String,
      required: [true, '받는 사람 이름은 필수입니다'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, '전화번호는 필수입니다'],
      trim: true
    },
    street: {
      type: String,
      required: [true, '주소는 필수입니다'],
      trim: true
    },
    detailAddress: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, '도시는 필수입니다'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      required: [true, '우편번호는 필수입니다'],
      trim: true
    },
    country: {
      type: String,
      required: [true, '국가는 필수입니다'],
      trim: true,
      default: 'South Korea'
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: [200, '배송 지시사항은 200자 이하여야 합니다']
    }
  },

  // ==================== 청구 주소 ====================
  billingAddress: {
    sameAsShipping: {
      type: Boolean,
      default: true
    },
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    street: {
      type: String,
      trim: true
    },
    detailAddress: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },

  // ==================== 결제 정보 ====================
  payment: {
    method: {
    type: String,
    required: [true, '결제 방법은 필수입니다'],
      enum: {
        values: ['card', 'bank_transfer', 'kakao', 'paypal', 'toss', 'cash_on_delivery'],
        message: '지원하지 않는 결제 방법입니다'
      }
  },
    status: {
    type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded', 'partial_refund', 'cancelled'],
        message: '유효하지 않은 결제 상태입니다'
      },
    default: 'pending'
  },
    transactionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    refundedAt: {
      type: Date
    }
  },

  // ==================== 주문 상태 ====================
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      message: '유효하지 않은 주문 상태입니다'
    },
    default: 'pending',
    index: true
  },

  // ==================== 배송 정보 ====================
  shipping: {
  trackingNumber: {
    type: String,
    trim: true
  },
    company: {
    type: String,
    trim: true
  },
  estimatedDelivery: {
    type: Date
  },
    shippedAt: {
      type: Date
    },
  deliveredAt: {
    type: Date
    }
  },

  // ==================== 추가 정보 ====================
  notes: {
    type: String,
    trim: true,
    maxlength: [500, '주문 메모는 500자 이하여야 합니다']
  },

  // ==================== 상태 이력 ====================
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // ==================== 메타 정보 ====================
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'admin'],
      default: 'web'
    },
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== 인덱스 ====================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });

// ==================== Virtual Properties ====================
// 총 상품 개수
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// 포맷된 주문 번호
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `ORD-${this.orderNumber}`;
});

// 주문 상태 라벨
orderSchema.virtual('statusLabel').get(function() {
  const labels = {
    pending: '주문 대기중',
    confirmed: '주문 확정',
    processing: '처리중',
    shipped: '배송중',
    delivered: '배송 완료',
    cancelled: '취소됨',
    returned: '반품됨'
  };
  return labels[this.status] || this.status;
});

// ==================== Instance Methods ====================
// 주문 상태 업데이트
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note,
    updatedBy: updatedBy
  });
  return this.save();
};

// 결제 상태 업데이트
orderSchema.methods.updatePaymentStatus = function(status, transactionId = null) {
  this.payment.status = status;
  if (transactionId) {
    this.payment.transactionId = transactionId;
  }
  if (status === 'paid') {
    this.payment.paidAt = new Date();
  }
  return this.save();
};

// 배송 정보 업데이트
orderSchema.methods.updateShipping = function(shippingData) {
  if (shippingData.trackingNumber) {
    this.shipping.trackingNumber = shippingData.trackingNumber;
  }
  if (shippingData.company) {
    this.shipping.company = shippingData.company;
  }
  if (shippingData.estimatedDelivery) {
    this.shipping.estimatedDelivery = shippingData.estimatedDelivery;
  }
  if (shippingData.shippedAt) {
    this.shipping.shippedAt = shippingData.shippedAt;
  }
  return this.save();
};

// 주문 취소
orderSchema.methods.cancel = function(reason = '') {
  this.status = 'cancelled';
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason || '주문이 취소되었습니다'
  });
  return this.save();
};

// 금액 계산
orderSchema.methods.calculateTotals = function() {
  // 소계 계산
  this.pricing.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // 총액 계산
  this.pricing.totalAmount = 
    this.pricing.subtotal + 
    this.pricing.shippingCost + 
    this.pricing.tax - 
    this.pricing.discount.amount;
  
  return this;
};

// ==================== Static Methods ====================
// 주문 번호 생성
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${random}`;
};

// 주문 통계 조회
orderSchema.statics.getStatistics = async function(userId = null) {
  const match = userId ? { user: userId } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount
    };
    return acc;
  }, {});
};

// 사용자의 주문 목록 조회
orderSchema.statics.findByUser = function(userId, options = {}) {
  const { status, limit = 20, skip = 0, sort = { createdAt: -1 } } = options;
  
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('items.product', 'name images')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// 주문 번호로 조회
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber })
    .populate('user', 'name email phone')
    .populate('items.product');
};

// 취소 가능한 주문 목록 조회
orderSchema.statics.findCancellableOrders = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['pending', 'confirmed'] },
    'payment.status': { $in: ['pending', 'failed'] }
  });
};

// ==================== Middleware ====================
// 저장 전: 주문 번호 생성 및 초기화
orderSchema.pre('save', async function(next) {
  // 주문 번호 자동 생성
  if (!this.orderNumber) {
    this.orderNumber = this.constructor.generateOrderNumber();
  }
  
  // 상태 이력 초기화
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: '주문이 생성되었습니다'
    });
  }
  
  // 금액 계산
  if (this.isModified('items') || this.isModified('pricing')) {
    this.calculateTotals();
  }
  
  next();
});

// 청구 주소 자동 설정
orderSchema.pre('save', function(next) {
  // 청구 주소가 배송 주소와 같도록 설정
  if (this.billingAddress.sameAsShipping) {
    this.billingAddress.name = this.shippingAddress.name;
    this.billingAddress.phone = this.shippingAddress.phone;
    this.billingAddress.street = this.shippingAddress.street;
    this.billingAddress.detailAddress = this.shippingAddress.detailAddress;
    this.billingAddress.city = this.shippingAddress.city;
    this.billingAddress.state = this.shippingAddress.state;
    this.billingAddress.postalCode = this.shippingAddress.postalCode;
    this.billingAddress.country = this.shippingAddress.country;
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
