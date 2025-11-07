const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const axios = require('axios');
const crypto = require('crypto');

/**
 * @desc    포트원 결제 검증
 * @param   {string} imp_uid - 포트원 거래 ID
 * @param   {number} amount - 검증할 금액
 * @returns {Promise<Object>} 결제 검증 결과
 */
const verifyPayment = async (imp_uid, amount) => {
  try {
    // 포트원 REST API 호출을 위한 토큰 발급
    const tokenResponse = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: process.env.PORTONE_REST_API_KEY || 'your_rest_api_key',
      imp_secret: process.env.PORTONE_REST_API_SECRET || 'your_rest_api_secret'
    });

    const accessToken = tokenResponse.data.response.access_token;

    // 결제 내역 조회
    const paymentResponse = await axios.get(
      `https://api.iamport.kr/payments/${imp_uid}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const paymentData = paymentResponse.data.response;

    // 결제 검증
    if (paymentData.status !== 'paid') {
      return {
        verified: false,
        error: '결제가 완료되지 않았습니다'
      };
    }

    // 금액 검증
    if (paymentData.amount !== amount) {
      return {
        verified: false,
        error: `결제 금액이 일치하지 않습니다 (결제: ${paymentData.amount}, 요청: ${amount})`
      };
    }

    return {
      verified: true,
      paymentData
    };
  } catch (error) {
    console.error('결제 검증 실패:', error.response?.data || error.message);
    return {
      verified: false,
      error: '결제 검증 중 오류가 발생했습니다'
    };
  }
};

/**
 * @desc    주문 중복 체크
 * @param   {string} userId - 사용자 ID
 * @param   {string} transactionId - 거래 ID
 * @param   {number} amount - 주문 금액
 * @param   {Array} items - 주문 상품 배열
 * @returns {Promise<boolean>} 중복 여부
 */
const checkDuplicateOrder = async (userId, transactionId, amount, items) => {
  try {
    // 동일한 거래 ID로 이미 주문이 있는지 확인
    if (transactionId) {
      const existingOrder = await Order.findOne({
        'payment.transactionId': transactionId,
        user: userId
      });

      if (existingOrder) {
        return true;
      }
    }

    // 동일한 상품, 동일한 금액, 1분 이내 주문이 있는지 확인 (중복 주문 방지)
    const recentOrder = await Order.findOne({
      user: userId,
      'pricing.totalAmount': amount,
      createdAt: {
        $gte: new Date(Date.now() - 60000) // 1분 이내
      }
    }).sort({ createdAt: -1 });

    if (recentOrder) {
      // 주문 상품 비교
      const newItems = items.map(i => ({
        product: i.product,
        quantity: i.quantity
      }));
      
      const oldItems = recentOrder.items.map(i => ({
        product: i.product.toString(),
        quantity: i.quantity
      }));

      const itemsMatch = JSON.stringify(newItems) === JSON.stringify(oldItems);

      if (itemsMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('주문 중복 체크 실패:', error);
    return false;
  }
};

/**
 * @desc    주문 생성
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { items, shippingAddress, billingAddress, payment, notes, metadata } = req.body;

    // 상품 검증 및 금액 계산
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `상품 ID ${item.product}를 찾을 수 없습니다`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `${product.name}은(는) 현재 판매되지 않는 상품입니다`
        });
      }

      // 재고 확인
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name}의 재고가 부족합니다 (요청: ${item.quantity}, 재고: ${product.stock})`
        });
      }

      const itemPrice = product.discount > 0 
        ? product.price * (1 - product.discount / 100)
        : product.price;

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
        size: item.size || null,
        color: item.color || null
      });

      // 재고 차감
      product.stock -= item.quantity;
      product.sales += item.quantity;
      await product.save();
    }

    // 배송비 계산 (50,000원 이상 무료배송)
    const FREE_SHIPPING_THRESHOLD = 50000;
    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 3000;

    // 총액 계산 (부가세 없음)
    const discount = payment.discount || { amount: 0, code: '', description: '' };
    const totalAmount = subtotal + shippingCost - discount.amount;

    // 결제 정보가 있는 경우 검증
    if (payment.status === 'paid' && payment.transactionId) {
      // 주문 중복 체크 (먼저 실행)
      const isDuplicate = await checkDuplicateOrder(
        req.userId,
        payment.transactionId,
        totalAmount,
        items
      );

      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: '중복된 주문입니다. 이미 처리된 주문이 있거나 동일한 결제 정보로 주문하려고 합니다.'
        });
      }

      // 결제 검증 (환경 변수가 설정된 경우에만 실행)
      if (process.env.PORTONE_REST_API_KEY && process.env.PORTONE_REST_API_SECRET) {
        console.log('결제 검증 시작:', payment.transactionId);
        const verificationResult = await verifyPayment(payment.transactionId, totalAmount);
        
        if (!verificationResult.verified) {
          console.error('결제 검증 실패:', verificationResult.error);
          return res.status(400).json({
            success: false,
            message: verificationResult.error || '결제 검증에 실패했습니다'
          });
        }
        console.log('결제 검증 성공');
      } else {
        console.warn('포트원 API 키가 설정되지 않아 결제 검증을 건너뜁니다. 개발 환경에서는 정상입니다.');
      }
    }

    // 주문 생성
    const orderData = {
      user: req.userId,
      items: validatedItems,
      pricing: {
        subtotal,
        shippingCost,
        tax: 0, // 부가세 없음
        discount,
        totalAmount
      },
      shippingAddress,
      billingAddress: billingAddress || { sameAsShipping: true },
      payment: {
        method: payment.method,
        status: payment.status || 'pending',
        transactionId: payment.transactionId || null,
        paidAt: payment.status === 'paid' ? new Date() : null
      },
      status: 'pending',
      metadata: metadata || { source: 'web' },
      notes
    };

    const order = new Order(orderData);
    await order.save();

    // 상품 정보와 함께 populate
    await order.populate('items.product', 'name images brand');

    res.status(201).json({
      success: true,
      message: '주문이 성공적으로 생성되었습니다',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: '주문 생성에 실패했습니다',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

/**
 * @desc    사용자의 주문 목록 조회
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate({
        path: 'items.product',
        select: 'name images brand'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    주문 상세 조회
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 권한 확인: 본인 주문이거나 관리자
    if (order.user._id.toString() !== req.userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이 주문에 접근할 권한이 없습니다'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: '주문 정보를 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    주문 번호로 조회
 * @route   GET /api/orders/number/:orderNumber
 * @access  Private
 */
exports.getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findByOrderNumber(req.params.orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    if (order.user._id.toString() !== req.userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이 주문에 접근할 권한이 없습니다'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: '주문 정보를 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    주문 상태 업데이트 (관리자)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 상태 업데이트
    await order.updateStatus(status, note || '', req.userId);

    // 상품 정보와 함께 populate
    await order.populate('items.product', 'name images');
    await order.populate('user', 'name email');

    res.json({
      success: true,
      message: '주문 상태가 성공적으로 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: '주문 상태 업데이트에 실패했습니다'
    });
  }
};

/**
 * @desc    배송 정보 업데이트 (관리자)
 * @route   PUT /api/orders/:id/shipping
 * @access  Private (Admin)
 */
exports.updateShipping = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    const { trackingNumber, company, estimatedDelivery } = req.body;

    await order.updateShipping({
      trackingNumber,
      company,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      shippedAt: new Date()
    });

    res.json({
      success: true,
      message: '배송 정보가 성공적으로 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('Update shipping error:', error);
    res.status(500).json({
      success: false,
      message: '배송 정보 업데이트에 실패했습니다'
    });
  }
};

/**
 * @desc    결제 상태 업데이트
 * @route   PUT /api/orders/:id/payment
 * @access  Private
 */
exports.updatePaymentStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors: errors.array()
      });
    }

    const { status, transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 권한 확인: 본인 주문이거나 관리자
    if (order.user.toString() !== req.userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이 주문의 결제 상태를 변경할 권한이 없습니다'
      });
    }

    await order.updatePaymentStatus(status, transactionId);
    await order.populate('items.product', 'name images');

    res.json({
      success: true,
      message: '결제 상태가 성공적으로 업데이트되었습니다',
      data: order
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: '결제 상태 업데이트에 실패했습니다'
    });
  }
};

