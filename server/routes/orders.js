const express = require('express');
const { body, query, param } = require('express-validator');
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// ==================== Validation Rules ====================

// 주문 생성 검증
const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('주문 상품이 필요합니다'),
  body('items.*.product').isMongoId().withMessage('유효한 상품 ID가 필요합니다'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('수량은 1개 이상이어야 합니다'),
  body('shippingAddress.name').notEmpty().withMessage('받는 사람 이름은 필수입니다'),
  body('shippingAddress.phone').notEmpty().withMessage('전화번호는 필수입니다'),
  body('shippingAddress.street').notEmpty().withMessage('주소는 필수입니다'),
  body('shippingAddress.city').notEmpty().withMessage('도시는 필수입니다'),
  body('shippingAddress.postalCode').notEmpty().withMessage('우편번호는 필수입니다'),
  body('payment.method').isIn(['card', 'bank_transfer', 'kakao', 'paypal', 'toss', 'cash_on_delivery'])
    .withMessage('유효하지 않은 결제 방법입니다')
];

// 주문 상태 업데이트 검증
const updateStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
    .withMessage('유효하지 않은 주문 상태입니다')
];

// 배송 정보 업데이트 검증
const updateShippingValidation = [
  body('trackingNumber').optional().isString(),
  body('company').optional().isString(),
  body('estimatedDelivery').optional().isISO8601()
];

// 결제 상태 업데이트 검증
const updatePaymentValidation = [
  body('status').isIn(['pending', 'paid', 'failed', 'refunded', 'partial_refund', 'cancelled'])
    .withMessage('유효하지 않은 결제 상태입니다'),
  body('transactionId').optional().isString()
];

// ==================== Routes ====================

/**
 * @route   POST /api/orders
 * @desc    주문 생성
 * @access  Private
 */
router.post('/', auth, createOrderValidation, orderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    사용자의 주문 목록 조회
 * @access  Private
 */
router.get('/', auth, orderController.getOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    주문 통계 조회
 * @access  Private
 */
router.get('/stats', auth, orderController.getOrderStats);

/**
 * @route   GET /api/orders/cancellable
 * @desc    취소 가능한 주문 조회
 * @access  Private
 */
router.get('/cancellable', auth, orderController.getCancellableOrders);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    주문 번호로 조회
 * @access  Private
 */
router.get('/number/:orderNumber', auth, orderController.getOrderByNumber);

/**
 * @route   GET /api/orders/:id
 * @desc    주문 상세 조회
 * @access  Private
 */
router.get('/:id', auth, orderController.getOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    주문 상태 업데이트 (관리자)
 * @access  Private (Admin)
 */
router.put('/:id/status', auth, adminAuth, updateStatusValidation, orderController.updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/shipping
 * @desc    배송 정보 업데이트 (관리자)
 * @access  Private (Admin)
 */
router.put('/:id/shipping', auth, adminAuth, updateShippingValidation, orderController.updateShipping);

/**
 * @route   PUT /api/orders/:id/payment
 * @desc    결제 상태 업데이트
 * @access  Private
 */
router.put('/:id/payment', auth, updatePaymentValidation, orderController.updatePaymentStatus);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    주문 취소
 * @access  Private
 */
router.put('/:id/cancel', auth, orderController.cancelOrder);

// ==================== Admin Routes ====================

/**
 * @route   GET /api/orders/admin/all
 * @desc    관리자 - 모든 주문 조회
 * @access  Private (Admin)
 */
router.get('/admin/all', auth, adminAuth, orderController.getAllOrders);

module.exports = router;
