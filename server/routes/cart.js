const express = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ==========================================
// 장바구니 조회 관련 라우트
// ==========================================

/**
 * @route   GET /api/cart
 * @desc    사용자 장바구니 조회
 * @access  Private
 */
router.get('/', auth, cartController.getCart);

/**
 * @route   GET /api/cart/summary
 * @desc    장바구니 요약 정보 조회
 * @access  Private
 */
router.get('/summary', auth, cartController.getCartSummary);

// ==========================================
// 장바구니 아이템 관리 라우트
// ==========================================

/**
 * @route   POST /api/cart/items
 * @desc    장바구니에 상품 추가
 * @access  Private
 */
router.post('/items', [
  auth,
  body('productId')
    .notEmpty()
    .withMessage('상품 ID는 필수입니다')
    .isMongoId()
    .withMessage('올바른 상품 ID를 입력해주세요'),
  body('quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('수량은 1-999 사이의 숫자여야 합니다'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상의 숫자여야 합니다'),
  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('메모는 200자 이하여야 합니다')
    .trim()
], cartController.addToCart);

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    장바구니 아이템 수량 변경
 * @access  Private
 */
router.put('/items/:itemId', [
  auth,
  body('quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('수량은 1-999 사이의 숫자여야 합니다')
], cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    장바구니에서 아이템 제거
 * @access  Private
 */
router.delete('/items/:itemId', auth, cartController.removeFromCart);

// ==========================================
// 장바구니 전체 관리 라우트
// ==========================================

/**
 * @route   DELETE /api/cart
 * @desc    장바구니 전체 비우기
 * @access  Private
 */
router.delete('/', auth, cartController.clearCart);

/**
 * @route   POST /api/cart/merge
 * @desc    게스트 장바구니와 사용자 장바구니 병합
 * @access  Private
 */
router.post('/merge', [
  auth,
  body('guestCartItems')
    .isArray({ min: 0 })
    .withMessage('게스트 장바구니 아이템은 배열이어야 합니다'),
  body('guestCartItems.*.productId')
    .isMongoId()
    .withMessage('올바른 상품 ID를 입력해주세요'),
  body('guestCartItems.*.quantity')
    .isInt({ min: 1, max: 999 })
    .withMessage('수량은 1-999 사이의 숫자여야 합니다'),
  body('guestCartItems.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('가격은 0 이상의 숫자여야 합니다'),
  body('guestCartItems.*.notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('메모는 200자 이하여야 합니다')
    .trim()
], cartController.mergeCarts);

module.exports = router;