/**
 * @desc    주문 취소
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 권한 확인
    if (order.user.toString() !== req.userId && req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '이 주문을 취소할 권한이 없습니다'
      });
    }

    // 취소 가능 여부 확인
    const notCancellableStatuses = ['delivered', 'cancelled', 'shipped'];
    if (notCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `${order.statusLabel} 상태의 주문은 취소할 수 없습니다`
      });
    }

    // 재고 복구
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.sales -= item.quantity;
        await product.save();
      }
    }

    // 주문 취소
    await order.cancel(reason || '고객 요청');

    res.json({
      success: true,
      message: '주문이 성공적으로 취소되었습니다',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: '주문 취소에 실패했습니다'
    });
  }
};

/**
 * @desc    관리자 - 모든 주문 조회
 * @route   GET /api/orders/admin/all
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentStatus, search, date, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    
    // 날짜 필터링
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    // 검색 필터링 (주문번호, 고객명, 이메일)
    if (search) {
      // 사용자 이름이나 이메일로 검색
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      // 주문번호 또는 사용자 ID로 검색
      const searchConditions = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
      
      if (userIds.length > 0) {
        searchConditions.push({ user: { $in: userIds } });
      }
      
      // 기존 필터와 검색 조건을 $and로 결합
      const baseFilter = { ...filter };
      filter.$and = [
        baseFilter,
        { $or: searchConditions }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate({
        path: 'items.product',
        select: 'name images brand'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalOrders: total,
          hasNext: skip + orders.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    주문 통계 조회
 * @route   GET /api/orders/stats
 * @access  Private
 */
exports.getOrderStats = async (req, res) => {
  try {
    // 사용자별 또는 전체 통계
    const userId = req.user.user_type === 'admin' ? null : req.userId;
    const stats = await Order.getStatistics(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: '주문 통계를 불러오는데 실패했습니다'
    });
  }
};

/**
 * @desc    취소 가능한 주문 조회
 * @route   GET /api/orders/cancellable
 * @access  Private
 */
exports.getCancellableOrders = async (req, res) => {
  try {
    const orders = await Order.findCancellableOrders(req.userId)
      .populate('items.product', 'name images');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get cancellable orders error:', error);
    res.status(500).json({
      success: false,
      message: '취소 가능한 주문 목록을 불러오는데 실패했습니다'
    });
  }
};
